import React from "react";
import { useResumeContext } from "../../contexts/ResumeContext";
export const PlaceholderView = ({
  title,
  icon: Icon,
  description,
  children,
}: {
  title: string;
  icon: React.ElementType;
  description: string;
  iconColor?: string;
  children?: React.ReactNode;
}) => {
  const { setShowConfigDrawer } = useResumeContext();
  return (
    <section className="empty-state glass-card">
      <Icon className="w-8 h-8 text-purple-300" aria-hidden="true" />
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-text-secondary leading-relaxed">{description}</p>
      <div className="empty-state-actions">
        <button
          className="btn-primary px-6 py-3"
          onClick={() => setShowConfigDrawer(true)}
        >
          Add resume
        </button>
        {children}
      </div>
    </section>
  );
};
