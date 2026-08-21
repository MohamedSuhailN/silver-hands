import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, CheckCircle2, Sparkles } from 'lucide-react';
import { aiExtractSkills } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useLanguage } from '../../context/LanguageContext';

export const VoiceRegisterPage = () => {
  const [isListening, setIsListening] = useState(false);
  const [speechText, setSpeechText] = useState('');
  const [extractedData, setExtractedData] = useState(null);
  const [processing, setProcessing] = useState(false);
  const { register } = useAuth();
  const { showToast } = useNotifications();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleStartVoice = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = true;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e) => {
      const current = e.resultIndex;
      setSpeechText(e.results[current][0].transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const handleAnalyzeWithAI = async () => {
    if (!speechText.trim()) return;
    setProcessing(true);
    try {
      const res = await aiExtractSkills(speechText);
      setExtractedData(res.data);
      showToast('AI extracted your skills and profile facts!', 'success');
    } catch {
      showToast('AI processing error', 'error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto my-12 p-8 card-surface shadow-warm-xl border border-warmgray-200 text-center">
      <span className="badge-tag bg-saffron text-white font-bold mb-2">{t('ui.Accessible Onboarding for Homemakers & Elders')}</span>
      <h2 className="font-heading text-3xl font-bold text-warmgray-900">{t('ui.Voice Guided Registration')}</h2>
      <p className="text-xs text-warmgray-600 mt-1 max-w-md mx-auto">
        {t('ui.Speak naturally in Tamil, Hindi, or English. Our AI will automatically extract your experience, skills, and create your verified Skill Passport.')}
      </p>

      <div className="my-8">
        <button
          onClick={handleStartVoice}
          className={`w-28 h-28 rounded-full flex items-center justify-center mx-auto transition-all shadow-warm-lg ${
            isListening
              ? 'bg-red-500 text-white animate-pulse scale-110'
              : 'bg-gradient-to-tr from-saffron to-saffron-light text-white hover:scale-105'
          }`}
        >
          <Mic className="w-12 h-12" />
        </button>
        <span className="text-sm font-bold text-warmgray-800 mt-4 block">
          {isListening ? t('ui.Listening to your voice...') : t('ui.Tap the microphone & tell us about yourself')}
        </span>
        <span className="text-xs text-warmgray-500 mt-1 block">
          {t('ui.Example: "My name is Radhamani. I live in Mylapore and I have 20 years of experience in saree blouse stitching and tailoring."')}
        </span>
      </div>

      {speechText && (
        <div className="p-4 bg-cream-100 rounded-2xl text-sm font-medium text-warmgray-800 border border-warmgray-200 text-left mb-6">
          <span className="text-xs font-bold text-saffron block mb-1">{t('ui.Spoken Transcription:')}</span>
          "{speechText}"
        </div>
      )}

      {speechText && !extractedData && (
        <button
          onClick={handleAnalyzeWithAI}
          disabled={processing}
          className="btn-primary w-full py-3 flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>{processing ? t('ui.SilverHands AI Extracting Skills...') : t('ui.Process with SilverHands AI')}</span>
        </button>
      )}

      {extractedData && (
        <div className="p-5 bg-sage-50 border border-sage-200 rounded-2xl text-left space-y-3 mb-6">
          <div className="flex items-center gap-2 text-sage-dark font-bold text-sm">
            <CheckCircle2 className="w-4 h-4 text-sage" />
            <span>{t('ui.AI Extracted Profile Summary')}</span>
          </div>

          <div className="text-xs space-y-1.5 text-warmgray-700">
            <p><span className="font-bold">{t('ui.Extracted Skills:')}</span> {(extractedData.skills || []).join(', ') || t('ui.Traditional Craft')}</p>
            <p><span className="font-bold">{t('ui.Experience Detected:')}</span> {extractedData.experience_years || 15} {t('ui.Years')}</p>
            <p><span className="font-bold">{t('ui.Suggested Bio:')}</span> {extractedData.summary || t('ui.Passionate elder artisan')}</p>
          </div>

          <button
            onClick={() => navigate('/register')}
            className="w-full btn-secondary text-xs !py-2.5 font-bold mt-2"
          >
            {t('ui.Review & Create Account')}
          </button>
        </div>
      )}
    </div>
  );
};
