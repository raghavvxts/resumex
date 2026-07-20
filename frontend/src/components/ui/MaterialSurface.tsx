import React from "react";
import { motion } from "framer-motion";
import { useInteractionContext } from "../../contexts/InteractionContext";

export const MaterialSurface = () => {
  const { ambientState } = useInteractionContext();
  const isUploading = ambientState === "uploading";

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 bg-bg-base transition-colors duration-1000" style={{ maxWidth: '100vw' }}>
      {/* Global Lighting (Very soft overhead graphite illumination) */}
      <motion.div 
        className="absolute inset-0 mix-blend-screen"
        animate={{ opacity: isUploading ? 0.17 : 0.15 }}
        transition={{ duration: 2, ease: "easeInOut" }}
        style={{ 
          background: "radial-gradient(circle at 50% 0%, rgba(255,255,255,1) 0%, transparent 70%)", 
          filter: "blur(120px)" 
        }} 
      />
      
      {/* Moving Liquid Orbs (Dynamic background effects) */}
      <div className="liquid-orb liquid-orb-1" />
      <div className="liquid-orb liquid-orb-2" />
      <div className="liquid-orb liquid-orb-3" />

      {/* Sidebar Ambient Occlusion (Density variation) */}
      {/* An 1800px radial shadow centered near the sidebar, subtly darkening it to simulate material depth/thickness */}
      <div 
        className="absolute top-1/2 left-0 -translate-y-1/2 pointer-events-none"
        style={{
          width: "1800px",
          height: "1800px",
          left: "-400px", // Pushes the center of the radial gradient to around x=180px
          background: "radial-gradient(circle, rgba(0,0,0,0.4) 0%, transparent 60%)",
          mixBlendMode: "multiply",
          zIndex: 1, // Sits above the global lighting to occlude it slightly
        }}
      />
    </div>
  );
};
