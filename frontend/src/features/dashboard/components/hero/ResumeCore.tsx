import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HoveredElement } from "../../../contexts/InteractionContext";

export const ResumeCore = ({ isProcessing = false, hoveredElement = null }: { isProcessing?: boolean, hoveredElement?: HoveredElement }) => {
  // We use state to toggle the active line to simulate the "Story"
  const [activeLine, setActiveLine] = useState(false);

  useEffect(() => {
    if (isProcessing) return; // If processing an actual file, we might pause the ambient loop
    
    // The Story Loop: Every 12 seconds, the line expands for 4 seconds
    const interval = setInterval(() => {
      setActiveLine(true);
      setTimeout(() => setActiveLine(false), 4000);
    }, 12000);

    return () => clearInterval(interval);
  }, [isProcessing]);

  const isUploadHovered = hoveredElement === "upload";
  const isBuilderHovered = hoveredElement === "builder";

  return (
    <motion.div 
      className="relative z-10 w-[264px] h-[374px] animate-hero-breathe"
      animate={{
        rotateY: isBuilderHovered ? 5 : 0,
        rotateX: isBuilderHovered ? 2 : 0,
        filter: isUploadHovered ? "brightness(1.15)" : "brightness(1)",
        scale: isUploadHovered ? 1.02 : 1
      }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      style={{ transformStyle: "preserve-3d", perspective: "1000px" }}
    >
      {/* AMBIENT RINGS BEHIND */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-white/[0.03] pointer-events-none" style={{ transform: "translate(-50%, -50%) translateZ(-50px)" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full border border-white/[0.03] pointer-events-none" style={{ transform: "translate(-50%, -50%) translateZ(-100px)" }} />
      
      {/* MAIN CARD BACKGROUND */}
      <div className="absolute inset-0 rounded-2xl bg-white/[0.06] backdrop-blur-xl border border-white/[0.1] shadow-2xl pointer-events-none" />
      
      {/* 5. CONTENT LAYER */}
      <div className="p-6 flex flex-col gap-4 h-full relative z-10">
        {/* Header Block */}
        <div className="space-y-2">
          <div className="w-1/2 h-2 bg-gray-400 rounded-full" />
          <div className="w-1/3 h-1 bg-gray-500 rounded-full" />
        </div>

        {/* Experience Block 1 */}
        <div className="space-y-3 mt-2">
          <div className="w-full h-1 bg-gray-500 rounded-full" />
          <div className="w-[90%] h-1 bg-gray-500 rounded-full" />
          
          <div className="relative flex items-center">
            <motion.div 
              className="h-2 rounded-full bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)]"
              animate={{ width: activeLine ? "95%" : "60%" }}
              transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </div>

        {/* Experience Block 2 */}
        <div className="space-y-3 mt-2">
          <div className="w-[85%] h-1 bg-gray-500 rounded-full" />
          <div className="w-[70%] h-1 bg-gray-500 rounded-full" />
          <div className="w-[80%] h-1 bg-gray-500 rounded-full" />
        </div>

        {/* Bottom Pills Block */}
        <div className="mt-auto flex justify-center gap-2">
          <div className="w-8 h-2 bg-gray-600 rounded-full" />
          <div className="w-10 h-2 bg-gray-600 rounded-full" />
          <div className="w-8 h-2 bg-gray-600 rounded-full" />
        </div>
      </div>
    </motion.div>
  );
};
