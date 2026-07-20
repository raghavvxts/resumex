// Glassmorphism Levels

export const glass = {
  0: { // Background
    background: "transparent",
    border: "none",
    backdropFilter: "none",
  },
  1: { // Helper cards, almost merged into background
    background: "rgba(255, 255, 255, 0.01)",
    border: "none",
    backdropFilter: "blur(4px)",
  },
  2: { // Secondary cards, almost flat
    background: "rgba(255, 255, 255, 0.02)",
    border: "none",
    backdropFilter: "blur(8px)",
  },
  3: { // Primary cards (e.g. active states, core panels)
    background: "rgba(10, 10, 10, 0.6)",
    border: "none",
    backdropFilter: "blur(24px) saturate(120%)",
  },
  4: { // Focused/Milled elements (e.g. Vision Pro window)
    background: "rgba(20, 20, 20, 0.8)",
    border: "1px solid rgba(255, 255, 255, 0.04)", // Very tiny milled bevel effect
    backdropFilter: "blur(32px) saturate(150%)",
  }
};
