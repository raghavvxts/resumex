import React from "react";
import { useResumeContext } from "../../contexts/ResumeContext";
export const PlaceholderView = ({
  title,
  icon: Icon,
  description,
}: {
  title: string;
  icon: React.ElementType;
  description: string;
  iconColor?: string;
}) => {
  const { setShowConfigDrawer } = useResumeContext();
  return (
    <section className="max-w-2xl mx-auto p-6 sm:p-10 space-y-5">
      <Icon className="w-8 h-8 text-purple-300" aria-hidden="true" />
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-text-secondary leading-relaxed">{description}</p>
      <button
        className="btn-primary px-6 py-3"
        onClick={() => setShowConfigDrawer(true)}
      >
        Add resume
      </button>
    </section>
  );
};
