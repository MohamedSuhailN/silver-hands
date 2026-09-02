import React, { useState } from 'react';
import { Sparkles, MessageSquare, Send, Mic } from 'lucide-react';
import { aiBusinessAssistant } from '../../api/client';
import { useNotifications } from '../../context/NotificationContext';
import { VoiceListeningModal } from '../../components/voice/VoiceListeningModal';

export const AIAssistantPage = () => {
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState([
    {
      sender: 'ai',
      text: 'Namaste! I am your Artisan & Homemaker Business Advisor. How can I help you package, price, or market your traditional services and handmade goods today?'
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const { showToast } = useNotifications();

  const handleSend = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    const userText = question;
    setChatHistory((prev) => [...prev, { sender: 'user', text: userText }]);
    setQuestion('');
    setLoading(true);

    try {
      const res = await aiBusinessAssistant(userText);
      setChatHistory((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: res.data.reply || res.data.response || 'Here is my advice on growing your home craft business.',
          tips: res.data.actionable_tips
        }
      ]);
    } catch {
      showToast('AI Assistant is currently busy', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <span className="badge-tag bg-[#3F9BE8] text-white font-bold">
          <Sparkles className="w-3.5 h-3.5" /> AI Business Mentor
        </span>
        <h1 className="font-heading text-3xl font-extrabold text-[#163A5F]">Artisan & Homemaker Business Advisor</h1>
        <p className="text-sm text-[#64748B]">Ask advice on how to price pickles, handle custom stitching requests, manage festival orders, or expand your client base.</p>
      </div>

      <div className="card-surface flex flex-col h-[550px] shadow-warm-xl border border-[#DCEAF4] overflow-hidden bg-white">
        {/* Messages feed */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-[#F5F9FC]">
          {chatHistory.map((msg, i) => (
            <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-md p-4 rounded-2xl text-sm leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-[#3F9BE8] text-white rounded-br-none shadow-warm-sm'
                  : 'bg-white text-[#1F2937] border border-[#DCEAF4] rounded-bl-none shadow-warm-sm'
              }`}>
                <p>{msg.text}</p>
                {msg.tips && (
                  <div className="mt-3 pt-2 border-t border-[#DCEAF4] text-xs space-y-1">
                    <span className="font-bold text-[#1F6FB2] block">Actionable Tips:</span>
                    {msg.tips.map((tip, tIdx) => (
                      <p key={tIdx}>• {tip}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white p-3.5 rounded-2xl text-xs font-bold text-[#1F6FB2] border border-[#DCEAF4] animate-pulse">
                SilverHands AI is formulating practical business advice...
              </div>
            </div>
          )}
        </div>

        {/* Input bar */}
        <form onSubmit={handleSend} className="p-4 bg-white border-t border-[#DCEAF4] flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask anything e.g. How much should I charge for 1kg of homemade pickle?"
              className="w-full px-4 py-3 pr-10 rounded-xl border border-[#DCEAF4] text-sm font-medium bg-white focus:ring-2 focus:ring-[#3F9BE8]"
            />
            <button
              type="button"
              onClick={() => setIsVoiceOpen(true)}
              className="absolute right-2.5 top-2.5 p-1.5 rounded-lg text-[#64748B] hover:text-[#3F9BE8] transition-colors"
              title="Voice input"
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>
          <button type="submit" disabled={loading} className="btn-primary !px-5 flex items-center gap-1">
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      <VoiceListeningModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onVoiceCaptured={(txt) => setQuestion(txt)}
        title="Speak Your Business Question"
      />
    </div>
  );
};
