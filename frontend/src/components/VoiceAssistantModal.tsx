import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, X, Sparkles, CheckCircle2, ArrowRight, Keyboard } from 'lucide-react';
import { Category } from '../types';

interface VoiceAssistantModalProps {
  onClose: () => void;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const [parsedCategory, setParsedCategory] = useState<Category | null>(null);
  const [parsedAnalysis, setParsedAnalysis] = useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const [manualInput, setManualInput] = useState<string>('');

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }
  }, []);

  const analyzeSpokenText = (text: string) => {
    if (!text.trim()) return;

    const lower = text.toLowerCase();
    let cat: Category = 'OTHER';

    if (/\b(coat|jacket|sweater|shirt|pant|cloth|clothes|clothing|dress|wear|shoes)\b/.test(lower)) {
      cat = 'CLOTHES';
    } else if (/\b(food|meal|rice|grain|bread|canned|fruit|vegetable|grocery|groceries|eating)\b/.test(lower)) {
      cat = 'FOOD';
    } else if (/\b(book|books|novel|story|textbook|encyclopedia|reading|literature)\b/.test(lower)) {
      cat = 'BOOKS';
    } else if (/\b(pen|pencil|notebook|paper|copy|stationery|eraser|sharpener|ruler)\b/.test(lower)) {
      cat = 'STATIONERY';
    } else if (/\b(toy|toys|doll|puzzle|game|ball|boardgame|lego|teddy)\b/.test(lower)) {
      cat = 'TOYS';
    }

    setParsedCategory(cat);
    setParsedAnalysis(
      `AI Voice Assistant parsed your spoken request! Detected category: ${cat}. Ready to pre-fill donation request.`
    );
  };

  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setListening(true);
        setTranscript('');
        setParsedCategory(null);
        setParsedAnalysis(null);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
        setManualInput(currentTranscript);
        analyzeSpokenText(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setListening(false);
      };

      recognition.onend = () => {
        setListening(false);
      };

      recognition.start();
    } catch (e) {
      console.error(e);
      setListening(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    setTranscript(manualInput.trim());
    analyzeSpokenText(manualInput.trim());
  };

  const handleApplyDonation = () => {
    if (!parsedCategory) return;
    onClose();
    navigate(`/donate/new?category=${parsedCategory}&description=${encodeURIComponent(transcript || manualInput)}`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 text-center space-y-6 relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto">
            <Mic className={`w-7 h-7 ${listening ? 'animate-pulse text-rose-400' : ''}`} />
          </div>
          <h3 className="text-xl font-extrabold text-white">Live AI Voice Assistant</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Speak into your microphone in real-time or type your request below.
          </p>
        </div>

        {/* Live Mic Control */}
        <div className="space-y-3">
          {speechSupported ? (
            <button
              type="button"
              onClick={startListening}
              disabled={listening}
              className={`w-full py-3.5 rounded-xl font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 ${
                listening
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-gradient-to-r from-indigo-600 to-rose-600 hover:scale-[1.02] text-white shadow-indigo-600/30'
              }`}
            >
              {listening ? (
                <>
                  <MicOff className="w-4 h-4 animate-spin" /> 🎙️ Listening Live... Speak Now!
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" /> 🎙️ Click to Speak into Microphone
                </>
              )}
            </button>
          ) : (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs rounded-xl">
              Microphone Web Speech API is not supported in this browser window. You can type your voice request below!
            </div>
          )}

          {/* Text Input Fallback / Edit Spoken Sentence */}
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Or type what you want to donate..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-700 transition-colors"
            >
              Parse
            </button>
          </form>
        </div>

        {/* Real Live Spoken Output */}
        {(transcript || parsedAnalysis) && (
          <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-indigo-500/20 text-left text-xs">
            {transcript && (
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Your Captured Speech:</div>
                <div className="text-white font-semibold italic bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  "{transcript}"
                </div>
              </div>
            )}

            {parsedAnalysis && (
              <div className="text-emerald-400 font-bold flex items-center gap-1.5 pt-1">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{parsedAnalysis}</span>
              </div>
            )}

            {parsedCategory && (
              <button
                type="button"
                onClick={handleApplyDonation}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-emerald-600/20 mt-2"
              >
                Apply & Create Donation ({parsedCategory}) <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
