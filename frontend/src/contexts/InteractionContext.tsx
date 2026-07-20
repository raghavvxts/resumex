/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, ReactNode } from "react";

export type HoveredElement = 
  | "upload" 
  | "strategist" 
  | "builder" 
  | "skills" 
  | "dashboard" 
  | "ats" 
  | "export" 
  | null;

export type AmbientState = "idle" | "uploading" | "analyzing" | "finished" | "error";

interface InteractionContextType {
  hoveredElement: HoveredElement;
  setHoveredElement: (element: HoveredElement) => void;
  ambientState: AmbientState;
  setAmbientState: (state: AmbientState) => void;
}

const InteractionContext = createContext<InteractionContextType | undefined>(undefined);

export const InteractionProvider = ({ children }: { children: ReactNode }) => {
  const [hoveredElement, setHoveredElement] = useState<HoveredElement>(null);
  const [ambientState, setAmbientState] = useState<AmbientState>("idle");

  return (
    <InteractionContext.Provider value={{ hoveredElement, setHoveredElement, ambientState, setAmbientState }}>
      {children}
    </InteractionContext.Provider>
  );
};

export const useInteractionContext = () => {
  const context = useContext(InteractionContext);
  if (context === undefined) {
    throw new Error("useInteractionContext must be used within an InteractionProvider");
  }
  return context;
};
