import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { Send, Loader2, Sparkles, Globe } from 'lucide-react';
import MarkdownText from '../../components/MarkdownText';

export default function ExplorerChat({ sessionId, initialMessages = [], onNewResources }) {
  const [chats, setChats] = useState(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    setChats(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [chats, isTyping]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isTyping) return;

    const question = inputValue.trim();
    setInputValue('');
    
    // Optimistic UI update
    const tempId = Date.now().toString();
    setChats(prev => [...prev, { _id: tempId, role: 'user', content: question }]);
    setIsTyping(true);

    try {
      const res = await api.post(`/resources/sessions/${sessionId}/messages`, { message: question });
      
      if (res.data.success) {
        setChats(prev => [
          ...prev, 
          { 
            _id: Date.now().toString() + '1', 
            role: 'assistant', 
            content: res.data.reply.content,
            searchPerformed: res.data.reply.searchPerformed
          }
        ]);
        
        if (res.data.newResources && onNewResources) {
          onNewResources(res.data.newResources);
        }
      }
    } catch (err) {
      console.error('Failed to ask question', err);
      setChats(prev => [
        ...prev, 
        { _id: Date.now().toString() + 'err', role: 'assistant', content: err.response?.data?.message || 'Sorry, I encountered an error.' }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="w-full flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-full">
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
        {chats.length === 0 && !isTyping ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <Sparkles className="w-12 h-12 text-indigo-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-900">AI Tutor is Ready</h3>
            <p className="text-gray-500 max-w-sm mt-2">Ask follow-up questions about this roadmap. I can find alternative courses, exercises, or clarify concepts.</p>
          </div>
        ) : (
          chats.map((chat, idx) => (
            <div key={chat._id || idx} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-5 py-4 ${
                chat.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-br-sm shadow-md' 
                  : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm'
              }`}>
                {chat.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2 text-indigo-600">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">AI Assistant</span>
                    {chat.searchPerformed && (
                      <span className="ml-2 px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded text-[10px] flex items-center gap-1">
                        <Globe className="w-3 h-3" /> Searched the web
                      </span>
                    )}
                  </div>
                )}
                
                <div className={`leading-relaxed overflow-hidden ${chat.role === 'user' ? 'text-white' : 'text-gray-800'}`}>
                  {chat.role === 'user' ? (
                    <div className="whitespace-pre-wrap">{chat.content}</div>
                  ) : (
                    <MarkdownText text={chat.content} className="text-gray-700" />
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-5 py-4 shadow-sm flex items-center gap-2 text-indigo-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">AI is thinking...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-gray-100">
        <form onSubmit={handleSendMessage} className="relative flex items-center">
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder="Ask a question about these resources..."
            disabled={isTyping}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-4 pr-12 py-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all disabled:opacity-50"
          />
          <button 
            type="submit"
            disabled={!inputValue.trim() || isTyping}
            className="absolute right-2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-center text-xs text-gray-400 mt-2">AI can search the web dynamically if needed.</p>
      </div>
    </div>
  );
}
