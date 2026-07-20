import React from "react";
import { motion } from "framer-motion";
import { HoveredElement } from "../../../contexts/InteractionContext";

interface ModuleProps {
  label: string;
  x: number;
  y: number;
  delay?: number;
  isActive?: boolean;
  hoveredElement?: HoveredElement | null;
}

export const Module = ({ label, x, y, delay = 0, isActive = false, hoveredElement = null }: ModuleProps) => {
  const isUploadHovered = hoveredElement === "upload";

  return (
    <motion.div
      className="absolute z-20 pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%` }}
      initial={{ opacity: 0, scale: 0.95, x: "-50%", y: "-50%" }}
      animate={{ 
        opacity: 1, 
        scale: isUploadHovered ? 1.05 : 1,
        x: "-50%",
        y: isUploadHovered ? "calc(-50% - 2px)" : "-50%"
      }}
      transition={{ duration: 1.2, delay: isUploadHovered ? 0 : delay, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="relative flex items-center justify-center">
        {/* The Node: Tiny purple dot */}
        <div className={`w-2 h-2 rounded-full transition-colors duration-500 ${isActive ? 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.8)]' : 'bg-purple-900/50'}`} />
        
        {/* The Label */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs tracking-wider uppercase font-medium text-gray-300">
          {label}
        </div>
      </div>
    </motion.div>
  );
};
