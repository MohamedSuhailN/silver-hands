import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, X, Sparkles, Volume2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const VoiceListeningModal = ({ isOpen, onClose, onVoiceCaptured, title = "Listening to Your Voice..." }) => {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(20);
  
  const { language } = useLanguage();
  const recognitionRef = useRef(null);
  const timeoutRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const isListeningRef = useRef(false);
  const stopFlagRef = useRef(false);

  // Map language codes to speech recognition languages
  const getRecognitionLanguage = (lang) => {
    const langMap = {
      'en': 'en-IN',
      'ta': 'ta-IN',
      'hi': 'hi-IN'
    };
    return langMap[lang] || 'en-IN';
  };

  const resetSilenceTimer = () => {
    setSecondsRemaining(20);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    // 20-second silence timer
    timeoutRef.current = setTimeout(() => {
      stopListening();
    }, 20000);

    countdownIntervalRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech Recognition not supported in this browser. Please type instead.");
      return;
    }

    // Create only once
    if (!recognitionRef.current) {
      recognitionRef.current = new SpeechRecognition();
      const recognitionLang = getRecognitionLanguage(language);
      recognitionRef.current.lang = recognitionLang;
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onstart = () => {
        stopFlagRef.current = false;
        setIsListening(true);
        resetSilenceTimer();
      };

      recognitionRef.current.onresult = (event) => {
        let text = "";
        for (let i = 0; i < event.results.length; i++) {
          text += event.results[i][0].transcript + " ";
        }
        setTranscript(text.trim());
        resetSilenceTimer();
      };

      recognitionRef.current.onerror = (e) => {
        console.log('Speech recognition error:', e.error);
        if (e.error === 'no-speech') {
          // User didn't speak, restart
          if (recognitionRef.current && !stopFlagRef.current) {
            recognitionRef.current.start();
          }
        } else if (e.error === 'network') {
          alert('Network error - please check your connection');
          stopListening();
        } else if (e.error === 'not-allowed') {
          alert('Microphone permission denied. Please enable it in browser settings.');
          stopListening();
        }
      };

      recognitionRef.current.onend = () => {
        // Only restart if modal is still open AND we haven't explicitly stopped
        if (recognitionRef.current && isOpen && !stopFlagRef.current) {
          try {
            recognitionRef.current.start();
          } catch (e) {
            console.log('Failed to restart recognition:', e);
          }
        }
      };
    } else {
      // If already created, just update language if it changed
      const recognitionLang = getRecognitionLanguage(language);
      recognitionRef.current.lang = recognitionLang;
    }

    try {
      recognitionRef.current.start();
    } catch (e) {
      console.log('Already started or error starting recognition');
    }
  };

  const stopListening = () => {
    stopFlagRef.current = true;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    setIsListening(false);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.log('Error stopping recognition:', e);
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      setTranscript('');
      setSecondsRemaining(20);
      startListening();
    } else {
      stopListening();
    }

    return () => {
      stopListening();
    };
  }, [isOpen, language]);

  if (!isOpen) return null;

  const handleApply = () => {
    stopListening();
    onVoiceCaptured(transcript);
    onClose();
  };

  const handleCancel = () => {
    stopListening();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-warm-xl p-6 sm:p-8 border border-warmgray-200 text-center space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center pb-2 border-b border-warmgray-100">
          <span className="badge-tag bg-saffron text-white font-bold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Voice Input Active
          </span>
          <button onClick={handleCancel} className="p-1 rounded-xl text-warmgray-400 hover:bg-cream-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <h3 className="font-heading text-xl font-bold text-warmgray-900">{title}</h3>

        {/* Pulsating Visualizer */}
        <div className="flex flex-col items-center justify-center py-4 space-y-3">
          <div className="relative flex items-center justify-center">
            {isListening && (
              <div className="absolute w-28 h-28 bg-red-500/20 rounded-full animate-ping" />
            )}
            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white shadow-warm-lg transition-transform ${
              isListening ? 'bg-red-500 scale-110' : 'bg-warmgray-400'
            }`}>
              <Mic className="w-10 h-10" />
            </div>
          </div>
          
          <div className="text-xs font-semibold text-warmgray-500 flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-red-500 animate-pulse" />
            <span>{isListening ? `Speaking... (Auto-stops if silent for ${secondsRemaining}s)` : 'Recording paused'}</span>
          </div>
        </div>

        {/* Live Transcript Output */}
        <div className="p-4 bg-cream-50 rounded-2xl border border-warmgray-200 text-left min-h-[100px] max-h-40 overflow-y-auto">
          {transcript ? (
            <p className="text-sm text-warmgray-800 leading-relaxed font-medium">
              "{transcript}"
            </p>
          ) : (
            <p className="text-xs text-warmgray-400 italic text-center pt-6">
              Start speaking... your words will appear here in real-time.
            </p>
          )}
        </div>

        {/* Action Controls */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={handleCancel}
            className="btn-ghost text-xs font-bold py-3"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="btn-primary text-xs font-bold py-3 flex items-center justify-center gap-2 shadow-warm"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Click to Stop & Apply</span>
          </button>
        </div>

      </div>
    </div>
  );
};
