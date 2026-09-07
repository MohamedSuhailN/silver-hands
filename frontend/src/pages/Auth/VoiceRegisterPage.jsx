import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, CheckCircle2, Sparkles, Square, RotateCcw } from 'lucide-react';
import { aiExtractSkills } from '../../api/client';
import { useNotifications } from '../../context/NotificationContext';
import { useLanguage } from '../../context/LanguageContext';

const recognitionLanguages = { en: 'en-IN', ta: 'ta-IN', hi: 'hi-IN' };
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const mergeExtractedData = (existing, incoming) => {
  const merged = { ...(existing || {}) };
  ['name', 'age', 'location', 'email', 'username', 'experience_years'].forEach((key) => {
    if (incoming?.[key] !== undefined && incoming[key] !== null && incoming[key] !== '') {
      merged[key] = incoming[key];
    }
  });
  ['skills', 'potential_services'].forEach((key) => {
    if (Array.isArray(incoming?.[key]) && incoming[key].length > 0) merged[key] = incoming[key];
  });
  return merged;
};

const missingAccountFields = (data) => ['email', 'username'].filter((field) => !data?.[field]);

export const VoiceRegisterPage = () => {
  const [isListening, setIsListening] = useState(false);
  const [speechText, setSpeechText] = useState('');
  const [extractedData, setExtractedData] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [typedText, setTypedText] = useState('');
  const [followUpPrompt, setFollowUpPrompt] = useState('');
  const [draftEmail, setDraftEmail] = useState('');
  const [draftUsername, setDraftUsername] = useState('');
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef('');
  const timeoutRef = useRef(null);
  const shouldListenRef = useRef(false);
  const { language } = useLanguage();
  const { showToast } = useNotifications();
  const navigate = useNavigate();
  const recognitionLanguage = recognitionLanguages[language] || 'en-IN';

  useEffect(() => () => {
    shouldListenRef.current = false;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    recognitionRef.current?.stop();
  }, []);

  const clearRecognitionTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const stopListening = () => {
    shouldListenRef.current = false;
    clearRecognitionTimeout();
    setIsListening(false);
    setStatus('idle');
    recognitionRef.current?.stop();
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.info('[Voice] Speech recognition unsupported');
      setError("Voice input isn't supported in this browser. You can type instead.");
      setStatus('error');
      return;
    }

    console.info('[Voice] Speech recognition supported');
    console.info('[Voice] Starting');
    setError('');
    setSpeechText('');
    setTypedText('');
    finalTranscriptRef.current = '';
    setStatus('listening');
    setIsListening(true);
    shouldListenRef.current = true;

    const recognition = new SpeechRecognition();
    recognition.lang = recognitionLanguage;
    recognition.continuous = true;
    recognition.interimResults = true;
    console.info('[Voice] Configuration', {
      lang: recognition.lang,
      continuous: recognition.continuous,
      interimResults: recognition.interimResults,
    });
    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      for (let index = 0; index < event.results.length; index += 1) {
        const result = event.results[index][0].transcript;
        if (event.results[index].isFinal) finalTranscript += `${result} `;
        else interimTranscript += `${result} `;
      }
      finalTranscriptRef.current = finalTranscript.trim();
      const transcript = `${finalTranscript} ${interimTranscript}`.trim();
      setSpeechText(transcript);
      console.info('[Voice] Result received');
      if (finalTranscriptRef.current) {
        console.info(`[Voice] Final transcript: ${finalTranscriptRef.current}`);
      }
      clearRecognitionTimeout();
      timeoutRef.current = setTimeout(() => {
        if (shouldListenRef.current) {
          console.info('[Voice] Recognition timed out');
          shouldListenRef.current = false;
          setIsListening(false);
          setStatus('idle');
          setError('Voice input timed out. Please try again or type your introduction below.');
          recognition.stop();
        }
      }, 30000);
    };
    recognition.onstart = () => {
      console.info('[Voice] Started');
      clearRecognitionTimeout();
      timeoutRef.current = setTimeout(() => {
        if (shouldListenRef.current) {
          console.info('[Voice] Recognition timed out');
          shouldListenRef.current = false;
          setIsListening(false);
          setStatus('idle');
          setError('No speech detected. Please try again or type your introduction below.');
          recognition.stop();
        }
      }, 30000);
    };
    recognition.onerror = (event) => {
      console.info(`[Voice] Recognition error: ${event.error}`);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setError('Microphone permission was denied. Please allow microphone access or use typed registration.');
      } else if (event.error === 'audio-capture') {
        setError('No microphone was available. Check your microphone and try again or type your introduction.');
      } else if (event.error === 'no-speech') {
        setError('No speech detected. Please try again or type your introduction below.');
      } else if (event.error === 'network') {
        setError('Speech service could not connect. Check Chrome network access or type your introduction below.');
      } else if (event.error !== 'no-speech') {
        setError(`Speech recognition failed: ${event.error}. Please try again or type your introduction below.`);
      }
      shouldListenRef.current = false;
      clearRecognitionTimeout();
      setIsListening(false);
      setStatus('error');
    };
    recognition.onend = () => {
      console.info('[Voice] Recognition ended');
      clearRecognitionTimeout();
      setIsListening(false);
      if (shouldListenRef.current) {
        shouldListenRef.current = false;
        setStatus('idle');
        if (!finalTranscriptRef.current) {
          setError('No speech detected. Please try again or type your introduction below.');
        }
      }
    };
    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (startError) {
      console.info('[Voice] Recognition start failed', startError.name);
      shouldListenRef.current = false;
      setError('Could not start the microphone. Check browser permissions and try again.');
      setIsListening(false);
      setStatus('error');
    }
  };

  const handleAnalyzeWithAI = async () => {
    const transcript = finalTranscriptRef.current || speechText.trim() || typedText.trim();
    if (!transcript) {
      setError('Sorry, I could not hear that. Please try again.');
      setStatus('error');
      return;
    }
    stopListening();
    setStatus('processing');
    setError('');
    console.info('[Voice] Processing transcript');
    try {
      console.info('[Voice] AI request sent');
      const response = await aiExtractSkills(transcript);
      console.info('[Voice] AI response received');
      const mergedData = mergeExtractedData(extractedData, response.data);
      const missingFields = missingAccountFields(mergedData);
      setExtractedData(mergedData);
      setDraftEmail(mergedData.email || '');
      setDraftUsername(mergedData.username || '');
      if (missingFields.length > 0) {
        setFollowUpPrompt(
          missingFields.includes('email')
            ? 'I have your other details, but I still need your email address. Please tell me your email.'
            : 'What username would you like to use?'
        );
        setStatus('needs-fields');
      } else {
        setFollowUpPrompt('');
        setStatus('confirmation');
      }
      showToast('Your spoken information is ready to review.', 'success');
    } catch (analysisError) {
      console.error('[VoiceRegister] AI extraction failed:', analysisError.response?.data || analysisError);
      setError('We could not analyze that transcript. Please try again.');
      setStatus('error');
    }
  };

  const handleSaveMissingFields = () => {
    const email = draftEmail.trim();
    const username = draftUsername.trim();
    if (!emailPattern.test(email)) {
      setError('Please enter a valid email address before continuing.');
      return;
    }
    if (!/^[A-Za-z0-9][A-Za-z0-9_.-]{2,149}$/.test(username)) {
      setError('Please enter a valid username with at least 3 letters or numbers.');
      return;
    }
    setExtractedData((current) => ({ ...current, email, username }));
    setFollowUpPrompt('');
    setError('');
    setStatus('confirmation');
  };

  const handleConfirm = () => {
    navigate('/register', { state: { voiceData: extractedData, role: 'PROVIDER', language } });
  };

  const handleRetry = () => {
    setSpeechText('');
    setTypedText('');
    setExtractedData(null);
    setFollowUpPrompt('');
    setDraftEmail('');
    setDraftUsername('');
    setError('');
    setStatus('idle');
  };

  return (
    <div className="max-w-xl mx-auto my-12 p-8 card-surface shadow-warm-xl border border-warmgray-200 text-center">
      <span className="badge-tag bg-saffron text-white font-bold mb-2">Accessible Onboarding for Homemakers & Elders</span>
      <h2 className="font-heading text-3xl font-bold text-warmgray-900">Voice Guided Registration</h2>
      <p className="text-xs text-warmgray-600 mt-1 max-w-md mx-auto">
        Speak naturally in Tamil, Hindi, or English. We will extract only the information you explicitly share.
      </p>

      <div className="my-8">
        <button
          onClick={isListening ? stopListening : startListening}
          aria-label={isListening ? 'Stop listening' : 'Start voice registration'}
          className={`w-28 h-28 rounded-full flex items-center justify-center mx-auto transition-all shadow-warm-lg ${isListening ? 'bg-red-500 text-white animate-pulse scale-110' : 'bg-gradient-to-tr from-saffron to-saffron-light text-white hover:scale-105'}`}
        >
          {isListening ? <Square className="w-10 h-10" /> : <Mic className="w-12 h-12" />}
        </button>
        <span className="text-sm font-bold text-warmgray-800 mt-4 block">
          {isListening
            ? 'Listening... Speak naturally'
            : status === 'processing'
              ? 'Understanding your information...'
              : speechText || typedText
                ? 'Got it. Understanding your information...'
                : 'Tap the microphone and tell us about yourself'}
        </span>
        <span className="text-xs text-warmgray-500 mt-1 block">Language: {recognitionLanguage}</span>
      </div>

      {speechText && (
        <div className="p-4 bg-cream-100 rounded-2xl text-sm font-medium text-warmgray-800 border border-warmgray-200 text-left mb-6">
          <span className="text-xs font-bold text-saffron block mb-1">Spoken Transcription:</span>
          &quot;{speechText}&quot;
        </div>
      )}

      {error && <p className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700" role="alert">{error}</p>}

      {status === 'error' && !speechText && (
        <div className="mb-4 text-left">
          <label htmlFor="typed-voice-registration" className="block text-xs font-bold text-warmgray-700 mb-1.5">
            Or type your introduction
          </label>
          <textarea
            id="typed-voice-registration"
            value={typedText}
            onChange={(event) => setTypedText(event.target.value)}
            placeholder="Example: I have 20 years of experience in tailoring and traditional cooking."
            rows={4}
            className="w-full rounded-xl border border-warmgray-300 bg-cream-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron"
          />
        </div>
      )}

      {(speechText || typedText) && !extractedData && status !== 'processing' && (
        <button onClick={handleAnalyzeWithAI} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4" /> Understanding your information
        </button>
      )}

      {extractedData && (
        <div className="p-5 bg-sage-50 border border-sage-200 rounded-2xl text-left space-y-3 mb-6">
          <div className="flex items-center gap-2 text-sage-dark font-bold text-sm">
            <CheckCircle2 className="w-4 h-4 text-sage" />
            <span>Here&apos;s what I understood</span>
          </div>
          <div className="text-xs space-y-1.5 text-warmgray-700">
            <p><strong>Name:</strong> {extractedData.name || 'Not provided'}</p>
            <p><strong>Age:</strong> {extractedData.age || 'Not provided'}</p>
            <p><strong>Location:</strong> {extractedData.location || 'Not provided'}</p>
            <p><strong>Skills:</strong> {(extractedData.skills || []).join(', ') || 'Not provided'}</p>
            <p><strong>Experience:</strong> {extractedData.experience_years || 'Not provided'} {extractedData.experience_years ? 'years' : ''}</p>
            {extractedData.email && <p><strong>Email:</strong> {extractedData.email}</p>}
            {extractedData.username && <p><strong>Username:</strong> {extractedData.username}</p>}
          </div>
          {status === 'needs-fields' ? (
            <div className="space-y-3 pt-2">
              <p className="text-xs font-bold text-saffron-dark">{followUpPrompt}</p>
              {!extractedData.email && (
                <input
                  type="email"
                  value={draftEmail}
                  onChange={(event) => setDraftEmail(event.target.value)}
                  placeholder="Email address"
                  className="w-full rounded-xl border border-warmgray-300 bg-white px-3 py-2 text-sm"
                />
              )}
              {!extractedData.username && (
                <input
                  type="text"
                  value={draftUsername}
                  onChange={(event) => setDraftUsername(event.target.value)}
                  placeholder="Username"
                  className="w-full rounded-xl border border-warmgray-300 bg-white px-3 py-2 text-sm"
                />
              )}
              <button onClick={handleSaveMissingFields} className="w-full btn-secondary text-xs !py-2.5 font-bold">
                Continue with these details
              </button>
            </div>
          ) : (
            <button onClick={handleConfirm} className="w-full btn-secondary text-xs !py-2.5 font-bold mt-2">
              Yes, Continue to Registration
            </button>
          )}
          <button onClick={handleRetry} className="w-full text-xs font-bold text-[#1F6FB2] py-2 flex items-center justify-center gap-2">
            <RotateCcw className="w-3.5 h-3.5" /> Edit / Try Again
          </button>
        </div>
      )}
    </div>
  );
};
