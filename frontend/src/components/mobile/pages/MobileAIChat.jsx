import React, { useState, useRef, useEffect } from 'react';
import { Brain, Send, RotateCcw, Sparkles, History } from 'lucide-react';
import synapseLogo from '../../../assets/logo.png';
import api from '../../../services/api';

const QUICK_PROMPTS = [
  "How am I doing?",
  "Plan my day",
  "Explain my marks",
  "Where is my money going?"
];

export default function MobileAIChat() {
  const [message, setMessage] = useState('');
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const handleResume = () => {
    const saved = localStorage.getItem('synapse_chat_history');
    if (saved) {
      setConversationHistory(JSON.parse(saved));
    }
  };

  useEffect(() => {
    if (conversationHistory.length > 0) {
      localStorage.setItem('synapse_chat_history', JSON.stringify(conversationHistory));
    }
  }, [conversationHistory]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversationHistory, isLoading]);

  const handleSend = async (text) => {
    if (!text.trim()) return;
    const userMessage = { role: 'user', content: text };
    const newHistory = [...conversationHistory, userMessage];
    setConversationHistory(newHistory);
    setMessage('');
    setIsLoading(true);

    try {
      const historyForApi = newHistory.slice(-10);
      const res = await api.post('/ai/chat', { 
        message: text, 
        conversationHistory: historyForApi 
      });

      if (res.data && res.data.success) {
        setConversationHistory(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
      } else {
        const errorMsg = res.data?.limitHit 
          ? "⚠️ AI features are temporarily unavailable. Our daily AI limit has been reached. Please try again tomorrow."
          : "I'm having trouble connecting right now. Please try again later.";
        setConversationHistory(prev => [...prev, { role: 'assistant', content: errorMsg }]);
      }
    } catch (err) {
      console.error('Chat error:', err);
      const errorMsg = (err.response?.status === 429 || err.response?.data?.limitHit)
        ? "⚠️ AI features are temporarily unavailable. Our daily AI limit has been reached. Please try again tomorrow."
        : "I'm having trouble connecting right now. Please try again later.";
      setConversationHistory(prev => [...prev, { role: 'assistant', content: errorMsg }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setConversationHistory([]);
  };

  return (
    <div className="mobile-shell flex flex-col" style={{
      height: '100dvh',
      background: 'var(--mobile-bg)',
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
    }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-white/70 dark:bg-[#1E1E1E]/80 backdrop-blur-md border-b border-[#E8E8E8] dark:border-white/10 shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-primary-subtle flex items-center justify-center border border-brand-primary-subtle">
            <img src={synapseLogo} alt="Synapse" style={{ width: '20px', height: '20px' }} />
          </div>
          <div>
            <h1 className="font-bold text-[18px] text-[#212121] dark:text-[#ECECEC] tracking-tight leading-none">Synapse AI</h1>
            <span className="text-[12px] text-[#888888] dark:text-[#A3A3A3] font-medium mt-1 block">Contextually Aware</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleResume} className="p-2.5 rounded-xl text-[#888888] dark:text-[#A3A3A3] hover:text-brand-primary bg-surface-raised transition-colors shadow-sm" title="Resume Previous Chat">
            <History className="w-5 h-5" />
          </button>
          <button onClick={clearChat} className="p-2.5 rounded-xl text-[#888888] dark:text-[#A3A3A3] hover:text-status-danger bg-surface-raised transition-colors shadow-sm" title="Clear Chat">
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
        {conversationHistory.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center mt-6">
            <div className="w-16 h-16 rounded-3xl bg-surface-raised shadow-md border border-surface-border flex items-center justify-center mb-6 relative">
              <Sparkles className="w-8 h-8 text-brand-primary" />
            </div>
            <h3 className="text-2xl font-bold text-[#212121] dark:text-[#ECECEC] mb-3 tracking-tight">How can I help?</h3>
            <p className="text-[15px] text-[#666666] dark:text-[#A3A3A3] leading-relaxed mb-10 px-4">I have access to your full academic context.</p>
            
            <div className="w-full grid grid-cols-2 gap-3 mt-2">
              {QUICK_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(prompt)}
                    className="relative p-4 min-h-[80px] bg-surface-base border border-surface-border rounded-2xl text-left hover:border-brand-primary-subtle shadow-sm flex flex-col justify-center"
                  >
                    <span className="text-[13.5px] font-semibold text-text-secondary leading-snug">
                      {prompt}
                    </span>
                  </button>
              ))}
            </div>
          </div>
        ) : (
          conversationHistory.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'user' ? (
                <div className="max-w-[85%] px-5 py-3.5 bg-brand-primary text-white rounded-3xl rounded-tr-md text-[15px] leading-relaxed shadow-sm">
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              ) : (
                <div className="max-w-[90%] text-[#212121] dark:text-[#ECECEC] text-[15px] leading-relaxed flex gap-3.5">
                  <div className="w-8 h-8 rounded-full bg-surface-raised border border-surface-border shadow-sm flex items-center justify-center shrink-0 mt-0.5">
                    <img src={synapseLogo} alt="Synapse" style={{ width: '16px', height: '16px' }} />
                  </div>
                  <div className="pt-1 whitespace-pre-wrap text-[#333333] dark:text-[#D4D4D4] leading-[1.6]">
                    {msg.content}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[90%] flex gap-3.5">
              <div className="w-8 h-8 rounded-full bg-surface-raised border border-surface-border shadow-sm flex items-center justify-center shrink-0 mt-0.5">
                <img src={synapseLogo} alt="Synapse" style={{ width: '16px', height: '16px' }} />
              </div>
              <div className="pt-3 flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-brand-primary animate-[bounce_1.4s_infinite_ease-in-out]"></div>
                <div className="w-2 h-2 rounded-full bg-brand-primary animate-[bounce_1.4s_infinite_ease-in-out] delay-[0.2s]"></div>
                <div className="w-2 h-2 rounded-full bg-brand-primary animate-[bounce_1.4s_infinite_ease-in-out] delay-[0.4s]"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div 
        className="p-4 bg-white/90 dark:bg-[#1E1E1E]/95 backdrop-blur-xl border-t border-[#E8E8E8] dark:border-white/10 shrink-0"
        style={{ paddingBottom: 'calc(16px + 64px + env(safe-area-inset-bottom))' }}
      >
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(message); }}
          className="relative flex items-end shadow-sm bg-surface-raised rounded-[24px] transition-all duration-300 p-1.5"
        >
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(message);
              }
            }}
            placeholder="Ask Synapse AI..."
            className="flex-1 max-h-32 min-h-[44px] bg-transparent outline-none border-none resize-none focus:ring-0 py-2.5 pl-4 pr-2 text-[15px] text-text-primary placeholder:text-text-tertiary leading-relaxed"
            rows={1}
          />
          <button
            type="submit"
            disabled={!message.trim() || isLoading}
            className="w-10 h-10 shrink-0 rounded-full bg-brand-primary text-white flex items-center justify-center hover:bg-brand-primary-hover disabled:opacity-40 transition-all ml-1 mb-1 mr-1 shadow-md"
          >
            <Send className="w-4 h-4 ml-[-2px]" />
          </button>
        </form>
      </div>
    </div>
  );
}
