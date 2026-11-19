import React from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { LayoutDashboard, FileText, BarChart3, PenTool } from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Builder", path: "/builder", icon: FileText },
  { label: "Skills", path: "/skills", icon: BarChart3 },
  { label: "Cover", path: "/cover", icon: PenTool },
];

export const MobileNavbar = () => {
  const location = useLocation();
  const reducedMotion = useReducedMotion();
  return (
    <nav
      aria-label="Primary navigation"
      className="mobile-navigation fixed left-4 right-4 h-16 rounded-2xl z-40 backdrop-blur-xl border flex justify-around items-center px-2 lg:hidden"
    >
      {NAV_ITEMS.map(({ label, path, icon: Icon }) => {
        const active =
          location.pathname === path ||
          (path === "/dashboard" && location.pathname === "/");
        return (
          <Link
            key={path}
            to={path}
            aria-current={active ? "page" : undefined}
            className="relative group flex flex-col items-center justify-center flex-1 min-w-0 h-full py-1 rounded-xl"
          >
            {active && (
              <motion.div
                layoutId="activeMobileNav"
                className="mobile-nav-active absolute inset-1 rounded-xl"
                transition={
                  reducedMotion
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 380, damping: 30 }
                }
              />
            )}
            <Icon
              aria-hidden="true"
              className={`w-5 h-5 relative z-10 transition-colors ${active ? "text-white" : "text-text-muted group-hover:text-white"}`}
            />
            <span
              className={`relative z-10 text-[10px] font-medium mt-1 ${active ? "text-white" : "text-text-muted group-hover:text-white"}`}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};
