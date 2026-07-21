/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { FileText, ArrowRight, LayoutTemplate, Eye, EyeOff } from "lucide-react";
import { useResumeContext } from "../../../contexts/ResumeContext";
import { generatePDF } from "../../../services/api/builder";
import { PlaceholderView } from "../../../components/ui/PlaceholderView";

export const ResumeBuilder = () => {
  const { parsedResume, result } = useResumeContext();
  const [selectedTemplate, setSelectedTemplate] = useState("jakes_resume");
  const [isExporting, setIsExporting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const exportPDF = async () => {
    if (!parsedResume) return;
    setIsExporting(true);
    try {
      const updatedResume = JSON.parse(JSON.stringify(parsedResume));
      updatedResume.template_name = selectedTemplate;
      
      // Inject AI optimized bullets
      if (result?.ai_recommendations?.rewritten_bullets?.length && updatedResume.experience?.length) {
        const aiBullets = result.ai_recommendations.rewritten_bullets;
        const exp = updatedResume.experience[0];
        exp.bullets = [...aiBullets, ...exp.bullets.slice(aiBullets.length)];
      }
      
      const blob = await generatePDF(updatedResume, selectedTemplate);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${updatedResume.personal_info?.name?.replace(/\s+/g, '_') || 'Resume'}_ATS.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("Failed to export PDF");
    } finally {
      setIsExporting(false);
    }
  };

  if (!parsedResume) {
    return (
      <PlaceholderView 
        title="Resume Builder (LaTeX)" 
        icon={LayoutTemplate} 
        description="Upload your resume first to automatically generate a clean, ATS-friendly LaTeX template." 
      />
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-title font-bold text-white mb-6">Resume Builder (LaTeX)</h2>
          <div className="space-y-6">
            {/* Template Selector — fixed to 2-column grid */}
            <div className="p-6 rounded-2xl border border-white/10" style={{ background: "rgba(255,255,255,0.02)" }}>
              <h3 className="text-heading font-bold text-white mb-4">Select Template</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div 
                  onClick={() => setSelectedTemplate("jakes_resume")}
                  className={`px-7 py-5 rounded-2xl cursor-pointer transition-all ${selectedTemplate === "jakes_resume" ? "border-2 border-purple-500 bg-purple-500/10" : "border border-white/10 hover:border-white/30 hover:bg-white/[0.03]"}`}
                >
                  <p className="font-bold text-white mb-1 pl-1">Jake's Resume</p>
                  <p className="text-label text-[#9CA3AF] leading-relaxed pl-1">The gold standard for Software Engineers. Clean, ATS-friendly LaTeX.</p>
                </div>
                <div 
                  onClick={() => setSelectedTemplate("deedy_resume")}
                  className={`px-7 py-5 rounded-2xl cursor-pointer transition-all ${selectedTemplate === "deedy_resume" ? "border-2 border-purple-500 bg-purple-500/10" : "border border-white/10 hover:border-white/30 hover:bg-white/[0.03]"}`}
                >
                  <p className="font-bold text-white mb-1 pl-1">Deedy Resume</p>
                  <p className="text-label text-[#9CA3AF] leading-relaxed pl-1">A stylish two-column layout optimized for information density.</p>
                </div>
              </div>
            </div>

            {/* Resume Preview Section */}
            <div className="p-6 rounded-2xl border border-white/10" style={{ background: "rgba(255,255,255,0.02)" }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-heading font-bold text-white">Resume Preview</h3>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="btn-secondary px-4 py-2 text-[13px] font-medium gap-2"
                >
                  {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showPreview ? "Hide" : "Show"} Preview
                </button>
              </div>
              {showPreview && (
                <div className="space-y-4 p-5 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  {/* Name & Contact */}
                  {parsedResume.personal_info && (
                    <div className="border-b border-white/10 pb-4">
                      <h4 className="text-[20px] font-bold text-white">{parsedResume.personal_info.name || "Name"}</h4>
                      <div className="flex flex-wrap gap-3 mt-1 text-caption text-[#9CA3AF]">
                        {parsedResume.personal_info.email && <span>{parsedResume.personal_info.email}</span>}
                        {parsedResume.personal_info.phone && <span>• {parsedResume.personal_info.phone}</span>}
                        {parsedResume.personal_info.linkedin && <span>• {parsedResume.personal_info.linkedin}</span>}
                      </div>
                    </div>
                  )}
                  {/* Education */}
                  {parsedResume.education?.length > 0 && (
                    <div>
                      <p className="label-tiny text-[#6B7280] mb-2">EDUCATION</p>
                      {parsedResume.education.map((edu: any, i: number) => (
                        <div key={i} className="mb-2">
                          <p className="text-body-sm font-semibold text-white">{edu.institution || edu.school}</p>
                          <p className="text-caption text-[#9CA3AF]">{edu.degree} {edu.date && `• ${edu.date}`}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Experience */}
                  {parsedResume.experience?.length > 0 && (
                    <div>
                      <p className="label-tiny text-[#6B7280] mb-2">EXPERIENCE</p>
                      {parsedResume.experience.map((exp: any, i: number) => (
                        <div key={i} className="mb-3">
                          <div className="flex justify-between">
                            <p className="text-body-sm font-semibold text-white">{exp.title || exp.role}</p>
                            <p className="text-caption text-[#4B5563]">{exp.date}</p>
                          </div>
                          <p className="text-caption text-[#9CA3AF] mb-1">{exp.company}</p>
                          {exp.bullets?.slice(0, 3).map((b: string, j: number) => (
                            <p key={j} className="text-caption text-[#6B7280] pl-3 mb-0.5">• {b}</p>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Skills */}
                  {parsedResume.skills && Object.keys(parsedResume.skills).length > 0 && (
                    <div>
                      <p className="label-tiny text-[#6B7280] mb-2">SKILLS</p>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.values(parsedResume.skills).flatMap((val: any) => 
                          (typeof val === 'string' ? val.split(',').map(s => s.trim()).filter(Boolean) : [])
                        ).map((skill: string, i: number) => (
                          <span key={i} className="px-2 py-1 rounded-md text-[11px] text-[#D1D5DB] font-medium" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Export Section */}
            <div className="p-6 rounded-2xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4" style={{ background: "rgba(255,255,255,0.02)" }}>
              <div>
                <h3 className="text-heading font-bold text-white mb-1">Export your resume</h3>
                <p className="text-body-sm text-[#9CA3AF]">Includes your AI-optimized bullet points automatically.</p>
              </div>
              <button 
                onClick={exportPDF} 
                disabled={isExporting}
                className="btn-primary px-10 py-4 text-[17px] rounded-full font-semibold gap-3 disabled:opacity-50 shadow-xl hover:shadow-2xl transition-all"
              >
                {isExporting ? <><span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> Compiling LaTeX...</> : <>Download PDF <ArrowRight className="w-4 h-4 opacity-80" /></>}
              </button>
            </div>
          </div>
      </div>
    </div>
  );
};
