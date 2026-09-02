import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, X, Sparkles, Send, Volume2, VolumeX, Loader2, Star, MapPin, Award, CheckCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { aiAssistant } from '../../api/client';
import api from '../../api/client';

export const AssistantModal = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      content: 'Welcome to SilverHands Assistant! How can I help you today? (You can speak in English, தமிழ், or हिंदी, or type below)',
      isAction: false
    }
  ]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(true);
  const [sessionId] = useState(() => Math.random().toString(36).substring(7));
  
  const { language, changeLanguage } = useLanguage();
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
    
    // Map speech language
    if (language === 'ta') utterance.lang = 'ta-IN';
    else if (language === 'hi') utterance.lang = 'hi-IN';
    else utterance.lang = 'en-IN';

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const getRecognitionLanguage = (lang) => {
    const langMap = { 'en': 'en-IN', 'ta': 'ta-IN', 'hi': 'hi-IN' };
    return langMap[lang] || 'en-IN';
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      addMessage("Voice recognition is not supported in this browser. Please type your message below.", "ai");
      return;
    }

    if (!recognitionRef.current) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = getRecognitionLanguage(language);
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        stopFlagRef.current = false;
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
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
        if (e.error === 'not-allowed') {
          addMessage("Microphone access was denied. Please allow microphone permissions or type below.", "ai");
        } else if (e.error === 'no-speech') {
          // Silent timeout, no error spam
        }
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

  const [isSaving, setIsSaving] = useState(false);

  const executeBackendAction = async (actionDef) => {
    if (!actionDef || !actionDef.endpoint) return;
    setIsSaving(true);
    try {
      const { endpoint, method, payload } = actionDef;
      let res;
      if (method === 'POST') {
        res = await api.post(endpoint, payload);
      } else if (method === 'GET') {
        res = await api.get(endpoint);
      } else if (method === 'PATCH') {
        res = await api.patch(endpoint, payload);
      }
      addMessage('Saved successfully! Your profile details have been securely updated.', 'ai');
      speakText('Saved successfully! Your profile details have been securely updated.');
    } catch (err) {
      console.error('Action failed:', err);
      addMessage('Something went wrong while saving your details. Please try again.', 'ai');
      speakText('Something went wrong while saving your details.');
    } finally {
      setIsSaving(false);
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

      addMessage(data.message, 'ai', data.confirmation_needed, data.matches || []);
      speakText(data.message);

      if (data.navigation_target) {
        setTimeout(() => {
          navigate(data.navigation_target);
          onClose();
        }, 1500);
      }
      
      // If it's a confirmed action, execute backend call if present
      if (!data.confirmation_needed && (data.backend_action || data.action_on_confirm)) {
         const act = data.backend_action || data.action_on_confirm;
         await executeBackendAction(act);
      }

    } catch (error) {
      console.error("AI Assistant Error:", error);
      addMessage("Something went wrong connecting to the assistant. Please try again.", 'ai');
      speakText("Something went wrong connecting to the assistant.");
    } finally {
      setIsProcessing(false);
    }
  };

  const addMessage = (content, role, isAction = false, matches = []) => {
    setMessages(prev => [...prev, { role, content, isAction, matches }]);
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
    <div 
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="SilverHands AI Assistant"
    >
      <div className="bg-white w-full h-[85vh] sm:h-auto sm:max-h-[85vh] sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-[#DCEAF4]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-3.5 border-b border-[#DCEAF4] bg-[#EAF5FC]">
          <div className="flex items-center gap-2 text-[#163A5F] font-bold">
            <Sparkles className="w-5 h-5 text-[#3F9BE8]" />
            <span className="text-sm font-heading">SilverHands Guide</span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Language Selector */}
            <div className="flex bg-white rounded-xl p-0.5 border border-[#DCEAF4] text-[11px] font-semibold">
              <button
                onClick={() => changeLanguage('en')}
                className={`px-2 py-1 rounded-lg transition-all ${language === 'en' ? 'bg-[#3F9BE8] text-white shadow-sm' : 'text-[#64748B] hover:text-[#163A5F]'}`}
                aria-label="Switch to English"
              >
                EN
              </button>
              <button
                onClick={() => changeLanguage('ta')}
                className={`px-2 py-1 rounded-lg transition-all ${language === 'ta' ? 'bg-[#3F9BE8] text-white shadow-sm' : 'text-[#64748B] hover:text-[#163A5F]'}`}
                aria-label="Switch to Tamil"
              >
                தமிழ்
              </button>
              <button
                onClick={() => changeLanguage('hi')}
                className={`px-2 py-1 rounded-lg transition-all ${language === 'hi' ? 'bg-[#3F9BE8] text-white shadow-sm' : 'text-[#64748B] hover:text-[#163A5F]'}`}
                aria-label="Switch to Hindi"
              >
                हिंदी
              </button>
            </div>

            <button 
              onClick={() => {
                setVoiceOutputEnabled(!voiceOutputEnabled);
                if (voiceOutputEnabled) window.speechSynthesis.cancel();
              }}
              className="p-2 rounded-full text-[#64748B] hover:bg-white transition-colors"
              title="Toggle Voice Output"
              aria-label={voiceOutputEnabled ? "Mute Voice Output" : "Enable Voice Output"}
            >
              {voiceOutputEnabled ? <Volume2 className="w-4 h-4 text-[#3F9BE8]" /> : <VolumeX className="w-4 h-4 text-[#94A3B8]" />}
            </button>
            <button 
              onClick={onClose} 
              className="p-2 rounded-full text-[#64748B] hover:bg-white transition-colors"
              aria-label="Close Assistant"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Audio Status Bar */}
        {(isListening || isSpeaking) && (
          <div className="px-4 py-2 bg-[#EAF5FC] border-b border-[#DCEAF4] flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5 h-5">
                <span className="w-1 bg-[#3F9BE8] rounded-full animate-wave-1" />
                <span className="w-1 bg-[#3F9BE8] rounded-full animate-wave-2" />
                <span className="w-1 bg-[#3F9BE8] rounded-full animate-wave-3" />
                <span className="w-1 bg-[#3F9BE8] rounded-full animate-wave-4" />
              </div>
              <span className="text-xs font-bold text-[#163A5F]">
                {isListening ? "Listening to your voice..." : "Speaking response..."}
              </span>
            </div>
            {isListening && (
              <button 
                onClick={stopListening}
                className="text-[11px] font-bold text-[#DC3545] hover:underline"
              >
                Stop
              </button>
            )}
          </div>
        )}

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F5F9FC]">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div 
                className={`max-w-[85%] rounded-2xl p-3 text-sm font-medium whitespace-pre-wrap ${
                  msg.role === 'user' 
                    ? 'bg-[#3F9BE8] text-white rounded-br-none' 
                    : 'bg-white border border-[#DCEAF4] text-[#1F2937] rounded-bl-none shadow-sm'
                }`}
              >
                {msg.content}
              </div>

              {/* Matched Provider Cards */}
              {msg.matches && msg.matches.length > 0 && (
                <div className="w-full max-w-[90%] mt-2 space-y-2">
                  {msg.matches.map((item, mIdx) => (
                    <div 
                      key={mIdx}
                      className="p-3 bg-white border border-[#DCEAF4] rounded-2xl shadow-sm hover:border-[#3F9BE8] transition-all flex flex-col gap-2"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-1.5 font-bold text-[#163A5F] text-sm">
                            <span>{item.provider_name}</span>
                            <CheckCircle className="w-3.5 h-3.5 text-[#22A06B]" title="Verified Artisan" />
                          </div>
                          <div className="flex items-center gap-2 text-xs text-[#64748B] mt-0.5">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-[#94A3B8]" />
                              {item.location || 'Chennai, TN'}
                            </span>
                            <span>•</span>
                            <span>{item.experience_years}+ yrs exp</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 bg-[#EAF5FC] border border-[#DCEAF4] text-[#1F6FB2] px-1.5 py-0.5 rounded-md text-[11px] font-semibold">
                          <Star className="w-3 h-3 fill-current text-[#3F9BE8]" />
                          <span>{item.rating || '5.0'}</span>
                        </div>
                      </div>

                      {/* Explainable match reasons */}
                      {item.reasons && item.reasons.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {item.reasons.map((r, rIdx) => (
                            <span key={rIdx} className="bg-[#EAF5FC] text-[#1F6FB2] text-[10px] font-medium px-2 py-0.5 rounded-full">
                              {r}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-2 pt-1 border-t border-[#E8F1F7]">
                        <button
                          onClick={() => {
                            navigate(`/providers/${item.provider_id}`);
                            onClose();
                          }}
                          className="flex-1 btn-primary py-1 px-3 text-xs flex items-center justify-center gap-1"
                        >
                          <span>View Profile</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Action Buttons if confirmation needed */}
              {msg.isAction && idx === messages.length - 1 && (
                <div className="flex flex-col gap-1.5 mt-2 ml-1">
                  <span className="text-[11px] font-semibold text-[#1F6FB2] uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#3F9BE8]" /> Please Confirm
                  </span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleConfirmAction(true)}
                      className="btn-primary py-1.5 px-4 text-xs shadow-sm"
                      disabled={isProcessing || isSaving}
                    >
                      Yes, Proceed
                    </button>
                    <button 
                      onClick={() => handleConfirmAction(false)}
                      className="btn-ghost bg-white border border-[#DCEAF4] py-1.5 px-4 text-xs"
                      disabled={isProcessing || isSaving}
                    >
                      No, Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-white border border-[#DCEAF4] rounded-2xl rounded-bl-none p-3 shadow-sm flex items-center gap-2 text-[#64748B]">
                <Loader2 className="w-4 h-4 animate-spin text-[#3F9BE8]" />
                <span className="text-xs font-medium">Thinking...</span>
              </div>
            </div>
          )}
          {isSaving && (
            <div className="flex justify-start">
              <div className="bg-[#EAF5FC] border border-[#3F9BE8]/30 rounded-2xl rounded-bl-none p-3 shadow-sm flex items-center gap-2 text-[#1F6FB2]">
                <Loader2 className="w-4 h-4 animate-spin text-[#3F9BE8]" />
                <span className="text-xs font-medium">Saving your details...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 border-t border-[#DCEAF4] bg-white">
          <div className="flex items-center gap-2 relative">
            <button
              onClick={toggleListening}
              className={`p-3 rounded-full flex-shrink-0 transition-all ${
                isListening 
                  ? 'bg-[#DC3545] text-white animate-pulse shadow-md' 
                  : 'bg-[#EAF5FC] text-[#1F6FB2] hover:bg-[#3F9BE8] hover:text-white'
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
                className="w-full pl-4 pr-10 py-3 rounded-xl border border-[#DCEAF4] bg-white focus:outline-none focus:ring-2 focus:ring-[#3F9BE8]/30 text-sm"
                disabled={isListening || isProcessing}
              />
              <button 
                onClick={() => handleSubmitMessage(input)}
                disabled={!input.trim() || isListening || isProcessing}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[#3F9BE8] hover:bg-[#EAF5FC] disabled:opacity-30 transition-colors"
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
