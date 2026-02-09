import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { 
  ClipboardCheck, 
  FileText, 
  Users, 
  Database, 
  BarChart3, 
  Layout, 
  Info, 
  Download, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  Settings,
  ShieldCheck,
  Zap,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast, Toaster } from 'sonner';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import cobryLogo from "figma:asset/abed752b7258d81c8fa586b4292a75a7add0f0b1.png";

// --- Initialize Supabase ---
const supabase = createClient(`https://${projectId}.supabase.co`, publicAnonKey);

// --- Utility ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const SidebarItem = ({ 
  icon: Icon, 
  label, 
  active, 
  completed, 
  onClick 
}: { 
  icon: any, 
  label: string, 
  active: boolean, 
  completed: boolean, 
  onClick: () => void 
}) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 w-full p-3 rounded-lg transition-all duration-200 text-left group",
      active 
        ? "bg-blue-50 text-blue-700 font-medium border-l-4 border-blue-600 shadow-sm" 
        : "text-slate-600 hover:bg-slate-50 border-l-4 border-transparent"
    )}
  >
    <div className={cn(
      "p-1.5 rounded-md transition-colors",
      active ? "bg-blue-100" : "bg-slate-100 group-hover:bg-slate-200"
    )}>
      <Icon size={18} className={active ? "text-blue-600" : "text-slate-500"} />
    </div>
    <span className="text-sm flex-1">{label}</span>
    {completed && <CheckCircle2 size={16} className="text-green-500" />}
  </button>
);

const SectionHeading = ({ icon: Icon, title, description, colorClass = "text-blue-600" }: { icon: any, title: string, description: string, colorClass?: string }) => (
  <div className="mb-8">
    <div className="flex items-center gap-3 mb-2">
      <div className={cn("p-2 rounded-xl bg-white shadow-sm border border-slate-100", colorClass)}>
        <Icon size={24} />
      </div>
      <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
    </div>
    <p className="text-slate-500 max-w-2xl">{description}</p>
  </div>
);

const FormField = ({ label, children, description, error }: { label: string, children: React.ReactNode, description?: string, error?: string }) => (
  <div className="space-y-1.5 mb-6">
    <label className="text-sm font-semibold text-slate-700 block">{label}</label>
    {description && <p className="text-xs text-slate-500 mb-2 italic">{description}</p>}
    {children}
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

const ConsultantNote = () => (
  <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-xl mt-12 overflow-hidden relative">
    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
      <Settings size={120} />
    </div>
    <div className="flex items-center gap-2 mb-4">
      <Info size={20} className="text-blue-400" />
      <h3 className="text-lg font-bold">Dataform vs LookML</h3>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
      <div className="space-y-2">
        <h4 className="font-bold text-blue-400 flex items-center gap-2">
          <Database size={16} /> Dataform (Heavy Lifting)
        </h4>
        <p className="text-sm text-slate-300 leading-relaxed">
          We use this for ETL transformations (cleaning raw data, joining massive tables) to save you money on BigQuery compute costs.
        </p>
      </div>
      <div className="space-y-2">
        <h4 className="font-bold text-green-400 flex items-center gap-2">
          <Zap size={16} /> LookML (Agile Logic)
        </h4>
        <p className="text-sm text-slate-300 leading-relaxed">
          Used for defining metrics and permissions. Change a definition in one place and it updates everywhere instantly without re-running pipelines.
        </p>
      </div>
    </div>
  </div>
);

// --- Main App ---

export default function DashboardScopingApp() {
  const [activeStep, setActiveStep] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  
  const { register, control, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      part1: { mission: '', decisions: '', painPoints: '', successCriteria: '' },
      part2: { primaryAudience: '', dataLiteracy: 3, consumption: [], concurrency: '' },
      part3: { kpis: '', definitions: '', granularity: '', history: '', latency: 'Daily' },
      part4: { sources: '', quality: 'Clean', security: '' },
      part5: { vizTypes: '', interactivity: [], layout: 'Story' },
      part6: { assets: [] }
    }
  });

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setUploadedFiles(prev => [...prev, ...filesArray]);
      toast.success(`${filesArray.length} file(s) added`);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formData = watch();

  const steps = [
    { id: 'why', label: 'Business Context', icon: FileText, color: 'text-blue-600' },
    { id: 'audience', label: 'The Audience', icon: Users, color: 'text-purple-600' },
    { id: 'logic', label: 'Metrics & Logic', icon: BarChart3, color: 'text-green-600' },
    { id: 'data', label: 'Data Architecture', icon: Database, color: 'text-orange-600' },
    { id: 'ux', label: 'UX & Visualization', icon: Layout, color: 'text-pink-600' },
    { id: 'assets', label: 'Visual Assets', icon: Settings, color: 'text-cyan-600' },
    { id: 'summary', label: 'Review & Export', icon: ClipboardCheck, color: 'text-slate-900' }
  ];

  const onSubmit = (data: any) => {
    console.log(data);
    toast.success('Document ready for export!');
    setActiveStep(5);
  };

  const copyToClipboard = () => {
    const text = `
DASHBOARD SURVEY DOCUMENT
Generated on: ${new Date().toLocaleDateString()}

PART 1: BUSINESS CONTEXT
- Mission: ${formData.part1.mission}
- Key Decisions: ${formData.part1.decisions}
- Pain Points: ${formData.part1.painPoints}
- Success Criteria: ${formData.part1.successCriteria}

PART 2: THE AUDIENCE
- Primary Audience: ${formData.part2.primaryAudience}
- Data Literacy (1-5): ${formData.part2.dataLiteracy}
- Consumption: ${formData.part2.consumption.join(', ')}
- Concurrency: ${formData.part2.concurrency}

PART 3: METRICS & LOGIC
- KPIs: ${formData.part3.kpis}
- Definitions: ${formData.part3.definitions}
- Granularity: ${formData.part3.granularity}
- History: ${formData.part3.history}
- Latency: ${formData.part3.latency}

PART 4: DATA ARCHITECTURE
- Sources: ${formData.part4.sources}
- Quality: ${formData.part4.quality}
- Security: ${formData.part4.security}

PART 5: DASHBOARD UX
- Preferred Viz: ${formData.part5.vizTypes}
- Interactivity: ${formData.part5.interactivity.join(', ')}
- Layout: ${formData.part5.layout}

PART 6: VISUAL ASSETS
- Files: ${uploadedFiles.length} images attached
    `;
    navigator.clipboard.writeText(text.trim());
    toast.success('Scoping document copied to clipboard!');
  };

  const handleSubmitResults = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6af5a51f/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          formData,
          userEmail,
          timestamp: new Date().toISOString()
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Results submitted! ${userEmail ? `Copy sent to ${userEmail}.` : ''} Anthony will be in touch.`);
        setShowSubmitModal(false);
      } else {
        throw new Error(result.error || 'Submission failed');
      }
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('Failed to submit results. Please try again or copy the text manually.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans selection:bg-blue-100 selection:text-blue-900">
      <Toaster position="top-right" />
      
      {/* Submit Modal */}
      <AnimatePresence>
        {showSubmitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6">
                  <ClipboardCheck size={32} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Submit Survey Results</h3>
                <p className="text-slate-500 mb-8 leading-relaxed">
                  Your requirements will be sent to <strong>anthony.osborn@cobry.co.uk</strong> for review. Enter your email below if you'd like a copy for yourself.
                </p>
                
                <div className="w-full space-y-4">
                  <div className="text-left">
                    <label className="text-sm font-bold text-slate-700 block mb-1.5 ml-1">Your Email (Optional)</label>
                    <input 
                      type="email" 
                      placeholder="you@company.com" 
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      className="w-full p-4 rounded-2xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none bg-slate-50"
                    />
                  </div>
                  
                  <button 
                    onClick={handleSubmitResults}
                    disabled={isSubmitting}
                    className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <motion.div 
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                          className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                        />
                        Sending...
                      </>
                    ) : 'Send to Cobry'}
                  </button>
                  
                  <button 
                    onClick={() => setShowSubmitModal(false)}
                    className="w-full py-2 text-slate-400 font-medium hover:text-slate-600 transition-colors"
                  >
                    Go back
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-72 bg-white border-r border-slate-200 flex flex-col sticky top-0 h-auto md:h-screen z-20">
        <div className="p-6 border-b border-slate-100">
          <div className="mb-6 flex justify-center">
            <img src={cobryLogo} alt="Cobry Logo" className="w-1/2 h-auto object-contain" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="font-bold text-slate-800 tracking-tight uppercase text-xs">DASHBOARD SURVEY</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {steps.map((step, idx) => (
            <SidebarItem
              key={step.id}
              icon={step.icon}
              label={step.label}
              active={activeStep === idx}
              completed={idx < activeStep || (idx === steps.length - 1 && false)} // Simplify for demo
              onClick={() => setActiveStep(idx)}
            />
          ))}
        </nav>

        <div className="p-4 bg-slate-50 border-t border-slate-200">
          <a 
            href="https://gocobry.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-3 bg-blue-600 rounded-xl text-white flex items-center gap-3 shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors block"
          >
            <div className="flex items-center gap-3">
              <HelpCircle size={20} />
              <div className="text-[10px] leading-tight">
                <p className="font-bold">NEED HELP?</p>
                <p className="opacity-80 underline">Contact Cobry</p>
              </div>
            </div>
          </a>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-12 lg:p-16 max-w-5xl mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="pb-24"
          >
            {/* Part 1: Business Context */}
            {activeStep === 0 && (
              <section>
                <SectionHeading 
                  icon={FileText} 
                  title="Part 1: Business Context & 'The Why'" 
                  description="We avoid building dashboards that no one uses by understanding the business decision behind every visualization."
                  colorClass="text-blue-600"
                />
                <div className="grid grid-cols-1 gap-4">
                  <FormField 
                    label="The Mission Statement" 
                    description="In one sentence, what question is this dashboard trying to answer?"
                  >
                    <textarea 
                      {...register('part1.mission')}
                      placeholder="e.g., 'How is our churn rate changing week-over-week by region?'"
                      className="w-full min-h-24 p-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none bg-white text-slate-800"
                    />
                  </FormField>
                  <FormField 
                    label="Key Decisions" 
                    description="What specific action will a user take based on the data they see here?"
                  >
                    <textarea 
                      {...register('part1.decisions')}
                      placeholder="e.g., 'If inventory drops below X, the manager will re-order.'"
                      className="w-full min-h-24 p-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none bg-white text-slate-800"
                    />
                  </FormField>
                  <FormField 
                    label="Current Pain Points" 
                    description="What is wrong with how you get this data today?"
                  >
                    <textarea 
                      {...register('part1.painPoints')}
                      placeholder="e.g., 'It takes 3 days to compile in Excel,' 'The numbers don't match between departments.'"
                      className="w-full min-h-24 p-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none bg-white text-slate-800"
                    />
                  </FormField>
                  <FormField 
                    label="Success Criteria" 
                    description="How will we know this project was a success?"
                  >
                    <textarea 
                      {...register('part1.successCriteria')}
                      placeholder="e.g., 'Time-to-insight reduced by 50%,' '100% adoption by the Sales team.'"
                      className="w-full min-h-24 p-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none bg-white text-slate-800"
                    />
                  </FormField>
                </div>
              </section>
            )}

            {/* Part 2: Audience */}
            {activeStep === 1 && (
              <section>
                <SectionHeading 
                  icon={Users} 
                  title="Part 2: The Audience (User Personas)" 
                  description="Looker allows us to curate experiences. An executive needs a KPI summary; an analyst needs to drill down."
                  colorClass="text-purple-600"
                />
                <FormField label="Who is the primary audience?">
                  <input 
                    {...register('part2.primaryAudience')}
                    type="text"
                    placeholder="e.g., C-Suite, Regional Managers, Field Ops, External Customers"
                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none bg-white text-slate-800"
                  />
                </FormField>

                <FormField label="Technical Proficiency" description="On a scale of 1–5, how data-literate is this audience?">
                  <div className="space-y-4">
                    <input 
                      type="range" 
                      min="1" 
                      max="5" 
                      step="1"
                      {...register('part2.dataLiteracy')}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                    />
                    <div className="flex justify-between text-xs font-medium text-slate-500 px-1">
                      <div className="text-center w-32">
                        <span className="block text-slate-900 font-bold">1</span>
                        "Just give me a PDF"
                      </div>
                      <div className="text-center w-32">
                        <span className="block text-slate-900 font-bold">3</span>
                        Standard Interactive
                      </div>
                      <div className="text-center w-32">
                        <span className="block text-slate-900 font-bold">5</span>
                        "Let me write SQL"
                      </div>
                    </div>
                  </div>
                </FormField>

                <FormField label="Consumption Method">
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {['Browser (Looker UI)', 'Mobile App', 'Embedded (PBL)', 'Scheduled Email/Slack'].map((method) => (
                      <label key={method} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                        <input 
                          type="checkbox" 
                          value={method}
                          {...register('part2.consumption')}
                          className="w-5 h-5 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm text-slate-700">{method}</span>
                      </label>
                    ))}
                  </div>
                </FormField>

                <FormField label="Concurrency" description="Roughly how many users will access this simultaneously? (Impacts BigQuery slot sizing)">
                  <input 
                    {...register('part2.concurrency')}
                    type="text"
                    placeholder="e.g., 50-100 daily active users"
                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none bg-white text-slate-800"
                  />
                </FormField>
              </section>
            )}

            {/* Part 3: Metrics & Logic */}
            {activeStep === 2 && (
              <section>
                <SectionHeading 
                  icon={BarChart3} 
                  title="Part 3: Metrics & Logic (The LookML Layer)" 
                  description="Determine what logic goes into the ETL vs. the Semantic Layer."
                  colorClass="text-green-600"
                />
                <div className="space-y-6">
                  <FormField label="The KPIs" description="List the top 5-10 metrics required">
                    <textarea 
                      {...register('part3.kpis')}
                      placeholder="e.g., Revenue, DAU, NPS, Retention rate"
                      className="w-full min-h-24 p-3 rounded-xl border border-slate-200 focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all outline-none bg-white text-slate-800"
                    />
                  </FormField>
                  <FormField label="The Definitions" description="Are these standard or is there debate on calculations?">
                    <textarea 
                      {...register('part3.definitions')}
                      placeholder="e.g., 'Does Gross Margin include shipping?'"
                      className="w-full min-h-24 p-3 rounded-xl border border-slate-200 focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all outline-none bg-white text-slate-800"
                    />
                  </FormField>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField label="Granularity">
                      <input 
                        {...register('part3.granularity')}
                        placeholder="e.g., Transaction level, Daily"
                        className="w-full p-3 rounded-xl border border-slate-200 focus:border-green-500 transition-all outline-none bg-white"
                      />
                    </FormField>
                    <FormField label="Latency">
                      <select 
                        {...register('part3.latency')}
                        className="w-full p-3 rounded-xl border border-slate-200 focus:border-green-500 transition-all outline-none bg-white"
                      >
                        <option>Real-time / Streaming</option>
                        <option>Hourly</option>
                        <option>Daily (Standard)</option>
                      </select>
                    </FormField>
                  </div>
                  <FormField label="History" description="How far back do we need to look?">
                    <input 
                      {...register('part3.history')}
                      placeholder="e.g., Last 30 days, 5 years, YoY"
                      className="w-full p-3 rounded-xl border border-slate-200 focus:border-green-500 transition-all outline-none bg-white"
                    />
                  </FormField>
                </div>
              </section>
            )}

            {/* Part 4: Data Architecture */}
            {activeStep === 3 && (
              <section>
                <SectionHeading 
                  icon={Database} 
                  title="Part 4: Data Architecture" 
                  description="We need to ensure the engine is ready before we paint the car."
                  colorClass="text-orange-600"
                />
                <FormField label="Data Sources">
                  <textarea 
                    {...register('part4.sources')}
                    placeholder="e.g., GA4, Salesforce, Postgres, Sheets"
                    className="w-full min-h-24 p-3 rounded-xl border border-slate-200 focus:border-orange-500 transition-all outline-none bg-white"
                  />
                </FormField>
                <FormField label="Data Quality">
                  <div className="grid grid-cols-2 gap-4">
                    {['Clean', 'Messy'].map(q => (
                      <label key={q} className="flex flex-col p-4 rounded-2xl border-2 border-slate-100 hover:border-orange-200 cursor-pointer has-[:checked]:border-orange-50 transition-all">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-slate-800">{q}</span>
                          <input type="radio" value={q} {...register('part4.quality')} className="w-5 h-5 text-orange-600" />
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          {q === 'Clean' ? 'Ready for BigQuery ingestion' : 'Requires a robust Dataform pipeline for cleaning'}
                        </p>
                      </label>
                    ))}
                  </div>
                </FormField>
                <FormField label="Security & Governance" description="Row-Level Security needs?">
                  <textarea 
                    {...register('part4.security')}
                    placeholder="e.g., 'Sales Rep A can only see California data...'"
                    className="w-full min-h-24 p-3 rounded-xl border border-slate-200 focus:border-orange-500 transition-all outline-none bg-white"
                  />
                </FormField>
                <ConsultantNote />
              </section>
            )}

            {/* Part 5: UX */}
            {activeStep === 4 && (
              <section>
                <SectionHeading 
                  icon={Layout} 
                  title="Part 5: Dashboard UX & Visualization" 
                  description="Designing the 'Look' and feel of the user experience."
                  colorClass="text-pink-600"
                />
                <FormField label="Preferred Visualization Types">
                  <textarea 
                    {...register('part5.vizTypes')}
                    placeholder="e.g., Sankey diagrams, Funnels, Maps, simple Tables"
                    className="w-full min-h-24 p-3 rounded-xl border border-slate-200 focus:border-pink-500 transition-all outline-none bg-white"
                  />
                </FormField>
                <FormField label="Interactivity Requirements">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {['Drill-downs', 'Cross-filtering', 'External Links'].map(item => (
                      <label key={item} className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 transition-colors">
                        <input type="checkbox" value={item} {...register('part5.interactivity')} className="w-5 h-5 rounded text-pink-600" />
                        <span className="text-sm font-medium">{item}</span>
                      </label>
                    ))}
                  </div>
                </FormField>
                <FormField label="Layout Structure">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { id: 'Story', title: 'Story Layout', desc: 'Long scroll with text context' },
                      { id: 'Control Room', title: 'Control Room', desc: 'Dense info on one screen' }
                    ].map(layout => (
                      <label key={layout.id} className="flex flex-col p-4 rounded-2xl border-2 border-slate-100 hover:border-pink-200 cursor-pointer has-[:checked]:border-pink-500 transition-all">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-slate-800">{layout.title}</span>
                          <input type="radio" value={layout.id} {...register('part5.layout')} className="w-5 h-5 text-pink-600" />
                        </div>
                        <p className="text-xs text-slate-500">{layout.desc}</p>
                      </label>
                    ))}
                  </div>
                </FormField>
              </section>
            )}

            {/* Part 6: Visual Assets */}
            {activeStep === 5 && (
              <section>
                <SectionHeading 
                  icon={Settings} 
                  title="Part 6: Visual Assets & Sketches" 
                  description="Upload any existing dashboard sketches, wireframe pictures, or your company's brand guidelines."
                  colorClass="text-cyan-600"
                />
                <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center group hover:border-cyan-400 transition-all cursor-pointer relative">
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-cyan-50 text-cyan-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Download size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Drop files here or click to upload</h3>
                    <p className="text-slate-500 text-sm mt-2">Supports JPG, PNG, SVG (Max 10MB each)</p>
                  </div>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="mt-8 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {uploadedFiles.map((file, idx) => (
                      <div key={idx} className="relative group aspect-square bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                        <img 
                          src={URL.createObjectURL(file)} 
                          alt={`Upload ${idx}`} 
                          className="w-full h-full object-cover"
                        />
                        <button 
                          onClick={() => removeFile(idx)}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Users size={14} /> 
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-[10px] text-white p-1 truncate">
                          {file.name}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Summary / Export */}
            {activeStep === 6 && (
              <section>
                <SectionHeading 
                  icon={ClipboardCheck} 
                  title="Review & Export" 
                  description="Review your scoping document. You can copy the raw text to your proposal or keep working."
                  colorClass="text-slate-900"
                />
                
                <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Document Preview</span>
                    <button 
                      onClick={copyToClipboard}
                      className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-full hover:bg-blue-700 transition-colors"
                    >
                      <ClipboardCheck size={14} />
                      COPY TEXT
                    </button>
                  </div>
                  <div className="p-8 max-h-[500px] overflow-y-auto font-mono text-sm text-slate-700 leading-relaxed space-y-8 bg-[url('https://www.transparenttextures.com/patterns/notebook.png')]">
                    <div>
                      <h3 className="font-bold text-slate-900 border-b border-slate-200 pb-1 mb-2">PART 1: BUSINESS CONTEXT</h3>
                      <p><span className="text-slate-400">Mission:</span> {formData.part1.mission || '[Not defined]'}</p>
                      <p><span className="text-slate-400">Decisions:</span> {formData.part1.decisions || '[Not defined]'}</p>
                      <p><span className="text-slate-400">Pain Points:</span> {formData.part1.painPoints || '[Not defined]'}</p>
                      <p><span className="text-slate-400">Success Criteria:</span> {formData.part1.successCriteria || '[Not defined]'}</p>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 border-b border-slate-200 pb-1 mb-2">PART 2: THE AUDIENCE</h3>
                      <p><span className="text-slate-400">Primary Audience:</span> {formData.part2.primaryAudience || '[Not defined]'}</p>
                      <p><span className="text-slate-400">Technical Literacy:</span> {formData.part2.dataLiteracy}/5</p>
                      <p><span className="text-slate-400">Consumption:</span> {formData.part2.consumption.length > 0 ? formData.part2.consumption.join(', ') : '[Not defined]'}</p>
                      <p><span className="text-slate-400">Concurrency:</span> {formData.part2.concurrency || '[Not defined]'}</p>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 border-b border-slate-200 pb-1 mb-2">PART 3: METRICS & LOGIC</h3>
                      <p><span className="text-slate-400">KPIs:</span> {formData.part3.kpis || '[Not defined]'}</p>
                      <p><span className="text-slate-400">Definitions:</span> {formData.part3.definitions || '[Not defined]'}</p>
                      <p><span className="text-slate-400">Granularity:</span> {formData.part3.granularity || '[Not defined]'}</p>
                      <p><span className="text-slate-400">History:</span> {formData.part3.history || '[Not defined]'}</p>
                      <p><span className="text-slate-400">Latency:</span> {formData.part3.latency}</p>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 border-b border-slate-200 pb-1 mb-2">PART 4: DATA ARCHITECTURE</h3>
                      <p><span className="text-slate-400">Sources:</span> {formData.part4.sources || '[Not defined]'}</p>
                      <p><span className="text-slate-400">Quality:</span> {formData.part4.quality}</p>
                      <p><span className="text-slate-400">Security:</span> {formData.part4.security || '[Not defined]'}</p>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 border-b border-slate-200 pb-1 mb-2">PART 5: DASHBOARD UX</h3>
                      <p><span className="text-slate-400">Viz Types:</span> {formData.part5.vizTypes || '[Not defined]'}</p>
                      <p><span className="text-slate-400">Interactivity:</span> {formData.part5.interactivity.length > 0 ? formData.part5.interactivity.join(', ') : '[Not defined]'}</p>
                      <p><span className="text-slate-400">Layout:</span> {formData.part5.layout}</p>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 border-b border-slate-200 pb-1 mb-2">PART 6: VISUAL ASSETS</h3>
                      <p><span className="text-slate-400">Files Attached:</span> {uploadedFiles.length > 0 ? `${uploadedFiles.length} images` : '[None]'}</p>
                      {uploadedFiles.map((f, i) => (
                        <p key={i} className="text-xs ml-4">- {f.name}</p>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex flex-col md:flex-row gap-4">
                  <div className="flex-1 bg-green-50 border border-green-100 p-6 rounded-2xl flex items-start gap-4">
                    <div className="p-2 bg-green-100 rounded-lg text-green-600">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-green-900 text-sm">Looker Enterprise Ready</h4>
                      <p className="text-xs text-green-700 mt-1">Based on your Part 4 answers, we recommend using Row-Level Security via User Attributes.</p>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Footer */}
        <div className="fixed bottom-0 right-0 left-0 md:left-72 bg-white/80 backdrop-blur-md border-t border-slate-100 p-4 z-10">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <button
              disabled={activeStep === 0}
              onClick={() => setActiveStep(s => Math.max(0, s - 1))}
              className="flex items-center gap-2 px-6 py-2 rounded-xl text-slate-500 font-medium hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-all"
            >
              <ChevronLeft size={20} />
              Back
            </button>
            
            <div className="flex gap-2">
              {steps.map((_, idx) => (
                <div 
                  key={idx} 
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-300",
                    idx === activeStep ? "w-8 bg-blue-600" : idx < activeStep ? "bg-blue-300" : "bg-slate-200"
                  )} 
                />
              ))}
            </div>

            {activeStep < steps.length - 1 ? (
              <button
                onClick={() => setActiveStep(s => Math.min(steps.length - 1, s + 1))}
                className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-blue-300 active:scale-95 transition-all"
              >
                Next Step
                <ChevronRight size={20} />
              </button>
            ) : (
              <button
                onClick={() => setShowSubmitModal(true)}
                className="flex items-center gap-2 px-8 py-2.5 bg-green-600 text-white font-bold rounded-xl shadow-lg shadow-green-200 hover:bg-green-700 active:scale-95 transition-all"
              >
                Submit Results
                <ClipboardCheck size={20} />
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
