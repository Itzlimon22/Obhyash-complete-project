'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Sparkles, Building2, BookOpen, GraduationCap, Check } from 'lucide-react';

export interface SuggestionItem {
  name: string;
  category: 'University' | 'Board' | 'Writer' | 'Custom';
  bengaliName?: string;
  aliases: string[];
}

export const CANONICAL_SUGGESTIONS: SuggestionItem[] = [
  // ── Universities & Admission Units ──
  { name: 'BUET', category: 'University', bengaliName: 'বুয়েট', aliases: ['buet', 'bangladesh university of engineering'] },
  { name: 'DU A', category: 'University', bengaliName: 'ঢাবি ক ইউনিট', aliases: ['du a', 'dhaka university a unit', 'du science', 'du'] },
  { name: 'DU B', category: 'University', bengaliName: 'ঢাবি খ ইউনিট', aliases: ['du b', 'dhaka university b unit'] },
  { name: 'DU C', category: 'University', bengaliName: 'ঢাবি গ ইউনিট', aliases: ['du c', 'dhaka university c unit'] },
  { name: 'DU D', category: 'University', bengaliName: 'ঢাবি ঘ ইউনিট', aliases: ['du d', 'dhaka university d unit'] },
  { name: 'CKRUET', category: 'University', bengaliName: 'চুয়েট-কুয়েট-রুয়েট গুচ্ছ', aliases: ['ckruet', 'cuet', 'kuet', 'ruet', 'engineering gst'] },
  { name: 'RU', category: 'University', bengaliName: 'রাবি (রাজশাহী বিশ্ববিদ্যালয়)', aliases: ['ru', 'rajshahi university'] },
  { name: 'CU', category: 'University', bengaliName: 'চবি (চট্টগ্রাম বিশ্ববিদ্যালয়)', aliases: ['cu', 'chittagong university'] },
  { name: 'JU', category: 'University', bengaliName: 'জাবি (জাহাঙ্গীরনগর বিশ্ববিদ্যালয়)', aliases: ['ju', 'jahangirnagar'] },
  { name: 'GST', category: 'University', bengaliName: 'জিএসটি সাধারণ গুচ্ছ', aliases: ['gst', 'guccho', 'general gst'] },
  { name: 'AGRI GST', category: 'University', bengaliName: 'কৃষি গুচ্ছ', aliases: ['agri gst', 'krishi guccho', 'bau', 'sau', 'bSMRAU'] },
  { name: 'DMC', category: 'University', bengaliName: 'মেডিকেল ভর্তি পরীক্ষা (MAT)', aliases: ['dmc', 'mat', 'medical', 'dhaka medical'] },
  { name: 'DAT', category: 'University', bengaliName: 'ডেন্টাল ভর্তি পরীক্ষা', aliases: ['dat', 'dental'] },
  { name: 'BUTEX', category: 'University', bengaliName: 'বুটেক্স', aliases: ['butex', 'textile'] },
  { name: 'BUP', category: 'University', bengaliName: 'বিইউপি', aliases: ['bup'] },
  { name: 'IUT', category: 'University', bengaliName: 'আইইউটি', aliases: ['iut'] },
  { name: 'SUST', category: 'University', bengaliName: 'সাস্ট', aliases: ['sust', 'shajalal'] },
  { name: 'MIST', category: 'University', bengaliName: 'এমআইএসটি', aliases: ['mist'] },

  // ── Education Boards ──
  { name: 'DHAKA BOARD', category: 'Board', bengaliName: 'ঢাকা বোর্ড', aliases: ['dhaka', 'db', 'dhaka board'] },
  { name: 'RAJSHAHI BOARD', category: 'Board', bengaliName: 'রাজশাহী বোর্ড', aliases: ['rajshahi', 'rb', 'rajshahi board'] },
  { name: 'CHITTAGONG BOARD', category: 'Board', bengaliName: 'চট্টগ্রাম বোর্ড', aliases: ['chittagong', 'ctg', 'cb', 'chittagong board'] },
  { name: 'COMILLA BOARD', category: 'Board', bengaliName: 'কুমিল্লা বোর্ড', aliases: ['comilla', 'cumilla', 'cum', 'comilla board'] },
  { name: 'JESSORE BOARD', category: 'Board', bengaliName: 'যশোর বোর্ড', aliases: ['jessore', 'jashore', 'jb', 'jessore board'] },
  { name: 'BARISAL BOARD', category: 'Board', bengaliName: 'বরিশাল বোর্ড', aliases: ['barisal', 'barishal', 'bb', 'barisal board'] },
  { name: 'SYLHET BOARD', category: 'Board', bengaliName: 'সিলেট বোর্ড', aliases: ['sylhet', 'sb', 'sylhet board'] },
  { name: 'DINAJPUR BOARD', category: 'Board', bengaliName: 'দিনাজপুর বোর্ড', aliases: ['dinajpur', 'din', 'dinaj', 'dinajpur board'] },
  { name: 'MYMENSINGH BOARD', category: 'Board', bengaliName: 'ময়মনসিংহ বোর্ড', aliases: ['mymensingh', 'mb', 'mymensingh board'] },
  { name: 'MADRASAH BOARD', category: 'Board', bengaliName: 'মাদ্রাসা বোর্ড', aliases: ['madrasah', 'madrasa board', 'alim'] },
  { name: 'TECHNICAL BOARD', category: 'Board', bengaliName: 'কারিগরি বোর্ড', aliases: ['technical', 'vocational', 'bteb'] },

  // ── Textbook Authors / Writers ──
  { name: 'মাজেদা ম্যাম', category: 'Writer', bengaliName: 'মাজেদা বেগম (জীববিজ্ঞান)', aliases: ['মাজেদা', 'মাজেদা ম্যাম', 'মাজেদা মেম', 'majeda', 'majeda mam'] },
  { name: 'গাজী আজমল', category: 'Writer', bengaliName: 'গাজী আজমল ও গাজী আসমত (জীববিজ্ঞান)', aliases: ['গাজী আজমল', 'আজমল', 'gazi ajmal', 'ajmal'] },
  { name: 'আবুল হাসান', category: 'Writer', bengaliName: 'ড. মোহাম্মদ আবুল হাসান (উদ্ভিদবিজ্ঞান)', aliases: ['আবুল হাসান', 'হাসান স্যার', 'abul hasan', 'hasan'] },
  { name: 'হাজারী নাগ', category: 'Writer', bengaliName: 'হাজারী ও নাগ (রসায়ন)', aliases: ['হাজারী', 'হাজারি', 'হাজারী নাগ', 'hazari', 'hazari nag'] },
  { name: 'ইসহাক স্যার', category: 'Writer', bengaliName: 'প্রফেসর আমির হোসেন খান ও ইসহাক (পদার্থবিজ্ঞান)', aliases: ['ইসহাক', 'ইসহাক স্যার', 'ishaq', 'ishak', 'amir ishak'] },
  { name: 'কেতাব স্যার', category: 'Writer', bengaliName: 'কেতাব উদ্দিন (উচ্চতর গণিত)', aliases: ['কেতাব', 'কেতাব স্যার', 'ketab', 'ketab uddin'] },
  { name: 'এস ইউ আহাম্মদ', category: 'Writer', bengaliName: 'এস ইউ আহাম্মদ (উচ্চতর গণিত)', aliases: ['এস ইউ আহাম্মদ', 'আহাম্মদ', 'su ahmed', 'ahammed'] },
  { name: 'অসীম সাহা', category: 'Writer', bengaliName: 'অসীম কুমার সাহা (উচ্চতর গণিত)', aliases: ['অসীম সাহা', 'অসীম কুমার সাহা', 'ashim saha'] },
  { name: 'সেলু বশির', category: 'Writer', bengaliName: 'মোঃ মসিউর রহমান ও সেলু বশির (রসায়ন)', aliases: ['সেলু বশির', 'বশির', 'selu bashir'] },
  { name: 'তপন স্যার', category: 'Writer', bengaliName: 'ড. শাহজাহান তপন (পদার্থবিজ্ঞান)', aliases: ['তপন', 'তপন স্যার', 'tapan', 'shahjahan tapan'] },
  { name: 'মুহাম্মদ জাফর ইকবাল', category: 'Writer', bengaliName: 'মুহাম্মদ জাফর ইকবাল (আইসিটি)', aliases: ['জাফর ইকবাল', 'zafar iqbal'] },
];

interface InstituteWriterAutocompleteProps {
  value: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  label?: string;
}

export function InstituteWriterAutocomplete({
  value = [],
  onChange,
  placeholder = 'Type institute, board, or writer name (e.g. BUET, মাজেদা ম্যাম)...',
  label = 'Institutes & Textbook Writers',
}: InstituteWriterAutocompleteProps) {
  const [inputQuery, setInputQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter suggestions
  const filteredSuggestions = React.useMemo(() => {
    const q = inputQuery.trim().toLowerCase();
    if (!q) {
      // Show popular picks when query is empty
      return CANONICAL_SUGGESTIONS.filter((item) => !value.includes(item.name)).slice(0, 12);
    }

    return CANONICAL_SUGGESTIONS.filter((item) => {
      if (value.includes(item.name)) return false;
      const matchName = item.name.toLowerCase().includes(q);
      const matchBengali = item.bengaliName?.toLowerCase().includes(q);
      const matchAliases = item.aliases.some((a) => a.toLowerCase().includes(q));
      return matchName || matchBengali || matchAliases;
    });
  }, [inputQuery, value]);

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addChip = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    if (!value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInputQuery('');
    setIsOpen(false);
    setHighlightedIndex(0);
    inputRef.current?.focus();
  };

  const removeChip = (indexToRemove: number) => {
    onChange(value.filter((_, idx) => idx !== indexToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredSuggestions.length > 0 && isOpen && highlightedIndex < filteredSuggestions.length) {
        addChip(filteredSuggestions[highlightedIndex].name);
      } else if (inputQuery.trim()) {
        addChip(inputQuery.trim());
      }
    } else if (e.key === 'Backspace' && !inputQuery && value.length > 0) {
      removeChip(value.length - 1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen(true);
      setHighlightedIndex((prev) => (prev + 1) % Math.max(1, filteredSuggestions.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIsOpen(true);
      setHighlightedIndex((prev) => (prev - 1 + filteredSuggestions.length) % Math.max(1, filteredSuggestions.length));
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'University':
        return <GraduationCap className="w-3.5 h-3.5 text-blue-500" />;
      case 'Board':
        return <Building2 className="w-3.5 h-3.5 text-purple-500" />;
      case 'Writer':
        return <BookOpen className="w-3.5 h-3.5 text-emerald-500" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-1.5 relative">
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            {label}
          </label>
          <span className="text-[11px] text-slate-400">
            Select suggestions or type custom
          </span>
        </div>
      )}

      {/* Main Tag Chips & Input Container */}
      <div
        onClick={() => inputRef.current?.focus()}
        className="min-h-[44px] p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 flex flex-wrap items-center gap-1.5 cursor-text transition shadow-sm"
      >
        {/* Selected Chips */}
        {value.map((item, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-100 text-cyan-900 dark:bg-cyan-950 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800 transition shadow-2xs"
          >
            <span>{item}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeChip(idx);
              }}
              className="p-0.5 hover:bg-cyan-200 dark:hover:bg-cyan-800 rounded-full transition"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={inputQuery}
          onChange={(e) => {
            setInputQuery(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : 'Add another...'}
          className="flex-1 min-w-[150px] bg-transparent border-none outline-none text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 py-1 px-1"
        />
      </div>

      {/* Auto-complete Dropdown Menu */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-150"
        >
          {filteredSuggestions.length > 0 ? (
            <div className="p-1.5 space-y-0.5">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Suggested Institutes & Writers
              </div>
              {filteredSuggestions.map((item, index) => {
                const isSelected = highlightedIndex === index;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => addChip(item.name)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left rounded-lg text-xs transition ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 font-semibold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {getCategoryIcon(item.category)}
                      <div className="truncate">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {item.name}
                        </span>
                        {item.bengaliName && (
                          <span className="ml-2 text-[11px] text-slate-500 dark:text-slate-400">
                            ({item.bengaliName})
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
                      {item.category}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : inputQuery.trim() ? (
            <div className="p-2">
              <button
                type="button"
                onClick={() => addChip(inputQuery)}
                className="w-full flex items-center gap-2 px-3 py-2 text-left rounded-lg text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/30 hover:bg-emerald-100 font-semibold transition"
              >
                <Plus className="w-4 h-4" />
                <span>
                  Add custom &quot;<strong>{inputQuery.trim()}</strong>&quot;
                </span>
              </button>
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-slate-400">
              All suggestions selected
            </div>
          )}
        </div>
      )}
    </div>
  );
}
