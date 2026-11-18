import React, { useState } from "react";
import { Check, Copy, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const CopyButton = ({
  text,
  label = "Copy",
}: {
  text: string;
  label?: string;
}) => {
  const [failed, setFailed] = useState(false);
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          setFailed(false);
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch (e) {
          setFailed(true);
        }
      }}
      className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-caption font-semibold
                 border border-white/8 text-[#A1A1AA] hover:text-white hover:border-white/15
                 hover:bg-white/4 transition-all"
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {failed
        ? "Copy failed — select text instead"
        : copied
          ? "Copied!"
          : label}
    </button>
  );
};

export const AILoader = ({ msg }: { msg: string }) => (
  <div className="flex flex-col items-center justify-center h-[280px] gap-6">
    <div className="relative w-16 h-16">
      <div
        className="absolute inset-0 rounded-full border-2 border-[rgba(255,255,255,0.15)] spin-slow"
        style={{ borderTopColor: "rgba(255,255,255,0.7)" }}
      />
      <div
        className="absolute inset-2 rounded-full border border-[rgba(255,255,255,0.1)]"
        style={{
          borderBottomColor: "rgba(255,255,255,0.4)",
          animation: "spin-slow 2s linear infinite reverse",
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <Sparkles className="w-4 h-4 text-[#F5F5F7]" />
      </div>
    </div>
    <AnimatePresence mode="wait">
      <motion.p
        key={msg}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -5 }}
        transition={{ duration: 0.3 }}
        className="shimmer-text text-body-sm font-medium text-center"
      >
        {msg}
      </motion.p>
    </AnimatePresence>
  </div>
);
