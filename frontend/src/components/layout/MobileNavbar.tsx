import React from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { LayoutDashboard, FileText, BarChart3, PenTool } from "lucide-react";

export const MobileNavbar = () => {
  const location = useLocation();

  const NAV_ITEMS = [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { label: "Builder", path: "/builder", icon: FileText },
    { label: "Skills", path: "/skills", icon: BarChart3 },
    { label: "Cover", path: "/cover", icon: PenTool },
  ];

  return (
    <div className="fixed bottom-4 left-4 right-4 h-16 rounded-2xl z-40 bg-[#0A0A0A]/85 backdrop-blur-xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex justify-around items-center px-2 lg:hidden">
      {NAV_ITEMS.map((item) => {
        const active = location.pathname === item.path || (item.path === "/dashboard" && location.pathname === "/");
        const Icon = item.icon;

        return (
          <Link
            key={item.path}
            to={item.path}
            className="relative flex flex-col items-center justify-center flex-1 h-full py-1 cursor-pointer select-none"
          >
            {active && (
              <>
                {/* Glowing Active Backing */}
                <motion.div
                  layoutId="activeMobileNav"
                  className="absolute inset-0 rounded-xl"
                  style={{
                    background: 'radial-gradient(circle, rgba(168, 85, 247, 0.18) 0%, transparent 80%)',
                    border: '1px solid rgba(168, 85, 247, 0.15)',
                    boxShadow: '0 0 16px rgba(168, 85, 247, 0.08)',
                  }}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
                {/* Top active dot */}
                <motion.div
                  layoutId="activeMobileDot"
                  className="absolute top-1 w-1.5 h-1.5 rounded-full bg-purple-500"
                  style={{ boxShadow: '0 0 8px rgba(168, 85, 247, 0.8)' }}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              </>
            )}
            
            <Icon className={`w-5 h-5 relative z-10 transition-colors duration-300 ${active ? "text-white" : "text-text-muted group-hover:text-text-secondary"}`} />
            <span className={`relative z-10 text-[10px] tracking-wide font-medium mt-1 transition-colors duration-300 ${active ? "text-white" : "text-text-muted"}`}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
};
