// Motion Curves & Beziers

export const motion = {
  // Beziers for CSS transitions
  ease: {
    default: "cubic-bezier(0.16, 1, 0.3, 1)", // Smooth, Apple-like ease-out
    inOut: "cubic-bezier(0.65, 0, 0.35, 1)", // Symmetrical ease for ambient animations
    bounce: "cubic-bezier(0.34, 1.56, 0.64, 1)", // Slight overshoot
  },
  
  // Semantic animation keyframes (to be defined in Tailwind config)
  keyframes: {
    heroFloat: {
      "0%, 100%": { transform: "translateY(0px)" },
      "50%": { transform: "translateY(-15px)" },
    },
    nodePulse: {
      "0%, 100%": { transform: "scale(1)", opacity: "0.8" },
      "50%": { transform: "scale(1.05)", opacity: "1", filter: "brightness(1.2)" },
    },
    tagFade: {
      "0%, 100%": { opacity: "0", transform: "translateY(4px)" },
      "10%, 90%": { opacity: "1", transform: "translateY(0)" },
    },
    lineTravel: {
      "0%": { strokeDashoffset: "100" },
      "100%": { strokeDashoffset: "0" },
    },
    cardReveal: {
      "0%": { opacity: "0", transform: "translateY(10px) scale(0.98)" },
      "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
    },
    ambientDrift: {
      "0%, 100%": { transform: "translate(0, 0) scale(1)" },
      "33%": { transform: "translate(3%, 4%) scale(1.05)" },
      "66%": { transform: "translate(-2%, 2%) scale(0.95)" },
    }
  }
};
