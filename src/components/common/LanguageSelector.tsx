import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface Language {
  code: string;
  label: string;
  flag: string;
  native: string;
}

const LANGUAGES: Language[] = [
  { code: 'EN', label: 'English', flag: '🇬🇧', native: 'English' },
  { code: 'DE', label: 'German', flag: '🇩🇪', native: 'Deutsch' },
  { code: 'FR', label: 'French', flag: '🇫🇷', native: 'Français' },
  { code: 'ES', label: 'Spanish', flag: '🇪🇸', native: 'Español' },
  { code: 'HI', label: 'Hindi', flag: '🇮🇳', native: 'हिन्दी' },
];

export interface LanguageSelectorProps {
  theme?: 'light' | 'dark';
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  theme = 'light',
  className = '',
}) => {
  const [selectedLang, setSelectedLang] = useState<Language>(LANGUAGES[0]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isDark = theme === 'dark';

  return (
    <div className={`relative inline-block text-left select-none ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
          isDark
            ? 'bg-white/15 hover:bg-white/25 text-white border border-white/25 shadow-sm'
            : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-sm'
        }`}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <span className="text-sm leading-none">{selectedLang.flag}</span>
        <span className="font-semibold">{selectedLang.code}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-44 rounded-2xl bg-white shadow-xl border border-slate-100 py-1.5 z-[100] animate-in fade-in zoom-in-95 duration-100 text-slate-800">
          <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Select Language
          </div>
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => {
                setSelectedLang(lang);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-slate-50 transition-colors ${
                selectedLang.code === lang.code ? 'bg-teal-50/60 font-semibold text-teal-800' : 'text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">{lang.flag}</span>
                <span>{lang.native}</span>
              </div>
              {selectedLang.code === lang.code && <Check className="w-3.5 h-3.5 text-teal-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
