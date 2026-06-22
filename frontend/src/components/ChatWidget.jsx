import React, { useState, useRef, useEffect } from 'react';
import { Brain, X, Send, RotateCcw, Sparkles } from 'lucide-react';
import api from '../services/api';

const QUICK_PROMPTS = [
  "How am I doing?",
  "Plan my day",
  "Explain my marks",
  "Where is my money going?"
];

function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversationHistory, isLoading]);

  const toggleOpen = () => setIsOpen(prev => !prev);

  const handleSend = async (text) => {
    if (!text.trim()) return;

    const userMessage = { role: 'user', content: text };
    const newHistory = [...conversationHistory, userMessage];
    
    setConversationHistory(newHistory);
    setMessage('');
    setIsLoading(true);

    try {
      // Keep only last 10 messages for the API request context
      const historyForApi = conversationHistory.slice(-10);

      const res = await api.post('/ai/chat', { 
        message: text, 
        conversationHistory: historyForApi 
      });

      if (res.data && res.data.success) {
        setConversationHistory(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
      } else {
        if (res.data && res.data.limitHit) {
          setConversationHistory(prev => [...prev, { 
            role: 'assistant', 
            content: "⚠️ AI features are temporarily unavailable. Our daily AI limit has been reached. Please try again tomorrow." 
          }]);
        } else {
          setConversationHistory(prev => [...prev, { 
            role: 'assistant', 
            content: "I'm having trouble connecting right now. Please try again later." 
          }]);
        }
      }
    } catch (err) {
      console.error('Chat error:', err);
      if (err.response?.status === 429 || err.response?.data?.limitHit) {
        setConversationHistory(prev => [...prev, { 
          role: 'assistant', 
          content: "⚠️ AI features are temporarily unavailable. Our daily AI limit has been reached. Please try again tomorrow." 
        }]);
      } else {
        setConversationHistory(prev => [...prev, { 
          role: 'assistant', 
          content: "I'm having trouble connecting right now. Please try again later." 
        }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setConversationHistory([]);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={toggleOpen}
        className={`fixed right-6 bottom-24 z-50 flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-tr from-blue-500 to-sky-400 text-white shadow-xl shadow-blue-500/40 hover:scale-110 hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500/50 group ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
        aria-label="Open AI Assistant"
      >
        <div className="relative flex items-center justify-center">
          <Brain className="w-8 h-8 transition-transform duration-300 group-hover:scale-110" />
          <Sparkles className="w-4 h-4 absolute -top-1 -right-2 text-white animate-pulse" />
        </div>
      </button>

      {/* Chat Panel */}
      <div 
        className={`fixed right-6 bottom-24 z-50 w-[320px] h-[450px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col transition-all duration-300 origin-bottom-right ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 pointer-events-none translate-y-4'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-indigo-600 text-white rounded-t-2xl">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            <span className="font-semibold tracking-wide">Synapse AI</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={clearChat} className="p-1 hover:bg-indigo-500 rounded transition-colors text-indigo-200 hover:text-white" title="Clear chat">
              <RotateCcw className="w-4 h-4" />
            </button>
            <button onClick={toggleOpen} className="p-1 hover:bg-indigo-500 rounded transition-colors text-indigo-200 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Prompts */}
        {conversationHistory.length === 0 && (
          <div className="px-3 pt-3 pb-1 border-b border-slate-100 bg-slate-50 overflow-x-auto no-scrollbar whitespace-nowrap">
            <div className="flex gap-2">
              {QUICK_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(prompt)}
                  className="inline-block px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-colors shadow-sm whitespace-nowrap flex-shrink-0"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {conversationHistory.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center space-y-3">
              <Sparkles className="w-8 h-8 text-indigo-200" />
              <p className="text-sm">I have access to your full academic context. How can I help you today?</p>
            </div>
          ) : (
            conversationHistory.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-sm shadow-sm'}`}>
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-white border border-slate-200 px-4 py-3 shadow-sm flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 bg-white border-t border-slate-100 rounded-b-2xl">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(message); }}
            className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all"
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
              className="flex-1 max-h-32 min-h-[40px] bg-transparent border-none resize-none focus:ring-0 p-2 text-sm text-slate-700"
              rows={1}
            />
            <button
              type="submit"
              disabled={!message.trim() || isLoading}
              className="p-2 mb-0.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export default ChatWidget;
