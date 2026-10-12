import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  Languages,
  Send
} from 'lucide-react';
import { aiApi } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

export default function VoiceAssistant() {
  const { lang, currentLanguageObj } = useLanguage();
  const [language, setLanguage] = useState(currentLanguageObj?.name || 'English');
  const [isListening, setIsListening] = useState(false);
  const [queryText, setQueryText] = useState('');

  const greetingMap = {
    ta: 'வணக்கம்! நான் உங்கள் AI சுற்றுலா வழிகாட்டி. உங்கள் பயணம், அடுத்த நிகழ்வுகள் அல்லது வானிலை பற்றி எது வேண்டுமானாலும் கேளுங்கள்!',
    hi: 'नमस्ते! मैं आपका एआई टूर वॉइस गाइड हूँ। अपनी यात्रा, समूह, अगली गतिविधियों या मौसम के बारे में कुछ भी पूछें!',
    kn: 'ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ AI ಪ್ರವಾಸ ಮಾರ್ಗದರ್ಶಿ. ನಿಮ್ಮ ಪ್ರವಾಸ, ಗುಂಪು ಅಥವಾ ಹವಾಮಾನದ ಬಗ್ಗೆ ಏನನ್ನಾದರೂ ಕೇಳಿ!',
    te: 'నమస్కారం! నేను మీ AI టూర్ వాయిస్ గైడ్. మీ పర్యటన, సమూహం లేదా వాతావరణం గురించి ఏదైనా అడగండి!',
    ml: 'നമസ്കാരം! ഞാൻ നിങ്ങളുടെ AI ടൂർ വോയ്സ് ഗൈഡ്. നിങ്ങളുടെ യാത്രയെക്കുറിച്ചോ അടുത്ത പ്രവർത്തനങ്ങളെക്കുറിച്ചോ ചോദിക്കൂ!',
    en: 'Hello! I am your AI Tour Voice Guide. Ask me anything about your tour, your group, next activities, or the weather in your preferred language!'
  };

  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: greetingMap[lang] || greetingMap.en
    }
  ]);

  useEffect(() => {
    if (currentLanguageObj?.name) {
      setLanguage(currentLanguageObj.name);
      setMessages([
        {
          sender: 'assistant',
          text: greetingMap[lang] || greetingMap.en
        }
      ]);
    }
  }, [lang, currentLanguageObj]);
  const [loading, setLoading] = useState(false);
  const recognitionRef = useRef(null);

  const sampleQuestions = [
    'Where is my group?',
    'What is my next activity?',
    'Is it going to rain?',
    'Where should I go now?',
    'What is the current itinerary?'
  ];

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      const langMap = {
        English: 'en-IN',
        Tamil: 'ta-IN',
        Hindi: 'hi-IN',
        Malayalam: 'ml-IN',
        Telugu: 'te-IN',
        Kannada: 'kn-IN'
      };
      recognition.lang = langMap[language] || 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setQueryText(transcript);
        handleSendQuery(transcript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [language]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not supported in this browser. Please type your query below.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.log('Recognition restart:', e);
      }
    }
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSendQuery = async (textToSend) => {
    const query = textToSend || queryText;
    if (!query.trim()) return;

    const userMsg = { sender: 'user', text: query };
    setMessages((prev) => [...prev, userMsg]);
    setQueryText('');
    setLoading(true);

    try {
      const res = await aiApi.voiceQuery({
        tourist_id: 'trt_1',
        query_text: query,
        language
      });

      if (res.data?.response) {
        const botMsg = { sender: 'assistant', text: res.data.response };
        setMessages((prev) => [...prev, botMsg]);
        speakText(res.data.response);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: 'assistant', text: 'I am having trouble answering right now. Please try again.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-md mx-auto text-slate-800">
      {/* Top Language Selector */}
      <div className="glass-panel p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between shadow-xs bg-white">
        <div className="flex items-center space-x-2">
          <Languages className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-bold text-slate-800">Select Language</span>
        </div>

        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-blue-700 font-bold focus:outline-none focus:border-blue-500"
        >
          <option value="English">English</option>
          <option value="Tamil">தமிழ் (Tamil)</option>
          <option value="Hindi">हिन्दी (Hindi)</option>
          <option value="Malayalam">മലയാളം (Malayalam)</option>
          <option value="Telugu">తెలుగు (Telugu)</option>
          <option value="Kannada">ಕನ್ನಡ (Kannada)</option>
        </select>
      </div>

      {/* Interactive Microphone Button Card */}
      <div className="glass-card p-6 rounded-3xl border border-indigo-200 flex flex-col items-center justify-center space-y-4 text-center relative overflow-hidden bg-gradient-to-b from-indigo-50/50 to-white shadow-xs">
        <p className="text-xs text-slate-500 font-medium">
          {isListening ? 'Listening to your voice... Speak now' : 'Tap microphone and ask your question'}
        </p>

        {/* Big Animated Mic Button */}
        <button
          onClick={toggleListening}
          className={`w-24 h-24 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 ${
            isListening
              ? 'bg-rose-600 text-white animate-sos-pulse scale-110 shadow-rose-500/50'
              : 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white hover:scale-105 shadow-blue-500/30'
          }`}
        >
          {isListening ? <MicOff className="w-10 h-10" /> : <Mic className="w-10 h-10 animate-pulse" />}
        </button>

        <span className="text-[11px] font-bold text-indigo-700">
          {isListening ? 'Recording Audio...' : `Ready in ${language}`}
        </span>
      </div>

      {/* Suggested Quick Question Pills */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Quick Voice Prompts</span>
        <div className="flex flex-wrap gap-1.5">
          {sampleQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendQuery(q)}
              className="px-2.5 py-1 rounded-full bg-white hover:bg-slate-100 border border-slate-200 text-[11px] text-slate-700 font-medium transition-colors shadow-xs"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Chat / Speech History */}
      <div className="glass-card rounded-2xl p-4 border border-slate-200 space-y-3 max-h-64 overflow-y-auto bg-white shadow-xs">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex items-start space-x-2.5 ${
              m.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                m.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-indigo-600 text-white'
              }`}
            >
              {m.sender === 'user' ? 'U' : <Sparkles className="w-3.5 h-3.5" />}
            </div>

            <div
              className={`p-3 rounded-2xl text-xs max-w-[80%] leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-none shadow-xs'
                  : 'bg-slate-50 text-slate-800 border border-slate-200 rounded-tl-none font-medium'
              }`}
            >
              <p>{m.text}</p>
              {m.sender === 'assistant' && (
                <button
                  onClick={() => speakText(m.text)}
                  className="mt-1 text-[10px] text-indigo-700 hover:text-indigo-800 font-bold flex items-center space-x-1"
                >
                  <Volume2 className="w-3 h-3" />
                  <span>Replay Voice</span>
                </button>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center space-x-2 text-xs text-indigo-700 font-semibold animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Guide is speaking...</span>
          </div>
        )}
      </div>

      {/* Fallback Text Input */}
      <div className="flex items-center space-x-2">
        <input
          type="text"
          placeholder={`Type question in ${language}...`}
          value={queryText}
          onChange={(e) => setQueryText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendQuery()}
          className="flex-1 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500 shadow-xs font-medium"
        />
        <button
          onClick={() => handleSendQuery()}
          className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-500/20"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
