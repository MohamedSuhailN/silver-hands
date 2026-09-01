import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, X, Sparkles, Send, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { aiAssistant } from '../../api/client';
import api from '../../api/client';

export const AssistantModal = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      content: 'Welcome to SilverHands Assistant! How can I help you today? (You can use voice or type below)',
      isAction: false
    }
  ]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(true);
  const [sessionId] = useState(() => Math.random().toString(36).substring(7));
  
  const { language } = useLanguage();
  const navigate = useNavigate();
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);
  const stopFlagRef = useRef(false);
  
  // Auto-scroll chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const speakText = (text) => {
    if (!voiceOutputEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    // Optional: map language to TTS voice, for now let browser default
    window.speechSynthesis.speak(utterance);
  };

  const getRecognitionLanguage = (lang) => {
    const langMap = { 'en': 'en-IN', 'ta': 'ta-IN', 'hi': 'hi-IN' };
    return langMap[lang] || 'en-IN';
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech Recognition not supported. Please type.");
      return;
    }

    if (!recognitionRef.current) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = getRecognitionLanguage(language);
      recognitionRef.current.continuous = false; // Stop after one utterance
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        stopFlagRef.current = false;
        window.speechSynthesis.cancel(); // Stop playing output if user starts speaking
      };

      recognitionRef.current.onresult = (event) => {
        let text = "";
        for (let i = 0; i < event.results.length; i++) {
          text += event.results[i][0].transcript + " ";
        }
        text = text.trim();
        if (text) {
          handleSubmitMessage(text);
        }
        stopListening();
      };

      recognitionRef.current.onerror = (e) => {
        console.log('Speech error:', e.error);
        stopListening();
      };
      
      recognitionRef.current.onend = () => {
         setIsListening(false);
      };
    } else {
      recognitionRef.current.lang = getRecognitionLanguage(language);
    }

    try {
      recognitionRef.current.start();
    } catch (e) {
      console.log('Error starting recognition', e);
    }
  };

  const stopListening = () => {
    stopFlagRef.current = true;
    setIsListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
  };

  const toggleListening = () => {
    if (isListening) stopListening();
    else startListening();
  };

  const executeBackendAction = async (actionDef) => {
    if (!actionDef || !actionDef.endpoint) return;
    try {
      const { endpoint, method, payload } = actionDef;
      if (method === 'POST') {
        await api.post(endpoint, payload);
      } else if (method === 'GET') {
        await api.get(endpoint);
      } else if (method === 'PATCH') {
        await api.patch(endpoint, payload);
      }
    } catch (err) {
      console.error('Action failed:', err);
      addMessage('System encountered an error executing the action.', 'ai');
    }
  };

  const handleSubmitMessage = async (userText) => {
    if (!userText.trim()) return;
    
    addMessage(userText, 'user');
    setInput('');
    setIsProcessing(true);

    try {
      const res = await aiAssistant(userText, {}, sessionId);
      const data = res.data;

      addMessage(data.message, 'ai', data.confirmation_needed);
      speakText(data.message);

      if (data.navigation_target) {
        setTimeout(() => {
          navigate(data.navigation_target);
          onClose(); // Optional: close modal on navigation
        }, 1500);
      }
      
      // If it's a confirmed action, execute backend call if present
      if (data.action === 'confirmed' || data.action === 'fetch_bookings') {
         if (data.backend_action || data.action_on_confirm) {
           // Execute action
           const act = data.backend_action || data.action_on_confirm;
           await executeBackendAction(act);
         }
      }

    } catch (error) {
      console.error("AI Assistant Error:", error);
      addMessage("I'm having trouble connecting right now. Please try again.", 'ai');
      speakText("I'm having trouble connecting right now.");
    } finally {
      setIsProcessing(false);
    }
  };

  const addMessage = (content, role, isAction = false) => {
    setMessages(prev => [...prev, { role, content, isAction }]);
  };

  const handleConfirmAction = async (isConfirm) => {
    const text = isConfirm ? 'Yes' : 'No';
    await handleSubmitMessage(text);
  };

  useEffect(() => {
    if (!isOpen) {
      stopListening();
      window.speechSynthesis.cancel();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full h-[85vh] sm:h-auto sm:max-h-[85vh] sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-warmgray-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-warmgray-100 bg-saffron/10">
          <div className="flex items-center gap-2 text-saffron-700 font-bold">
            <Sparkles className="w-5 h-5" />
            <span>SilverHands Assistant</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                setVoiceOutputEnabled(!voiceOutputEnabled);
                if (voiceOutputEnabled) window.speechSynthesis.cancel();
              }}
              className="p-2 rounded-full text-warmgray-500 hover:bg-white/50 transition-colors"
              title="Toggle Voice Output"
            >
              {voiceOutputEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-warmgray-400" />}
            </button>
            <button onClick={onClose} className="p-2 rounded-full text-warmgray-500 hover:bg-white/50 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-cream-50">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div 
                className={`max-w-[85%] rounded-2xl p-3 text-sm font-medium whitespace-pre-wrap ${
                  msg.role === 'user' 
                    ? 'bg-saffron text-white rounded-br-none' 
                    : 'bg-white border border-warmgray-200 text-warmgray-800 rounded-bl-none shadow-sm'
                }`}
              >
                {msg.content}
              </div>
              
              {/* Action Buttons if confirmation needed */}
              {msg.isAction && idx === messages.length - 1 && (
                <div className="flex gap-2 mt-2 ml-1">
                  <button 
                    onClick={() => handleConfirmAction(true)}
                    className="btn-primary py-1.5 px-4 text-xs"
                    disabled={isProcessing}
                  >
                    Yes, Proceed
                  </button>
                  <button 
                    onClick={() => handleConfirmAction(false)}
                    className="btn-ghost bg-white border border-warmgray-200 py-1.5 px-4 text-xs"
                    disabled={isProcessing}
                  >
                    No, Cancel
                  </button>
                </div>
              )}
            </div>
          ))}
          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-white border border-warmgray-200 rounded-2xl rounded-bl-none p-3 shadow-sm flex items-center gap-2 text-warmgray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-xs font-medium">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 border-t border-warmgray-200 bg-white">
          <div className="flex items-center gap-2 relative">
            <button
              onClick={toggleListening}
              className={`p-3 rounded-full flex-shrink-0 transition-all ${
                isListening 
                  ? 'bg-red-500 text-white animate-pulse shadow-md' 
                  : 'bg-cream-100 text-warmgray-600 hover:bg-cream-200'
              }`}
            >
              {isListening ? <Square className="w-5 h-5 fill-current" /> : <Mic className="w-5 h-5" />}
            </button>
            
            <div className="relative flex-1">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmitMessage(input)}
                placeholder={isListening ? "Listening..." : "Type your message..."}
                className="w-full pl-4 pr-10 py-3 rounded-xl border border-warmgray-200 bg-cream-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-saffron/30 text-sm"
                disabled={isListening || isProcessing}
              />
              <button 
                onClick={() => handleSubmitMessage(input)}
                disabled={!input.trim() || isListening || isProcessing}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-saffron hover:bg-saffron/10 disabled:opacity-30 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
