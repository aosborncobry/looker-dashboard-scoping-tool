import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { createClient } from "npm:@supabase/supabase-js";
import { Resend } from "npm:resend";

const app = new Hono();

// Initialize Supabase client for storage and bucket creation
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const BUCKET_NAME = "make-6af5a51f-assets";

// Idempotently create bucket
(async () => {
  const { data: buckets } = await supabaseAdmin.storage.listBuckets();
  const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME);
  if (!bucketExists) {
    await supabaseAdmin.storage.createBucket(BUCKET_NAME, { public: true }); 
  }
})();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Helper to send email via Resend
async function sendEmail(to: string, subject: string, html: string) {
  let apiKey = Deno.env.get("RESEND_API_KEY")?.trim();
  let fromEmailRaw = Deno.env.get("RESEND_FROM_EMAIL")?.trim();
  let fromNameRaw = Deno.env.get("RESEND_FROM_NAME")?.trim();

  // If the fromEmail looks like a secret value/token (doesn't contain @), use a fallback
  const isLikelyToken = fromEmailRaw && !fromEmailRaw.includes("@");
  
  let fromEmail = (fromEmailRaw && !isLikelyToken) ? fromEmailRaw : "onboarding@resend.dev";
  let fromName = (fromNameRaw && fromNameRaw.length < 50) ? fromNameRaw : "Cobry Survey";

  if (!apiKey) {
    return { success: false, error: "RESEND_API_KEY secret is missing. Please set it in the sidebar." };
  }

  // Clean the key: remove quotes and "Bearer" prefix if user pasted them
  apiKey = apiKey.replace(/['"]+/g, '').replace(/Bearer\s+/i, '').trim();

  if (!apiKey.startsWith("re_")) {
    return { success: false, error: "Invalid API Key format. Resend API keys must start with 're_'." };
  }

  // Defensively clean fromEmail and fromName to ensure valid "From" header format
  const cleanFromEmail = fromEmail.replace(/[<>]/g, '').trim();
  const cleanFromName = fromName.replace(/[<>]/g, '').trim();
  const formattedFrom = cleanFromName ? `${cleanFromName} <${cleanFromEmail}>` : cleanFromEmail;

  try {
    const resend = new Resend(apiKey);
    
    // Attempt 1: Using the configured email
    let { data, error } = await resend.emails.send({
      from: formattedFrom,
      to: [to],
      subject,
      html,
    });

    // If it's a domain verification error, try falling back to onboarding@resend.dev
    if (error && error.message.toLowerCase().includes("not verified") && cleanFromEmail !== "onboarding@resend.dev") {
      console.log("Domain not verified, attempting fallback to onboarding@resend.dev...");
      const fallbackResult = await resend.emails.send({
        from: `Cobry Survey <onboarding@resend.dev>`,
        to: [to],
        subject: `[Fallback] ${subject}`,
        html: `<p><strong>Note: This email was sent via Resend's onboarding domain because ${cleanFromEmail} is not verified.</strong></p><hr/>${html}`,
      });
      data = fallbackResult.data;
      error = fallbackResult.error;
    }

    if (error) {
      console.error("Resend SDK Error:", error);
      let msg = error.message;
      if (msg.toLowerCase().includes("not verified")) {
        msg = `Domain Verification Required: The domain for "${cleanFromEmail}" is not verified in Resend. Please verify it at https://resend.com/domains or use 'onboarding@resend.dev' for testing.`;
      } else if (error.name === "validation_error") {
        if (msg.includes("API key")) {
          msg = "The API key provided is rejected by Resend. Please check your RESEND_API_KEY.";
        }
      }
      return { success: false, error: msg };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    console.error("Resend SDK Catch Error:", err);
    return { success: false, error: err.message };
  }
}

// Health check endpoint
app.get("/make-server-6af5a51f/health", (c) => {
  return c.json({ status: "ok" });
});

// Submission endpoint
app.post("/make-server-6af5a51f/submit", async (c) => {
  try {
    const body = await c.req.json();
    const { formData, userEmail, timestamp, fileUrls = [] } = body;
    
    // 1. Store in KV store
    const submissionId = `submission_${Date.now()}`;
    await kv.set(submissionId, { ...formData, userEmail, timestamp, fileUrls });
    
    // 2. Format email content
    const surveyData = formData;
    
    // Format files list if any
    const filesHtml = fileUrls.length > 0 
      ? `
        <h2 style="color: #1e293b; font-size: 18px; margin-top: 24px;">Uploaded Assets</h2>
        <ul style="list-style-type: none; padding: 0;">
          ${fileUrls.map((url: string, i: number) => `
            <li style="margin-bottom: 10px;">
              <a href="${url}" style="color: #3b82f6; text-decoration: none; font-size: 14px;">View Asset ${i + 1}</a>
            </li>
          `).join('')}
        </ul>
      `
      : '';

    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h1 style="color: #1e293b; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">New Dashboard Scoping Submission</h1>
        <p style="color: #64748b; font-size: 14px;"><strong>Submitted by:</strong> ${userEmail || 'Anonymous'}</p>
        <p style="color: #64748b; font-size: 14px;"><strong>Date:</strong> ${new Date(timestamp).toLocaleString()}</p>
        
        <h2 style="color: #1e293b; font-size: 18px; margin-top: 24px;">Business Context</h2>
        <p><strong>Mission:</strong> ${surveyData.part1?.mission || 'N/A'}</p>
        <p><strong>Key Decisions:</strong> ${surveyData.part1?.decisions || 'N/A'}</p>
        <p><strong>Pain Points:</strong> ${surveyData.part1?.painPoints || 'N/A'}</p>
        <p><strong>Success Criteria:</strong> ${surveyData.part1?.successCriteria || 'N/A'}</p>
        
        <h2 style="color: #1e293b; font-size: 18px; margin-top: 24px;">The Audience</h2>
        <p><strong>Primary Audience:</strong> ${surveyData.part2?.primaryAudience || 'N/A'}</p>
        <p><strong>Data Literacy:</strong> ${surveyData.part2?.dataLiteracy || '3'}/5</p>
        <p><strong>Consumption:</strong> ${surveyData.part2?.consumption?.join(', ') || 'N/A'}</p>
        
        <h2 style="color: #1e293b; font-size: 18px; margin-top: 24px;">Metrics & Logic</h2>
        <p><strong>KPIs:</strong> ${surveyData.part3?.kpis || 'N/A'}</p>
        <p><strong>Granularity:</strong> ${surveyData.part3?.granularity || 'N/A'}</p>
        <p><strong>Latency:</strong> ${surveyData.part3?.latency || 'Daily'}</p>
        
        <h2 style="color: #1e293b; font-size: 18px; margin-top: 24px;">Data Architecture</h2>
        <p><strong>Sources:</strong> ${surveyData.part4?.sources || 'N/A'}</p>
        <p><strong>Quality:</strong> ${surveyData.part4?.quality || 'N/A'}</p>
        
        <h2 style="color: #1e293b; font-size: 18px; margin-top: 24px;">UX & Visualization</h2>
        <p><strong>Layout:</strong> ${surveyData.part5?.layout || 'N/A'}</p>
        
        ${filesHtml}
        
        <div style="margin-top: 30px; padding: 15px; background-color: #f8fafc; border-radius: 8px; font-size: 12px; color: #94a3b8;">
          This submission has been saved to the database with ID: ${submissionId}
        </div>
      </div>
    `;

    // 3. Send email to Anthony (Admin)
    const adminEmailResult = await sendEmail("anthony.osborn@cobry.co.uk", "New Looker Scoping Document Completed", emailHtml);
    
    // 4. Send copy to user if provided
    let userEmailResult = { success: true };
    let userEmailWarning = null;

    if (userEmail && userEmail.toLowerCase() !== "anthony.osborn@cobry.co.uk") {
      // Small delay to avoid Resend rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
      userEmailResult = await sendEmail(userEmail, "Your Looker Scoping Document - Cobry", emailHtml);
      
      // If user email fails due to sandbox restrictions or 403 Forbidden, don't fail the whole submission
      if (!userEmailResult.success && (userEmailResult.error.includes("testing emails") || userEmailResult.error.includes("403"))) {
        console.log("User email delivery skipped due to Sandbox restrictions.");
        userEmailWarning = "User copy could not be sent because the domain is not yet verified in Resend. The admin notification was processed.";
        userEmailResult = { success: true }; // Treat as soft failure
      }
    }

    if (!adminEmailResult.success || !userEmailResult.success) {
      const errorMsg = adminEmailResult.success ? userEmailResult.error : adminEmailResult.error;
      // Even if admin fails, check if it's just a sandbox error for the admin themselves (unlikely but possible if email mismatch)
      if (errorMsg.includes("testing emails") || errorMsg.includes("403")) {
         return c.json({ 
          success: true, 
          submissionId,
          warning: "Submission saved, but email delivery is restricted by Resend Sandbox. Please verify your domain at resend.com/domains."
        });
      }

      return c.json({ 
        success: false, 
        error: `Submission saved to database, but email delivery failed: ${errorMsg}`,
        submissionId 
      });
    }

    return c.json({ 
      success: true, 
      submissionId, 
      warning: userEmailWarning 
    });
  } catch (error) {
    console.error("Submission error:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

Deno.serve(app.fetch);