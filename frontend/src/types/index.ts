export interface AnalysisResult {
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
