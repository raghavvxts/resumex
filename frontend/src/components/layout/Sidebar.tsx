import React from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { LayoutDashboard, FileText, BarChart3, PenTool } from "lucide-react";
import {
  useInteractionContext,
  HoveredElement,
} from "../../contexts/InteractionContext";

const NavItem = ({
  icon: Icon,
  label,
  path,
  interactionKey,
}: {
  icon: React.ElementType;
  label: string;
  path: string;
  interactionKey: HoveredElement;
}) => {
  const location = useLocation();
  const { setHoveredElement } = useInteractionContext();
  const active =
    location.pathname === path ||
    (path === "/dashboard" && location.pathname === "/");

  return (
    <Link
      to={path}
      aria-current={active ? "page" : undefined}
      className="relative flex items-center gap-3 mx-4 my-1 px-4 py-3 cursor-pointer select-none group rounded-xl transition-all duration-300 hover:bg-white/[0.02] border border-transparent hover:border-white/[0.04]"
      onMouseEnter={() => setHoveredElement(interactionKey)}
      onMouseLeave={() => setHoveredElement(null)}
    >
      {active && (
        <motion.div
          layoutId="activeNavIndicator"
          className="absolute inset-0 rounded-xl"
          style={{
            background: "var(--action-bg)",
            border: "1px solid var(--action-border)",
            boxShadow: "var(--action-shadow)",
            backdropFilter: "blur(40px) saturate(200%)",
            WebkitBackdropFilter: "blur(40px) saturate(200%)",
          }}
          initial={false}
          transition={{ type: "spring", stiffness: 400, damping: 40 }}
        />
      )}
      <Icon
        className={`w-4 h-4 shrink-0 relative z-10 transition-colors duration-300 ${active ? "text-white" : "text-text-muted group-hover:text-text-secondary"}`}
      />
      <span
        className={`relative z-10 text-body-sm tracking-wide transition-colors duration-300 ${active ? "text-white font-medium" : "text-text-muted group-hover:text-text-secondary"}`}
      >
        {label}
      </span>
    </Link>
  );
};

export const Sidebar = () => {
  return (
    <aside className="sidebar flex-shrink-0 hidden lg:flex flex-col w-[320px] relative z-20 bg-transparent">
      {/* Logo Area */}
      <div className="px-6 py-6 pt-10 mb-6">
        <div className="flex items-center gap-4">
          {/* Brand Logo Icon */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center relative overflow-hidden shrink-0"
            style={{
              background: "linear-gradient(135deg, #0F081D 0%, #05020A 100%)",
              border: "1.5px solid rgba(255, 255, 255, 0.15)",
              boxShadow: "0 4px 14px rgba(0,0,0,0.4)",
            }}
          >
            <div className="absolute inset-0 bg-purple-500 opacity-[0.2] blur-[4px]" />
            <svg
              className="w-8 h-8 relative z-10"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7 6C7 4.89543 7.89543 4 9 4H15L19 8V18C19 19.1046 18.1046 20 17 20H9C7.89543 20 7 19.1046 7 18V6Z"
                stroke="url(#logoPurple)"
                strokeWidth="1.5"
              />
              <path d="M15 4V8H19L15 4Z" fill="url(#logoPurple)" />
              <path
                d="M17 17C17 17 17 18.5 18.5 18.5C17 18.5 17 20 17 20C17 20 17 18.5 15.5 18.5C17 18.5 17 17 17 17Z"
                fill="#38BDF8"
              />
              <line
                x1="9.5"
                y1="9"
                x2="13.5"
                y2="9"
                stroke="#FFFFFF"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <line
                x1="9.5"
                y1="12"
                x2="15.5"
                y2="12"
                stroke="rgba(255, 255, 255, 0.4)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <line
                x1="9.5"
                y1="15"
                x2="13.5"
                y2="15"
                stroke="rgba(255, 255, 255, 0.4)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient
                  id="logoPurple"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#C084FC" />
                  <stop offset="100%" stopColor="#8B5CF6" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div>
            <p className="text-[23px] font-bold text-white tracking-tight leading-none font-display">
              Resumaxer
            </p>
            <p className="text-[11px] font-bold text-[#A855F7] mt-2.5 tracking-[0.28em] uppercase">
              Intelligence
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="py-4 space-y-1">
        <NavItem
          icon={LayoutDashboard}
          label="Dashboard"
          path="/dashboard"
          interactionKey="dashboard"
        />
        <NavItem
          icon={FileText}
          label="Resume Builder"
          path="/builder"
          interactionKey="builder"
        />
        <NavItem
          icon={BarChart3}
          label="Skills Analysis"
          path="/skills"
          interactionKey="skills"
        />
        <NavItem
          icon={PenTool}
          label="Cover Letter"
          path="/cover"
          interactionKey={null}
        />
      </nav>

      <div className="flex-1" />
    </aside>
  );
};
