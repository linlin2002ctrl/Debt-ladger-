import React, { useState, useEffect } from 'react';
import { X, Send, Bot, Loader2, Settings, Key } from 'lucide-react';
import { generateFinancialAdvice } from '../services/geminiService';
import { Borrower } from '../types';
import { translations, Language } from '../utils/translations';

interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  borrowers: Borrower[];
  language: Language;
}

const AIChatModal: React.FC<AIChatModalProps> = ({ isOpen, onClose, borrowers, language }) => {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState('');
  
  const t = translations[language];

  useEffect(() => {
    // Load API key from local storage on mount
    const storedKey = localStorage.getItem('user_gemini_api_key');
    if (storedKey) {
      setApiKey(storedKey);
    }
  }, []);

  const handleSaveKey = (value: string) => {
    setApiKey(value);
    localStorage.setItem('user_gemini_api_key', value);
  };

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setResponse('');
    try {
      // Pass the user's API key (if any) to the service
      const result = await generateFinancialAdvice(borrowers, input, apiKey);
      setResponse(result);
    } catch (error) {
      setResponse("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl flex flex-col max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-indigo-600 text-white">
          <div className="flex items-center gap-2">
            <Bot size={20} />
            <h3 className="font-semibold">{t.aiAssistant}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowSettings(!showSettings)} 
              className={`p-1 rounded transition-colors ${showSettings ? 'bg-indigo-700' : 'hover:bg-indigo-700'}`}
              title="API Key Settings"
            >
              <Settings size={20} />
            </button>
            <button onClick={onClose} className="hover:bg-indigo-700 p-1 rounded">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* API Key Settings Panel */}
        {showSettings && (
          <div className="bg-indigo-50 p-4 border-b border-indigo-100 animate-in slide-in-from-top-2 duration-200">
            <label className="block text-xs font-bold text-indigo-900 mb-2 flex items-center gap-1">
              <Key size={14} /> 
              {t.customKey}
            </label>
            <div className="flex gap-2">
              <input 
                type="password" 
                value={apiKey}
                onChange={(e) => handleSaveKey(e.target.value)}
                placeholder="AIza..."
                className="flex-1 text-sm border border-indigo-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <p className="text-[10px] text-indigo-600 mt-2">
              {t.keyDisclaimer}
            </p>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
          {!response && !loading && (
            <div className="text-center text-gray-500 mt-8">
              <p className="mb-2">{t.askAnything}</p>
              <p className="text-xs text-gray-400 mb-4">{t.languageSupport}</p>
              <div className="text-sm space-y-2">
                <span className="block bg-white border px-3 py-1 rounded-full cursor-pointer hover:bg-gray-100" onClick={() => setInput(t.example1)}>"{t.example1}"</span>
                <span className="block bg-white border px-3 py-1 rounded-full cursor-pointer hover:bg-gray-100" onClick={() => setInput(t.example2)}>"{t.example2}"</span>
                <span className="block bg-white border px-3 py-1 rounded-full cursor-pointer hover:bg-gray-100" onClick={() => setInput(t.example3)}>"{t.example3}"</span>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex justify-center items-center h-32 text-indigo-600">
              <Loader2 className="animate-spin h-8 w-8" />
            </div>
          )}

          {response && (
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-gray-800">{response}</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.sendPlaceholder}
              className="flex-1 border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChatModal;