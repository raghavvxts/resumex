/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, ArrowRight } from "lucide-react";
import { useResumeContext } from "../../../contexts/ResumeContext";
import { chatWithStrategist } from "../../../services/api/chat";

export const StrategistDrawer = ({ isOpen, onClose, initialQuery }: { isOpen: boolean, onClose: () => void, initialQuery?: string }) => {
  const { file, resumeText, jobDescription, selectedRole, yearsExperience, result } = useResumeContext();
  
  // Proactive greeting logic
  const getInitialMessage = () => {
    if (result) {
      if (result.score < 60) {
        return "I found some important ATS issues. Want to see how to fix them?";
      }
      if (result.missing_keywords && result.missing_keywords.length > 10) {
        return `I can help improve keyword coverage. You're missing ${result.missing_keywords.length} important terms.`;
      }
      return "Your resume looks great! Want to see how we can make the bullet points even stronger?";
    }
    return 'Hi! I am The Strategist, your AI Career Assistant. Need help tweaking a resume bullet point?';
  };

  const [messages, setMessages] = useState([{ sender: 'ai', text: getInitialMessage() }]);
  const [input, setInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialQuery) {
        setInput(initialQuery);
      }
      // Re-evaluate the initial message if the result changes while drawer is closed
      if (messages.length === 1 && messages[0].sender === 'ai') {
        setMessages([{ sender: 'ai', text: getInitialMessage() }]);
      }
    }
  }, [isOpen, initialQuery, result]);

  const send = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    const history = messages;
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }, { sender: 'ai', text: '...' }]);
    setInput('');

    try {
      const mappedHistory = history.map(msg => ({
        role: msg.sender === 'ai' ? 'assistant' : 'user',
        content: msg.text
      }));

      const reply = await chatWithStrategist(
        file,
        resumeText,
        file ? "pdf" : "text",
        jobDescription,
        userMsg,
        mappedHistory
      );
      
      setMessages(prev => {
        const newArr = [...prev];
        newArr[newArr.length - 1] = { sender: 'ai', text: reply };
        return newArr;
      });
    } catch (e) {
      setMessages(prev => {
        const newArr = [...prev];
        newArr[newArr.length - 1] = { sender: 'ai', text: "Network error occurred." };
        return newArr;
      });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: 20, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0, scale: 0.95 }}
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-8 sm:bottom-24 sm:w-[380px] h-[500px] z-50 flex flex-col overflow-hidden glass-modal"
        >
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-purple-500/20 text-purple-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-body-sm font-bold text-white">The Strategist</h3>
                <p className="text-caption text-green-400 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 block" />Online</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-[#9CA3AF] hover:bg-white/5 hover:text-white transition-all"><X className="w-4 h-4" /></button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-4 flex flex-col">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-body-sm ${m.sender === 'user' ? 'bg-white text-black' : 'bg-white/10 text-white'} whitespace-pre-wrap leading-relaxed`}>
                  {m.text === '...' ? <span className="animate-pulse">Typing...</span> : m.text}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-white/10" style={{ background: "rgba(255,255,255,0.02)" }}>
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                placeholder="Ask me anything..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-body-sm text-white focus:outline-none focus:border-white/30"
              />
              <button onClick={send} className="absolute right-2 top-2 p-2 rounded-lg bg-white text-black hover:opacity-80">
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
