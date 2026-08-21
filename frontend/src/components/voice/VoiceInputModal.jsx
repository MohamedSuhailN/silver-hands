import React, { useState } from 'react';
import { Mic, MicOff, Sparkles, X, Volume2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

export const VoiceInputModal = ({ isOpen, onClose }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const { language } = useLanguage();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleStartListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setTranscript('Speech recognition is not supported in this browser. Please type your search.');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = language === 'ta' ? 'ta-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';
    recognition.interimResults = true;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e) => {
      const current = e.resultIndex;
      const text = e.results[current][0].transcript;
      setTranscript(text);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  const handleSearch = () => {
    if (transcript.trim()) {
      onClose();
      navigate(`/ai-match?q=${encodeURIComponent(transcript)}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-warm-xl p-6 text-center border border-warmgray-200">
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-saffron">Voice Assistant for Homemakers & Elders</span>
          <button onClick={onClose} className="p-1 rounded-xl text-warmgray-400 hover:bg-cream-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="my-6">
          <button
            onClick={handleStartListening}
            className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto transition-all shadow-warm-lg ${
              isListening
                ? 'bg-red-500 text-white animate-pulse scale-110'
                : 'bg-gradient-to-tr from-saffron to-saffron-light text-white hover:scale-105'
            }`}
          >
            {isListening ? <Mic className="w-10 h-10 animate-bounce" /> : <Mic className="w-10 h-10" />}
          </button>
          <p className="text-sm font-bold text-warmgray-800 mt-4">
            {isListening ? 'Listening in your preferred language...' : 'Tap the microphone & speak'}
          </p>
          <p className="text-xs text-warmgray-500 mt-1">
            "I need someone nearby to teach traditional Tamil cooking"
          </p>
        </div>

        {transcript && (
          <div className="p-4 bg-cream-100 rounded-2xl text-sm font-semibold text-warmgray-900 border border-warmgray-200 mb-5">
            "{transcript}"
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={onClose} className="btn-ghost flex-1 text-sm">Cancel</button>
          <button
            onClick={handleSearch}
            disabled={!transcript}
            className="btn-primary flex-1 text-sm flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" />
            Search with AI
          </button>
        </div>
      </div>
    </div>
  );
};
