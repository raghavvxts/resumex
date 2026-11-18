import React, { useState, useEffect, useRef } from "react";
import { useResumeContext } from "../../../contexts/ResumeContext";
import { chatWithStrategist } from "../../../services/api/chat";
import { useDialog } from "../../../hooks/use-dialog";

export const StrategistDrawer = ({
  isOpen,
  onClose,
  initialQuery,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}) => {
  const {
    file,
    resumeText,
    resumeInputMode,
    jobDescription,
    roleLevel,
    yearsExperience,
    messages,
    setMessages,
    sessionVersion,
  } = useResumeContext();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const activeVersion = useRef(sessionVersion);
  activeVersion.current = sessionVersion;
  const inFlight = useRef(false);
  const dialog = useDialog(isOpen, onClose);
  useEffect(() => {
    if (isOpen && initialQuery) setInput(initialQuery);
  }, [isOpen, initialQuery]);
  useEffect(() => {
    setInput("");
    setLoading(false);
    inFlight.current = false;
  }, [sessionVersion]);
  const send = async () => {
    if (!input.trim() || inFlight.current) return;
    const text = input.trim(),
      version = sessionVersion;
    inFlight.current = true;
    setLoading(true);
    setInput("");
    const history = messages.map((m) => ({
      role: m.sender === "ai" ? "assistant" : "user",
      content: m.text,
    }));
    setMessages((prev) => [...prev, { sender: "user", text }]);
    try {
      const reply = await chatWithStrategist(
        file,
        resumeText,
        resumeInputMode,
        jobDescription,
        text,
        history,
        roleLevel,
        yearsExperience,
      );
      if (activeVersion.current === version)
        setMessages((prev) => [...prev, { sender: "ai", text: reply }]);
    } catch (e) {
      if (activeVersion.current === version)
        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: e instanceof Error ? e.message : "Chat failed. Please retry.",
          },
        ]);
    } finally {
      if (activeVersion.current === version) {
        setLoading(false);
        inFlight.current = false;
      }
    }
  };
  if (!isOpen) return null;
  return (
    <div
      ref={dialog}
      role="dialog"
      aria-modal="true"
      aria-label="Resume assistant"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-8 sm:bottom-8 sm:w-[420px] h-[min(600px,90dvh)] z-50 flex flex-col glass-modal overflow-hidden"
    >
      <header className="flex justify-between items-center p-4 border-b border-white/15">
        <h2 className="font-bold">Resume assistant</h2>
        <button
          aria-label="Close assistant"
          className="btn-secondary px-3 py-2"
          onClick={onClose}
        >
          Close
        </button>
      </header>
      <div className="flex-1 overflow-y-auto p-4 space-y-4" aria-live="polite">
        {messages.length === 0 && (
          <p>
            Ask about your resume or target role. Check suggested facts before
            using them.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`p-3 rounded-xl whitespace-pre-wrap ${m.sender === "user" ? "bg-purple-500/20" : "bg-white/5"}`}
          >
            <span className="text-xs text-text-secondary block mb-1">
              {m.sender === "user" ? "You" : "Assistant"}
            </span>
            {m.text}
          </div>
        ))}
        {loading && <p role="status">Preparing a reply…</p>}
      </div>
      <form
        className="p-4 flex gap-2 border-t border-white/15"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <input
          aria-label="Message"
          className="glass-input p-3 min-w-0 flex-1"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your resume…"
        />
        <button
          className="btn-primary px-4"
          disabled={loading || !input.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
};
