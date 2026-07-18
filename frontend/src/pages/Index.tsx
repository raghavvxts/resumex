import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Upload, FileText, Loader2, AlertCircle, Sparkles, Target,
  ThumbsUp, ThumbsDown, CheckCircle2, X, FileText as FileIcon,
  Copy, Check, ChevronRight, BarChart3, TrendingUp, Zap,
  LayoutDashboard, Search, Bell, Settings, User, Star,
  BookOpen, Briefcase, PenTool, Lightbulb, BookMarked, ArrowRight,
  Shield, ChevronDown, Info, Menu
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AnalysisResult {
  score: number;
  candidate_name?: string;
  role_level?: string;
  years_experience?: number;
  keyword_coverage?: number;
  matched_keywords?: string[];
  missing_keywords: string[];
  matched_phrases?: string[];
  missing_phrases?: string[];
  section_scores?: Record<string, number>;
  action_plan?: string[];
  bullet_templates?: string[];
  checklist?: {
    completion_percent: number;
    items: Array<{ id: string; label: string; completed: boolean; reason: string }>;
  };
  ai_recommendations?: {
    status: string;
    message: string;
    strengths: string[];
    weak_points: string[];
    rewritten_bullets: string[];
    skills_rewrite: string;
    summary_rewrite: string;
    interview_focus: string[];
    model_used?: string | null;
  };
  suggestions: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000").replace(/\/$/, "");
const MIN_JOB_WORDS = 20;

const COMPANY_TEMPLATES: Record<string, Record<string, string>> = {
  google: {
    swe: "We are looking for a Software Engineer to develop next-generation technologies. Candidates must have experience with Python, C++, Java, distributed systems, algorithms, and data structures. You will design, develop, test, deploy, and maintain software solutions.",
    junior: "Google is looking for a Junior Developer. Requirements: Python, Git version control, basic SQL, algorithms, and collaborative software development. You will write clean code, document APIs, and fix bugs.",
    data_analyst: "Google is seeking a Data Analyst. Required: Python, SQL, Tableau, data visualization, statistical analysis, and machine learning models. You will translate data insights into business actions.",
    pm: "Google is seeking a Product Manager. Required: Technical background in software, API design, user experience design, product strategy, and data analytics. You will define product roadmaps."
  },
  meta: {
    swe: "Meta is looking for a Software Engineer with expertise in systems engineering, distributed systems, caching, network protocols, C++, Python, and scalability. You will build and scale systems that support billions of users.",
    data_analyst: "Meta seeks a Data Analyst: SQL, Python, Excel, metrics definitions, and dashboard creation. You will analyze user growth and define product metrics."
  },
  stripe: {
    swe: "Stripe is seeking a Software Engineer to join our payments platform. Strong skills in Ruby, Python, Go, API design, security, databases (SQL), and distributed systems are required.",
    junior: "Junior Software Engineer: experience with Python, JavaScript, Git, and web standards. You will write unit tests, build UI modules, and resolve database performance issues."
  },
  netflix: {
    business_analyst: "Netflix is looking for a Business Analyst. Requirements: SQL, Python, Tableau, data mining, forecasting, and KPI dashboards. You will work with streaming content teams."
  },
  apple: {
    business_analyst: "Apple is looking for a Business Analyst: SQL, Tableau, business metrics, financial analysis, spreadsheets, and stakeholder communications."
  }
};

const COMPANY_NAMES: Record<string, string> = { google: "Google", meta: "Meta", stripe: "Stripe", netflix: "Netflix", apple: "Apple" };
const ROLE_NAMES: Record<string, string> = { swe: "Software Engineer", junior: "Junior Developer", data_analyst: "Data Analyst", business_analyst: "Business Analyst", pm: "Product Manager" };

const AI_MSGS = [
  "Reading your resume…",
  "Parsing work experience…",
  "Checking ATS compatibility…",
  "Analyzing keyword density…",
  "Finding measurable achievements…",
  "Matching skills to role requirements…",
  "Evaluating section structure…",
  "Generating AI recommendations…",
  "Compiling final report…",
];

const formatSec = (n: string) => n.charAt(0).toUpperCase() + n.slice(1);

// ─── Tiny helpers ─────────────────────────────────────────────────────────────

const CopyButton = ({ text, label = "Copy" }: { text: string; label?: string }) => {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => { try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {} }}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold
                 border border-white/8 text-[#6B7280] hover:text-white hover:border-white/15
                 hover:bg-white/4 transition-all"
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copied!" : label}
    </button>
  );
};

// Score ring SVG
const ScoreRing = ({ score, size = 80, color = "#FFFFFF", loading = false }: { score: number; size?: number; color?: string; loading?: boolean }) => {
  const sw = 7;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="-rotate-90" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={sw} />
        <circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={loading ? "rgba(255,255,255,0.05)" : color} strokeWidth={sw} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={loading ? circ : circ - (score / 100) * circ}
          className={loading ? "" : "metric-ring"} style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-2xl font-bold font-display leading-none ${loading ? 'text-[#4B5563]' : 'text-white'}`}>{loading ? "--" : score}</span>
        <span className={`text-[9px] mt-0.5 ${loading ? 'text-[#374151]' : 'text-[#6B7280]'}`}>/100</span>
      </div>
    </div>
  );
};

// Thin progress bar
const BarProgress = ({ value, color = "bar-fill-blue", height = "h-1", loading = false }: { value: number; color?: string; height?: string; loading?: boolean }) => (
  <div className={`bar-track w-full ${height}`}>
    <motion.div
      initial={{ width: 0 }}
      animate={{ width: loading ? 0 : `${Math.min(value, 100)}%` }}
      transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
      className={`${height} ${loading ? 'bg-transparent' : color} rounded-full`}
    />
  </div>
);

const PlaceholderView = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center h-[70vh] text-center px-6">
    <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10 mb-6 shadow-2xl">
      <Sparkles className="w-7 h-7 text-[#6B7280]" />
    </div>
    <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
    <p className="text-[#9CA3AF] text-[14px] max-w-sm leading-relaxed">
      This feature is currently under development. Stay tuned for future updates!
    </p>
  </div>
);

// Small status dot
const Dot = ({ color, loading = false }: { color: string; loading?: boolean }) => (
  <span className="w-2 h-2 rounded-full inline-block transition-colors duration-500" style={{ background: loading ? "rgba(255,255,255,0.1)" : color }} />
);

// Sidebar nav item
const NavItem = ({ icon: Icon, label, active = false, onClick }: { icon: React.ElementType; label: string; active?: boolean; onClick?: () => void }) => (
  <div onClick={onClick} className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer select-none text-[13px] font-medium transition-colors group">
    {active && (
      <motion.div
        layoutId="activeNavIndicator"
        className="absolute inset-0 rounded-xl"
        style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.05)" }}
        initial={false}
        transition={{ type: "spring", stiffness: 350, damping: 30 }}
      />
    )}
    <Icon className={`w-4 h-4 shrink-0 relative z-10 transition-colors ${active ? "text-white" : "text-[#6B7280] group-hover:text-white"}`} />
    <span className={`relative z-10 transition-colors ${active ? "text-white font-semibold" : "text-[#9CA3AF] group-hover:text-white"}`}>{label}</span>
  </div>
);

// Glass card for hero — floating resume mockup
const ResumeGlassMockup = () => (
  <div className="relative w-56 h-64 select-none pointer-events-none">
    {/* Back card */}
    <div
      className="absolute top-4 left-6 w-44 h-56 rounded-2xl animate-float2"
      style={{
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.15)",
        backdropFilter: "blur(16px)",
        transform: "rotate(6deg)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.4)"
      }}
    >
      <div className="p-5 space-y-2.5">
        {[80, 60, 70, 45, 55].map((w, i) => (
          <div key={i} className="h-2 rounded-full" style={{ width: `${w}%`, background: "rgba(255,255,255,0.3)" }} />
        ))}
      </div>
    </div>
    {/* Front card */}
    <div
      className="absolute top-0 left-0 w-44 h-56 rounded-2xl animate-float"
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%)",
        border: "1px solid rgba(255,255,255,0.5)",
        backdropFilter: "blur(24px)",
        boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 0 60px rgba(147, 51, 234, 0.25), inset 0 0 0 1px rgba(255,255,255,0.4)"
      }}
    >
      <div className="p-5 space-y-3">
        <div className="w-9 h-9 rounded-full" style={{ background: "rgba(255,255,255,0.25)", border: "1px solid rgba(255,255,255,0.4)" }} />
        <div className="space-y-1.5">
          {[90, 65, 75].map((w, i) => (
            <div key={i} className="h-2 rounded-full" style={{ width: `${w}%`, background: i === 0 ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.3)" }} />
          ))}
        </div>
        <div className="pt-1 space-y-1.5">
          {[100, 80, 90, 60].map((w, i) => (
            <div key={i} className="h-1.5 rounded-full" style={{ width: `${w}%`, background: "rgba(255,255,255,0.2)" }} />
          ))}
        </div>
      </div>
    </div>
  </div>
);

// AI loader
const AILoader = ({ msg }: { msg: string }) => (
  <div className="flex flex-col items-center justify-center h-[280px] gap-5">
    <div className="relative w-14 h-14">
      <div className="absolute inset-0 rounded-full border-2 border-[rgba(255,255,255,0.15)] spin-slow" style={{ borderTopColor: "rgba(255,255,255,0.7)" }} />
      <div className="absolute inset-2 rounded-full border border-[rgba(255,255,255,0.1)]" style={{ borderBottomColor: "rgba(255,255,255,0.4)", animation: "spin-slow 2s linear infinite reverse" }} />
      <div className="absolute inset-0 flex items-center justify-center">
        <Sparkles className="w-4 h-4 text-[#F5F5F7]" />
      </div>
    </div>
    <AnimatePresence mode="wait">
      <motion.p key={msg} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
        transition={{ duration: 0.3 }} className="shimmer-text text-[13px] font-medium text-center">
        {msg}
      </motion.p>
    </AnimatePresence>
  </div>
);

// Donut chart for keywords
const KeywordDonut = ({ matched, total, loading = false }: { matched: number; total: number; loading?: boolean }) => {
  const pct = total > 0 ? Math.round((matched / total) * 100) : 0;
  const size = 100; const sw = 12; const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="-rotate-90" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={sw} />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={loading ? "rgba(255,255,255,0.05)" : "#FFFFFF"} strokeWidth={sw} strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={loading ? circ : circ - (pct / 100) * circ}
            style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1)", filter: loading ? "none" : "drop-shadow(0 0 8px rgba(255,255,255,0.3))" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-lg font-bold ${loading ? 'text-[#4B5563]' : 'text-white'}`}>{loading ? "--" : `${pct}%`}</span>
          <span className={`text-[8px] font-medium ${loading ? 'text-[#374151]' : 'text-[#6B7280]'}`}>Keywords</span>
        </div>
      </div>
      <div className="space-y-2 text-[11px] flex-1">
        <div className="flex items-center gap-2"><Dot color="#FFFFFF" loading={loading} /><span className={loading ? 'text-[#4B5563]' : 'text-[#9CA3AF]'}>Matched</span><span className={`font-bold ml-auto ${loading ? 'text-[#4B5563]' : 'text-white'}`}>{loading ? "--" : `${pct}%`}</span></div>
        <div className="flex items-center gap-2"><Dot color="#9CA3AF" loading={loading} /><span className={loading ? 'text-[#4B5563]' : 'text-[#9CA3AF]'}>Missing</span><span className={`font-bold ml-auto ${loading ? 'text-[#4B5563]' : 'text-white'}`}>{loading ? "--" : `${total > 0 ? Math.round(((total - matched) / total) * 100) : 0}%`}</span></div>
        <div className="flex items-center gap-2"><Dot color="#D1D5DB" loading={loading} /><span className={loading ? 'text-[#4B5563]' : 'text-[#9CA3AF]'}>Found</span><span className={`font-bold ml-auto ${loading ? 'text-[#4B5563]' : 'text-white'}`}>{loading ? "--" : matched}</span></div>
      </div>
    </div>
  );
};

const CoverLetterView = ({ file, jobDesc, roleLevel, yearsExperience }: { file: File | null, jobDesc: string, roleLevel: string, yearsExperience: number }) => {
  const [loading, setLoading] = useState(false);
  const [letter, setLetter] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    if (!file) {
      setError("Please upload a resume first.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("resume", file);
      formData.append("job_description", jobDesc);
      formData.append("role_level", roleLevel);
      formData.append("years_experience", yearsExperience.toString());

      const res = await fetch("http://127.0.0.1:5000/cover-letter", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate cover letter.");
      setLetter(data.cover_letter);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!file) {
    return <PlaceholderView title="Cover Letter Generator" />;
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Cover Letter Generator</h2>
        <p className="text-[#9CA3AF] text-[14px]">Generate a tailored cover letter based on your resume and job description.</p>
      </div>

      {!letter && !loading && (
        <div className="flex justify-center py-12">
          <button onClick={generate} className="flex items-center gap-2 px-6 py-3 rounded-xl text-[13px] font-bold text-black bg-white hover:opacity-90 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]">
            <Sparkles className="w-4 h-4" />
            Generate Cover Letter
          </button>
        </div>
      )}

      {loading && (
        <div className="py-12">
          <AILoader msg="Drafting your cover letter..." />
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl mb-6" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <p className="text-red-400 text-[13px]">{error}</p>
        </div>
      )}

      {letter && !loading && (
        <div className="glass-card p-8 relative group">
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <CopyButton text={letter} />
          </div>
          <div className="whitespace-pre-wrap text-[14px] text-[#E5E7EB] leading-[1.8] font-serif">
            {letter}
          </div>
          <div className="mt-8 flex justify-end">
            <button onClick={generate} className="text-[#9CA3AF] hover:text-white text-[12px] flex items-center gap-1.5 transition-all">
              <Zap className="w-3.5 h-3.5" />
              Regenerate
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const SkillsAnalysisView = ({ file, jobDesc, roleLevel, yearsExperience }: { file: File | null, jobDesc: string, roleLevel: string, yearsExperience: number }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    if (!file) {
      setError("Please upload a resume first.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("resume", file);
      formData.append("job_description", jobDesc);
      formData.append("role_level", roleLevel);
      formData.append("years_experience", yearsExperience.toString());

      const res = await fetch("http://127.0.0.1:5000/skills-analysis", {
        method: "POST",
        body: formData,
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to analyze skills.");
      setData(resData);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!file) return <PlaceholderView title="Skills Analysis" />;

  const CategorySection = ({ title, dataObj, colorClass, barColor }: { title: string, dataObj: any, colorClass: string, barColor: string }) => {
    if (!dataObj) return null;
    return (
      <div className="glass-card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[16px] font-bold text-white">{title}</h3>
          <div className="flex items-center gap-3 w-48">
            <span className="text-[12px] font-semibold text-[#9CA3AF] w-8">{dataObj.score}/100</span>
            <BarProgress value={dataObj.score} color={barColor} height="h-1.5" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {dataObj.skills.map((skill: string, i: number) => (
            <span key={i} className={`px-3 py-1.5 rounded-lg text-[12px] font-medium border ${colorClass}`}>
              {skill}
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Skills Analysis</h2>
          <p className="text-[#9CA3AF] text-[14px]">AI-powered deep dive into your technical and soft skills.</p>
        </div>
        {!data && !loading && (
          <button onClick={generate} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[12px] font-bold text-black bg-white hover:opacity-90 transition-all shadow-[0_0_15px_rgba(255,255,255,0.15)]">
            <Sparkles className="w-3.5 h-3.5" />
            Analyze Skills
          </button>
        )}
      </div>

      {loading && (
        <div className="py-20">
          <AILoader msg="Scanning and categorizing skills..." />
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl mb-6" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <p className="text-red-400 text-[13px]">{error}</p>
        </div>
      )}

      {data && !loading && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CategorySection title="Technical Expertise" dataObj={data.technical} colorClass="bg-blue-500/10 text-blue-300 border-blue-500/20" barColor="bg-blue-500" />
            <CategorySection title="Soft Skills" dataObj={data.soft} colorClass="bg-emerald-500/10 text-emerald-300 border-emerald-500/20" barColor="bg-emerald-500" />
            <CategorySection title="Domain Knowledge" dataObj={data.domain} colorClass="bg-purple-500/10 text-purple-300 border-purple-500/20" barColor="bg-purple-500" />
            
            {/* Gaps Section */}
            {data.gaps && data.gaps.length > 0 && (
              <div className="glass-card p-6" style={{ background: "rgba(245,158,11,0.03)", border: "1px solid rgba(245,158,11,0.15)" }}>
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <h3 className="text-[16px] font-bold text-white">Identified Gaps</h3>
                </div>
                <ul className="space-y-3">
                  {data.gaps.map((gap: string, i: number) => (
                    <li key={i} className="flex gap-3 text-[13px] text-[#D1D5DB] leading-relaxed">
                      <span className="text-amber-500 mt-0.5">•</span>
                      {gap}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <div className="flex justify-end pt-4">
            <button onClick={generate} className="text-[#9CA3AF] hover:text-white text-[12px] flex items-center gap-1.5 transition-all">
              <Zap className="w-3.5 h-3.5" />
              Re-Analyze
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Application Component ───────────────────────────────────────────────────────────

export default function Index() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [roleLevel, setRoleLevel] = useState("junior");
  const [yearsExperience, setYearsExperience] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [showConfigDrawer, setShowConfigDrawer] = useState(false); // Drawer state
  
  const [parsedTextForModal, setParsedTextForModal] = useState({ name: "", summary: "", experience: [] as string[] });
  const [mode, setMode] = useState<"template" | "custom" | "audit">("template");
  const [selectedCompany, setSelectedCompany] = useState("google");
  const [selectedRole, setSelectedRole] = useState("swe");
  const [aiMsg, setAiMsg] = useState(AI_MSGS[0]);
  const [activeNav, setActiveNav] = useState("dashboard");

  useEffect(() => {
    if (!loading) return;
    let i = 0;
    const t = setInterval(() => { i = (i + 1) % AI_MSGS.length; setAiMsg(AI_MSGS[i]); }, 2200);
    return () => clearInterval(t);
  }, [loading]);

  const handleCompanyChange = (company: string) => {
    setSelectedCompany(company);
    const roles = Object.keys(COMPANY_TEMPLATES[company]);
    if (roles.length) setSelectedRole(roles[0]);
  };

  const handleFile = (f: File) => {
    if (f.type !== "application/pdf") { setError("Only PDF files are accepted."); return; }
    if (f.size > 10 * 1024 * 1024) { setError("PDF must be 10MB or smaller."); return; }
    setError(""); setFile(f);
  };

  const handleAnalyze = async () => {
    if (!file) { setError("Please upload a resume first."); return; }
    let jd = "";
    if (mode === "template") { jd = COMPANY_TEMPLATES[selectedCompany]?.[selectedRole] || ""; }
    else if (mode === "custom") {
      jd = jobDescription;
      if (!jd.trim()) { setError("Please paste a job description."); return; }
      if (jd.trim().split(/\s+/).length < MIN_JOB_WORDS) { setError(`At least ${MIN_JOB_WORDS} words needed.`); return; }
    }
    setError(""); setLoading(true); setResult(null); setAiMsg(AI_MSGS[0]);
    try {
      const fd = new FormData();
      fd.append("resume", file); fd.append("job_description", jd);
      fd.append("role_level", roleLevel); fd.append("years_experience", String(yearsExperience));
      const res = await fetch(`${API_BASE_URL}/analyze`, { method: "POST", body: fd });
      if (!res.ok) {
        let msg = "Analysis failed. Try again.";
        try { const d = await res.json(); if (d?.error) msg = d.error; } catch {}
        throw new Error(msg);
      }
      const data = (await res.json()) as AnalysisResult;
      setResult(data);
      const summary = data.ai_recommendations?.summary_rewrite || "Experienced professional aligned to core technical goals.";
      const bullets = data.bullet_templates?.length ? data.bullet_templates : [
        "Designed and implemented high-volume APIs, reducing system latency by 20%.",
        "Led backend feature development and integrated key client workflows.",
        "Spearheaded database query optimization, improving read speeds by 30%.",
      ];
      setParsedTextForModal({ name: data.candidate_name || "Candidate", summary, experience: bullets });
      setShowConfigDrawer(false); // Close drawer on success
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally { setLoading(false); }
  };

  const resetAnalysis = () => {
    setResult(null); setShowResumeModal(false); setShowConfigDrawer(true); setFile(null); setJobDescription("");
    setYearsExperience(0); setRoleLevel("junior"); setMode("template");
    setSelectedCompany("google"); setSelectedRole("swe");
  };

  // Metrics extraction (safe fallbacks for skeleton state)
  const isReady = result !== null;
  const matchedKw = result?.matched_keywords?.length || 0;
  const totalKw = (result?.matched_keywords?.length || 0) + (result?.missing_keywords?.length || 0);
  const atsScore = result ? Math.round((result.keyword_coverage || 0)) : 0;
  const scoreColor = result ? (result.score >= 70 ? "#FFFFFF" : result.score >= 40 ? "#D1D5DB" : "#9CA3AF") : "#4B5563";
  const scoreLabel = result ? (result.score >= 70 ? "Great Resume" : result.score >= 40 ? "Good Resume" : "Needs Improvement") : "Awaiting Scan";
  const scoreDesc = result 
    ? (result.score >= 70 ? "Solid fundamentals. A few improvements can make it exceptional." : result.score >= 40 ? "Good base. Add more keywords and quantified achievements." : "Add more detail, keywords, and structure.") 
    : "Upload your resume to see how well it matches the target role.";
    
  const strengths = result?.ai_recommendations?.strengths || ["Strong technical skills", "Well-structured resume", "Relevant project experience", "Good keyword usage"];
  const areasToImprove = result?.ai_recommendations?.weak_points || result?.action_plan || ["Add more quantifiable metrics", "Include industry-relevant keywords", "Strengthen summary section", "Showcase leadership impact"];

  return (
    <div className="flex min-h-screen bg-black">
      {/* Liquid animated background orbs */}
      <div className="liquid-orb liquid-orb-1" />
      <div className="liquid-orb liquid-orb-2" />
      <div className="liquid-orb liquid-orb-3" />

      {/* ═══════════════════════════════ SIDEBAR ════════════════════════════ */}
      <aside className="sidebar flex-shrink-0 hidden lg:flex">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-white">
              <Star className="w-4 h-4 text-black fill-black" />
            </div>
            <div>
              <p className="text-[13px] font-bold text-white leading-none">ResumeAI</p>
              <p className="text-[9px] text-[#6B7280] mt-0.5">Analyze. Improve. Grow.</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <NavItem icon={LayoutDashboard} label="Dashboard"       active={activeNav === "dashboard"}   onClick={() => { setActiveNav("dashboard"); }} />
          <NavItem icon={FileIcon}        label="Resume Review"   active={activeNav === "review"}     onClick={() => setActiveNav("review")} />
          <NavItem icon={Briefcase}       label="Job Match"       active={activeNav === "job"}        onClick={() => setActiveNav("job")} />
          <NavItem icon={BarChart3}       label="Skills Analysis" active={activeNav === "skills"}     onClick={() => setActiveNav("skills")} />
          <NavItem icon={PenTool}         label="Cover Letter"    active={activeNav === "cover"}      onClick={() => setActiveNav("cover")} />
          <NavItem icon={Lightbulb}       label="Career Insights" active={activeNav === "career"}     onClick={() => setActiveNav("career")} />
          <NavItem icon={BookMarked}      label="Saved Reports"   active={activeNav === "saved"}      onClick={() => setActiveNav("saved")} />
          <div className="my-3 border-t border-white/5" />
          <NavItem icon={Settings}        label="Settings"        active={activeNav === "settings"}   onClick={() => setActiveNav("settings")} />
        </nav>

        <div className="flex-1" />
      </aside>

      {/* ═══════════════════════════════ MAIN ══════════════════════════════ */}
      <div className="flex-1 flex flex-col relative z-10 min-w-0 lg:ml-[240px]">

        {/* Topbar */}
        <header className="topbar h-14 px-6 flex items-center justify-end gap-4">
          {isReady && (
            <button onClick={resetAnalysis} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-white/10 text-white transition-all text-[11px] font-semibold border border-white/10">
              <X className="w-3.5 h-3.5" />
              Clear Data
            </button>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeNav}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="absolute inset-0 overflow-x-hidden overflow-y-auto pb-10"
            >
              {activeNav === "dashboard" ? (
                <div className="flex flex-col min-h-[calc(100vh-3.5rem)]">
                  {!isReady && !loading ? (
                  <div className="flex-1 flex flex-col justify-center relative px-8 pt-10 pb-8 overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 100%)" }}>
                  {/* ─────────────────── HERO VIEW ────────────────────── */}
            {/* Orbs */}
            <div className="absolute top-[-10%] right-32 w-[500px] h-[500px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(147,51,234,0.15) 0%, transparent 70%)", filter: "blur(60px)" }} />
            <div className="absolute bottom-[-10%] left-10 w-[400px] h-[400px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)", filter: "blur(60px)" }} />

            <div className="relative flex items-center justify-between gap-8 max-w-6xl w-full mx-auto px-4 lg:px-12">
              {/* Left: headline + upload */}
              <div className="flex-1 max-w-[520px]">
                <motion.h1
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                  className="text-4xl sm:text-[54px] font-bold text-white leading-[1.05] tracking-[-0.03em] mb-4"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  Smarter Resumes.<br />
                  <span style={{ background: "linear-gradient(90deg, #FFFFFF, #E2E8F0)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                    Bigger Opportunities.
                  </span>
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
                  className="text-[#D1D5DB] text-[15px] leading-relaxed mb-8 max-w-sm"
                >
                  Get AI-powered insights to improve your resume, match the right jobs and stand out.
                </motion.p>

                {/* Upload buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.18 }}
                  className="flex gap-3 flex-wrap mb-3"
                >
                  <motion.button
                    whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
                    onClick={() => { setShowConfigDrawer(true); setMode("template"); }}
                    className="flex items-center gap-2.5 px-6 py-3 rounded-xl text-[14px] font-bold text-black bg-white transition-all shadow-[0_0_20px_rgba(255,255,255,0.25)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Resume
                  </motion.button>
                  <motion.button
                    whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
                    onClick={() => { setShowConfigDrawer(true); setMode("custom"); }}
                    className="flex items-center gap-2.5 px-6 py-3 rounded-xl text-[14px] font-semibold text-white transition-all"
                    style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
                  >
                    <FileIcon className="w-4 h-4" />
                    Paste Text
                  </motion.button>
                </motion.div>
                <p className="text-[11px] text-[#4B5563]">Supports PDF · Max 10MB</p>
              </div>

              {/* Right: glass mockup */}
              <motion.div
                initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
                className="hidden lg:block shrink-0 scale-125 origin-right lg:mr-10"
              >
                <ResumeGlassMockup />
              </motion.div>
            </div>
          </div>
          ) : (
          <div className="p-8 flex flex-col relative">
          {/* ─────────────────── RESULTS DASHBOARD (Unified) ─────────────────────── */}
            <div className="flex items-center justify-between mb-7">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  {isReady ? "Analysis Report" : "Dashboard"}
                </h2>
                <p className="text-[#6B7280] text-[13px] mt-1">
                  {isReady 
                    ? `${parsedTextForModal.name} · ${mode === "template" ? `${COMPANY_NAMES[selectedCompany]} — ${ROLE_NAMES[selectedRole]}` : mode === "audit" ? "General ATS Audit" : "Custom Job Description"}`
                    : "No analysis currently active."
                  }
                </p>
              </div>
              <div className="flex gap-2">
                {isReady && (
                  <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }} onClick={() => setShowResumeModal(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold text-[#9CA3AF] hover:text-white transition-all"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <FileIcon className="w-3.5 h-3.5" />
                    View Dossier
                  </motion.button>
                )}
                {!isReady && (
                   <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }} onClick={() => setShowConfigDrawer(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold text-black transition-all shadow-lg bg-white shadow-white/10">
                    <Sparkles className="w-3.5 h-3.5" />
                    Start Scan
                  </motion.button>
                )}
              </div>
            </div>

            <div className="relative flex-1">
              {/* ── Row 1: Metric cards ── */}
              <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5 transition-opacity duration-500 ${!isReady && loading ? "opacity-30 blur-sm pointer-events-none" : ""}`}>
                {/* Resume Score */}
                <div className={`glass-card p-5 flex items-center gap-4 col-span-1 sm:col-span-2 lg:col-span-1 min-h-[140px] ${!isReady && loading ? "skeleton-pulse" : ""}`}>
                <ScoreRing score={result?.score || 0} color="#FFFFFF" loading={!isReady} />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#4B5563] mb-1">Resume Score</p>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Dot color="#FFFFFF" loading={!isReady} />
                    <span className={`text-[13px] font-semibold ${!isReady ? 'text-[#6B7280]' : ''}`} style={{ color: "#FFFFFF" }}>{scoreLabel}</span>
                  </div>
                  <p className="text-[11px] text-[#6B7280] leading-relaxed max-w-[120px]">
                    {scoreDesc}
                  </p>
                </div>
              </div>

              {/* ATS Compatibility */}
              <div className={`glass-card p-5 min-h-[140px] ${!isReady && loading ? "skeleton-pulse" : ""}`}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#4B5563]">ATS Compatibility</p>
                  <Shield className="w-4 h-4 text-[#4B5563]" />
                </div>
                <p className={`text-4xl font-bold mt-2 font-display ${!isReady ? 'text-[#4B5563]' : 'text-white'}`}>{isReady ? atsScore : "--"}<span className={`text-2xl ${!isReady ? 'text-[#374151]' : 'text-white'}`}>%</span></p>
                <div className="mt-3 mb-2"><BarProgress value={atsScore} color="bg-white/20" height="h-1" loading={!isReady} /></div>
                <div className="flex items-center gap-1.5">
                  <Dot color="#FFFFFF" loading={!isReady} />
                  <span className={`text-[11px] ${!isReady ? 'text-[#4B5563]' : 'text-[#6B7280]'}`}>
                    {!isReady ? "Awaiting Data" : (atsScore >= 70 ? "Highly ATS Friendly" : atsScore >= 40 ? "Moderately Compatible" : "Needs Optimization")}
                  </span>
                </div>
              </div>

              {/* Job Match */}
              <div className={`glass-card p-5 min-h-[140px] ${!isReady && loading ? "skeleton-pulse" : ""}`}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#4B5563]">Job Match</p>
                  <Briefcase className="w-4 h-4 text-[#4B5563]" />
                </div>
                <p className={`text-4xl font-bold mt-2 font-display ${!isReady ? 'text-[#4B5563]' : 'text-white'}`}>{isReady ? result?.score : "--"}<span className={`text-2xl ${!isReady ? 'text-[#374151]' : 'text-white'}`}>%</span></p>
                <div className="mt-3 mb-2"><BarProgress value={result?.score || 0} color="bg-white/20" height="h-1" loading={!isReady} /></div>
                <div className="flex items-center gap-1.5">
                  <Dot color="#FFFFFF" loading={!isReady} />
                  <span className={`text-[11px] ${!isReady ? 'text-[#4B5563]' : 'text-[#6B7280]'}`}>
                    {!isReady ? "Awaiting Data" : ((result?.score || 0) >= 70 ? "Strong Match" : (result?.score || 0) >= 40 ? "Partial Match" : "Weak Match")}
                  </span>
                </div>
              </div>

              {/* Skills Found */}
              <div className={`glass-card p-5 min-h-[140px] ${!isReady && loading ? "skeleton-pulse" : ""}`}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#4B5563]">Skills Found</p>
                  <TrendingUp className="w-4 h-4 text-[#4B5563]" />
                </div>
                <p className={`text-4xl font-bold mt-2 font-display ${!isReady ? 'text-[#4B5563]' : 'text-white'}`}>
                  {isReady ? matchedKw : "--"}
                  <span className={`text-xl font-normal ${!isReady ? 'text-[#374151]' : 'text-[#6B7280]'}`}> / {isReady ? totalKw : "--"}</span>
                </p>
                <div className="mt-3 mb-2"><BarProgress value={totalKw > 0 ? (matchedKw / totalKw) * 100 : 0} color="bg-white/20" height="h-1" loading={!isReady} /></div>
                <div className="flex items-center gap-1.5">
                  <Dot color="#FFFFFF" loading={!isReady} />
                  <span className={`text-[11px] ${!isReady ? 'text-[#4B5563]' : 'text-[#6B7280]'}`}>Relevant Skills</span>
                </div>
              </div>
            </div>

            {/* ── Row 2: Strengths / Weaknesses / Keywords ── */}
            <div className={`grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5 transition-opacity duration-500 ${!isReady && loading ? "opacity-30 blur-sm pointer-events-none" : ""}`}>
              {/* Key Strengths */}
              <div className={`glass-card p-5 min-h-[220px] ${!isReady && loading ? "skeleton-pulse" : ""}`}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,255,255,0.1)" }}>
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                  <p className={`text-[13px] font-semibold ${!isReady ? 'text-[#6B7280]' : 'text-white'}`}>Key Strengths</p>
                </div>
                <div className="space-y-2.5">
                  {strengths.slice(0, 4).map((s, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${!isReady ? 'text-[#374151]' : 'text-white'}`} />
                      <p className={`text-[12px] leading-snug ${!isReady ? 'text-[#4B5563]' : 'text-[#9CA3AF]'}`}>{!isReady ? "Analyze resume to uncover your top strengths and match potential." : s}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Areas to Improve */}
              <div className={`glass-card p-5 min-h-[220px] ${!isReady && loading ? "skeleton-pulse" : ""}`}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,255,255,0.1)" }}>
                    <AlertCircle className="w-3.5 h-3.5 text-white" />
                  </div>
                  <p className={`text-[13px] font-semibold ${!isReady ? 'text-[#6B7280]' : 'text-white'}`}>Areas to Improve</p>
                </div>
                <div className="space-y-2.5">
                  {areasToImprove.slice(0, 4).map((w, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 border-b border-white/4 last:border-0">
                      <div className="flex items-center gap-2.5">
                        <Info className={`w-3.5 h-3.5 shrink-0 ${!isReady ? 'text-[#374151]' : 'text-white'}`} />
                        <p className={`text-[12px] ${!isReady ? 'text-[#4B5563]' : 'text-[#9CA3AF]'}`}>{!isReady ? "Identify missing keywords and gaps." : (w.length > 40 ? w.slice(0, 40) + "…" : w)}</p>
                      </div>
                      <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${!isReady ? 'text-[#374151]' : 'text-[#4B5563]'}`} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Keyword Insights */}
              <div className={`glass-card p-5 min-h-[220px] flex flex-col justify-center ${!isReady && loading ? "skeleton-pulse" : ""}`}>
                <p className={`text-[13px] font-semibold mb-6 ${!isReady ? 'text-[#6B7280]' : 'text-white'}`}>Keyword Insights</p>
                <KeywordDonut matched={matchedKw} total={totalKw} loading={!isReady} />
              </div>
            </div>

            {/* ── Row 3: AI Suggestions ── */}
            <div className={`glass-card p-5 transition-opacity duration-500 ${!isReady && !loading ? "opacity-30 blur-sm pointer-events-none" : ""} ${!isReady && loading ? "skeleton-pulse" : ""}`}>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Sparkles className={`w-4 h-4 ${!isReady ? 'text-[#4B5563]' : 'text-white'}`} />
                  <div>
                    <p className={`text-[13px] font-semibold ${!isReady ? 'text-[#6B7280]' : 'text-white'}`}>AI Suggestions</p>
                    <p className="text-[10px] text-[#6B7280]">Actionable tips to make your resume better.</p>
                  </div>
                </div>
                <button onClick={() => setShowResumeModal(true)} disabled={!isReady} className="flex items-center gap-1.5 text-[11px] text-white hover:opacity-80 transition-all font-medium disabled:opacity-50">
                  View All <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { icon: PenTool,    title: "Improve Summary",    desc: "Make your profile more impactful in 2 lines.",        color: "#FFFFFF" },
                  { icon: BarChart3,  title: "Add Project Metrics", desc: "Include measurable outcomes (%, $, users).",          color: "#FFFFFF" },
                  { icon: Shield,     title: "Optimize for ATS",    desc: "Use industry keywords for better visibility.",         color: "#FFFFFF" },
                  { icon: Lightbulb,  title: "Enhance Skills",      desc: "Group skills by category for clarity.",               color: "#FFFFFF" },
                ].map((s, i) => (
                  <div key={i} className="p-4 rounded-xl transition-all" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                      <s.icon className={`w-4 h-4 ${!isReady ? 'text-[#4B5563]' : 'text-white'}`} />
                    </div>
                    <p className={`text-[12px] font-semibold mb-1 ${!isReady ? 'text-[#6B7280]' : 'text-white'}`}>{s.title}</p>
                    <p className={`text-[11px] leading-relaxed ${!isReady ? 'text-[#4B5563]' : 'text-[#6B7280]'}`}>{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            
            {/* ── Row 4: Checklist (Only if ready) ── */}
            <AnimatePresence>
              {isReady && result.checklist && (
                <motion.div initial={{ opacity: 0, height: 0, marginTop: 0 }} animate={{ opacity: 1, height: 'auto', marginTop: 16 }} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Section scores */}
                  {result.section_scores && (
                    <div className="glass-card p-5">
                      <p className="text-[13px] font-semibold text-white mb-4">Section Coverage</p>
                      <div className="space-y-3.5">
                        {Object.entries(result.section_scores).map(([k, v]) => {
                          const c = "bg-white/20";
                          return (
                            <div key={k} className="space-y-1.5">
                              <div className="flex justify-between">
                                <span className="text-[12px] text-[#9CA3AF]">{formatSec(k)}</span>
                                <span className="text-[12px] font-semibold text-white">{v}%</span>
                              </div>
                              <BarProgress value={v} color={c} height="h-1" />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Checklist */}
                  <div className="glass-card p-5">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-[13px] font-semibold text-white">Readiness Checklist</p>
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full text-white" style={{ background: "rgba(255,255,255,0.1)" }}>{result.checklist.completion_percent}% complete</span>
                    </div>
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2">
                      {result.checklist.items.map(item => (
                        <div key={item.id} className="flex items-start gap-3 py-2 border-b border-white/4 last:border-0">
                          <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${item.completed ? "text-white" : "text-[#374151]"}`} />
                          <div>
                            <p className={`text-[12px] font-medium ${item.completed ? "text-white" : "text-[#6B7280]"}`}>{item.label}</p>
                            <p className="text-[10px] text-[#4B5563] mt-0.5">{item.reason}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            </div>
          </div>
          )}
          </div>
          ) : activeNav === "cover" ? (
            <CoverLetterView file={file} jobDesc={jobDesc} roleLevel={selectedRole} yearsExperience={parseInt(yearsExperience) || 0} />
          ) : activeNav === "skills" ? (
            <SkillsAnalysisView file={file} jobDesc={jobDesc} roleLevel={selectedRole} yearsExperience={parseInt(yearsExperience) || 0} />
          ) : (
            <PlaceholderView title={
              activeNav === "review" ? "Resume Review" :
              activeNav === "job" ? "Job Match" :
              activeNav === "career" ? "Career Insights" :
              activeNav === "saved" ? "Saved Reports" : "Settings"
            } />
          )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* ═══════════════════════════════ CONFIG DRAWER ═════════════════════════════ */}
      <AnimatePresence>
        {showConfigDrawer && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => !loading && setShowConfigDrawer(false)} 
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0, transition: { duration: 0.25, ease: "easeInOut" } }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="relative z-10 w-full max-w-[500px] h-full flex flex-col shadow-[-20px_0_60px_rgba(0,0,0,0.5)]"
              style={{ background: "rgba(10, 10, 10, 0.95)", borderLeft: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(48px) saturate(200%)" }}
            >
              {loading ? (
                <div className="flex-1 flex items-center justify-center">
                  <AILoader msg={aiMsg} />
                </div>
              ) : (
                <>
                  <div className="px-6 py-5 flex items-center justify-between border-b border-white/5">
                    <div>
                      <h3 className="text-lg font-bold text-white tracking-tight">New Scan</h3>
                      <p className="text-[11px] text-[#6B7280] mt-0.5">Upload a resume and set your target.</p>
                    </div>
                    <button onClick={() => setShowConfigDrawer(false)} className="p-2 rounded-xl text-[#6B7280] hover:bg-white/5 hover:text-white transition-all">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6 space-y-7">
                    {/* ── Drop zone ── */}
                    <div>
                      <p className="label-tiny mb-2.5">Resume PDF</p>
                      <input type="file" ref={fileInputRef} accept=".pdf" className="hidden" onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
                      <div
                        className={`drop-zone p-6 text-center ${dragOver ? "active" : ""} ${file ? "has-file" : ""}`}
                        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
                        onClick={() => !file && fileInputRef.current?.click()}
                      >
                        <AnimatePresence mode="wait">
                          {file ? (
                            <motion.div key="file" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.25)" }}>
                                  <FileText className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div className="text-left min-w-0">
                                  <p className="text-white font-semibold text-[13px] truncate">{file.name}</p>
                                  <p className="text-[#6B7280] text-[11px] mt-0.5">{(file.size / 1024).toFixed(0)} KB</p>
                                </div>
                              </div>
                              <button onClick={e => { e.stopPropagation(); setFile(null); }} className="p-2 rounded-xl hover:bg-red-500/10 text-[#6B7280] hover:text-red-400 shrink-0">
                                <X className="w-4 h-4" />
                              </button>
                            </motion.div>
                          ) : (
                            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-2">
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-1" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}>
                                <Upload className="w-4.5 h-4.5 text-white" />
                              </div>
                              <p className="text-[#D1D5DB] text-[13px] font-medium">Drop PDF here or <span className="text-white font-semibold">browse</span></p>
                              <p className="text-[#4B5563] text-[11px]">Max 10MB</p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* ── Mode + Config ── */}
                    <div>
                      <p className="label-tiny mb-2.5">Target Mode</p>
                      <div className="mode-tabs mb-4">
                        {(["template", "custom", "audit"] as const).map(m => (
                          <div key={m} onClick={() => setMode(m)} className={`mode-tab ${mode === m ? "active" : ""}`}>
                            {m === "template" ? "Templates" : m === "custom" ? "Custom JD" : "Audit"}
                          </div>
                        ))}
                      </div>

                      <AnimatePresence mode="wait">
                        {mode === "template" && (
                          <motion.div key="tmpl" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <p className="label-tiny mb-1.5">Company</p>
                                <select value={selectedCompany} onChange={e => handleCompanyChange(e.target.value)} className="glass-input w-full px-3 py-2 text-[13px]">
                                  {Object.keys(COMPANY_TEMPLATES).map(k => <option key={k} value={k}>{COMPANY_NAMES[k]}</option>)}
                                </select>
                              </div>
                              <div>
                                <p className="label-tiny mb-1.5">Role</p>
                                <select value={selectedRole} onChange={e => setSelectedRole(e.target.value)} className="glass-input w-full px-3 py-2 text-[13px]">
                                  {Object.keys(COMPANY_TEMPLATES[selectedCompany] || {}).map(k => <option key={k} value={k}>{ROLE_NAMES[k]}</option>)}
                                </select>
                              </div>
                            </div>
                            <div className="p-3.5 rounded-xl text-[11px] text-[#6B7280] italic leading-relaxed" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)" }}>
                              <span className="text-white not-italic font-semibold text-[9px] uppercase tracking-widest block mb-1">Preview</span>
                              "{COMPANY_TEMPLATES[selectedCompany]?.[selectedRole]}"
                            </div>
                          </motion.div>
                        )}
                        {mode === "custom" && (
                          <motion.div key="custom" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>
                            <textarea value={jobDescription} onChange={e => setJobDescription(e.target.value)} placeholder="Paste full job description..." rows={5} className="glass-input w-full px-3.5 py-3 text-[13px] resize-none" />
                          </motion.div>
                        )}
                        {mode === "audit" && (
                          <motion.div key="audit" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="flex gap-3 p-4 rounded-xl" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.14)" }}>
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-emerald-400 text-[12px] font-semibold">General ATS Audit</p>
                              <p className="text-[#6B7280] text-[11px] mt-0.5 leading-relaxed">Evaluates ATS compatibility and section completion without a specific target.</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="label-tiny mb-2">Seniority</p>
                        <select value={roleLevel} onChange={e => setRoleLevel(e.target.value)} className="glass-input w-full px-3 py-2 text-[13px]">
                          <option value="junior">Junior</option>
                          <option value="mid">Mid-Level</option>
                          <option value="senior">Senior</option>
                        </select>
                      </div>
                      <div>
                        <p className="label-tiny mb-2">Experience (Yrs)</p>
                        <input type="number" min={0} max={40} value={yearsExperience} onChange={e => setYearsExperience(Number(e.target.value))} className="glass-input w-full px-3 py-2 text-[13px]" />
                      </div>
                    </div>

                    <AnimatePresence>
                      {error && (
                        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex gap-2 p-3 rounded-xl" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                          <p className="text-red-400 text-[12px] leading-relaxed">{error}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  <div className="p-6 border-t border-white/5 bg-[#0a0a0a]/50">
                    <motion.button
                      whileHover={file ? { y: -1, boxShadow: "0 8px 30px rgba(255,255,255,0.3), inset 0 1px 0 rgba(0,0,0,0.1)" } : {}}
                      whileTap={file ? { scale: 0.98 } : {}}
                      onClick={handleAnalyze}
                      disabled={!file}
                      className="w-full py-3.5 rounded-xl text-[14px] font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: file ? "#FFFFFF" : "rgba(255,255,255,0.06)", border: file ? "1px solid #FFFFFF" : "1px solid rgba(255,255,255,0.1)", color: file ? "#000000" : "#FFFFFF" }}
                    >
                      <Sparkles className="w-4 h-4" />
                      Run Analysis
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════ DOSSIER MODAL ═════════════════════════════ */}
      <AnimatePresence>
        {showResumeModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
              onClick={() => setShowResumeModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.97, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 16 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              className="relative z-10 w-full max-w-[500px] max-h-[82vh] flex flex-col rounded-2xl overflow-hidden glass-modal">

              {/* Header */}
              <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,255,255,0.1)" }}>
                    <FileIcon className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-[13px] font-semibold text-white">Resume Dossier</span>
                </div>
                <button id="modal-close-btn" onClick={() => setShowResumeModal(false)}
                  className="p-1.5 rounded-lg text-[#4B5563] hover:text-[#9CA3AF] hover:bg-white/5 transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* Candidate pill */}
                <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-black bg-white">
                    {parsedTextForModal.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-white">{parsedTextForModal.name}</p>
                    <p className="text-[11px] text-[#4B5563] truncate">{file?.name || "resume.pdf"}</p>
                  </div>
                  {result && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold" style={{
                      background: "rgba(255,255,255,0.1)",
                      color: "#FFFFFF",
                    }}>{result.score}% Match</span>
                  )}
                </div>

                {parsedTextForModal.summary && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <p className="label-tiny">AI Rewritten Summary</p>
                      <CopyButton text={parsedTextForModal.summary} />
                    </div>
                    <div className="p-4 rounded-xl italic text-[12px] text-[#9CA3AF] leading-relaxed" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                      "{parsedTextForModal.summary}"
                    </div>
                  </div>
                )}

                {parsedTextForModal.experience?.length > 0 && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <p className="label-tiny">Bullet Templates</p>
                      <CopyButton text={parsedTextForModal.experience.join("\n")} label="Copy All" />
                    </div>
                    {parsedTextForModal.experience.map((b, i) => (
                      <div key={i} className="flex gap-3 p-3.5 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                        <ChevronRight className="w-3.5 h-3.5 text-[#4B5563] shrink-0 mt-0.5" />
                        <p className="text-[11px] text-[#9CA3AF] leading-relaxed flex-1">{b}</p>
                        <CopyButton text={b} />
                      </div>
                    ))}
                  </div>
                )}

                {result?.ai_recommendations?.interview_focus?.length > 0 && (
                  <div className="space-y-2.5">
                    <p className="label-tiny text-[#FFFFFF]">Interview Focus Areas</p>
                    <div className="flex flex-wrap gap-1.5">
                      {result.ai_recommendations.interview_focus.map((f, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-full text-[10px] font-medium" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFFFFF" }}>{f}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
