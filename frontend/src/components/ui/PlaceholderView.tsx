import React from "react";
import { FileText, LucideIcon, Upload, Shield, Activity, FileCode } from "lucide-react";
import { useResumeContext } from "../../contexts/ResumeContext";

interface PlaceholderViewProps {
  title: string;
  icon?: LucideIcon;
  description?: string;
  iconColor?: string;
}

export const PlaceholderView = ({ 
  title, 
  icon: Icon = FileText, 
  description = "Please upload a resume in the dashboard first.",
  iconColor = "text-[#9CA3AF]"
}: PlaceholderViewProps) => {
  const { setShowConfigDrawer } = useResumeContext();
  
  return (
    <div className="max-w-3xl mx-auto py-10 px-8">
      {title && <h2 className="text-title font-bold text-white mb-6">{title}</h2>}
      <div className="p-12 rounded-2xl border border-white/10 flex flex-col items-center justify-center text-center shadow-elevation-surface" style={{ background: "rgba(255,255,255,0.02)" }}>
        <div className="w-16 h-16 rounded-full bg-white/[0.04] flex items-center justify-center mb-6">
          <Icon className={`w-8 h-8 ${iconColor}`} />
        </div>
        <p className="text-heading font-medium text-white mb-2">No Resume Data Found</p>
        <p className="text-[#9CA3AF] text-body-sm max-w-md mb-8">{description}</p>
        
        <button 
          onClick={() => setShowConfigDrawer(true)}
          className="btn-primary px-10 py-4 text-[17px] font-semibold gap-3 hover:-translate-y-0.5 transition-all shadow-xl mb-12"
        >
          <Upload className="w-6 h-6" />
          Upload Resume
        </button>

        {/* Features Preview Grid covering empty space beautifully */}
        <div className="w-full border-t border-white/[0.06] pt-10">
          <p className="text-[11px] font-bold text-[#52525B] tracking-[0.2em] uppercase mb-6">Features Unlocked After Upload</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            <div className="p-4 rounded-xl border border-dashed border-white/5 bg-white/[0.01]">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-purple-400/80" />
                <h4 className="text-body-sm font-semibold text-white/90">ATS Matcher</h4>
              </div>
              <p className="text-caption text-[#9CA3AF] leading-relaxed">Scans and scores keyword compatibility with real-time job templates.</p>
            </div>
            <div className="p-4 rounded-xl border border-dashed border-white/5 bg-white/[0.01]">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-emerald-400/80" />
                <h4 className="text-body-sm font-semibold text-white/90">Skills Gap Radar</h4>
              </div>
              <p className="text-caption text-[#9CA3AF] leading-relaxed">Maps technical and soft skills to identify missing gaps.</p>
            </div>
            <div className="p-4 rounded-xl border border-dashed border-white/5 bg-white/[0.01]">
              <div className="flex items-center gap-2 mb-2">
                <FileCode className="w-4 h-4 text-blue-400/80" />
                <h4 className="text-body-sm font-semibold text-white/90">LaTeX Builder</h4>
              </div>
              <p className="text-caption text-[#9CA3AF] leading-relaxed">Generates clean, ATS-compliant LaTeX resume formats automatically.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
