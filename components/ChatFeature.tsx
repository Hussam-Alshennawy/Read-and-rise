
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, LoadingState } from '../types';
import { sendChatMessage } from '../services/geminiService';
import { Send, User, Sparkles, Loader2, AlertCircle } from 'lucide-react';

const ChatFeature: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: 'أهلاً بك. أنا مساعدك في "اقرأ وارتق". كيف يمكنني مساعدتك اليوم في رحلتك المعرفية؟',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<LoadingState>(LoadingState.IDLE);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || status === LoadingState.LOADING) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setStatus(LoadingState.LOADING);

    // Prepare history for API
    const apiHistory = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    try {
      const responseText = await sendChatMessage(apiHistory, userMsg.text);
      const modelMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, modelMsg]);
      setStatus(LoadingState.SUCCESS);
    } catch (error) {
      setStatus(LoadingState.ERROR);
      // Add a temporary error message to UI but don't save it to history context usually
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: 'عذراً، واجهت مشكلة في الاتصال. يرجى المحاولة مرة أخرى.',
        timestamp: new Date(),
        isError: true
      }]);
    }
  };

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-64px-64px)] md:h-[calc(100vh-64px)] flex flex-col bg-white md:shadow-xl md:border-x md:border-slate-100">
      {/* Chat Header (Mobile Only context usually, but good for title) */}
      <div className="p-4 border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <h2 className="font-bold text-primary-900 flex items-center gap-2">
          <Sparkles size={18} className="text-gold-500" />
          المساعد الذكي
        </h2>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                isUser ? 'bg-primary-100 text-primary-700' : 'bg-gold-100 text-gold-700'
              }`}>
                {isUser ? <User size={16} /> : <Sparkles size={16} />}
              </div>
              
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 leading-relaxed shadow-sm ${
                isUser 
                  ? 'bg-primary-600 text-white rounded-tr-none' 
                  : msg.isError 
                    ? 'bg-red-50 text-red-800 border border-red-100'
                    : 'bg-slate-50 text-slate-800 border border-slate-100 rounded-tl-none'
              }`}>
                {msg.isError && <AlertCircle size={16} className="inline-block ml-2 mb-1" />}
                {msg.text}
                <div className={`text-[10px] mt-2 opacity-60 ${isUser ? 'text-primary-100' : 'text-slate-400'}`}>
                  {msg.timestamp.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
        {status === LoadingState.LOADING && (
          <div className="flex gap-3">
             <div className="w-8 h-8 rounded-full bg-gold-100 text-gold-700 flex items-center justify-center">
                <Sparkles size={16} />
             </div>
             <div className="bg-slate-50 rounded-2xl rounded-tl-none px-4 py-3 border border-slate-100 flex items-center gap-2 text-slate-500">
               <Loader2 size={16} className="animate-spin" />
               <span className="text-sm">يكتب الآن...</span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-100">
        <form onSubmit={handleSend} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="اكتب سؤالك هنا..."
            className="w-full bg-white text-slate-900 border border-slate-200 rounded-full py-3 pr-5 pl-14 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
            disabled={status === LoadingState.LOADING}
          />
          <button
            type="submit"
            disabled={!input.trim() || status === LoadingState.LOADING}
            className="absolute left-2 p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:opacity-50 disabled:hover:bg-primary-600 transition-colors"
          >
            <Send size={18} className={document.dir === 'rtl' ? 'rotate-180' : ''} /> 
            {/* Note: Send icon usually points right. In RTL we want it pointing left. Lucide icons are LTR by default. */}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatFeature;
