'use client';

import React, { useState } from 'react';
import { BackButton, Field, Heading, PrimaryButton } from '../ui';
import { searchColleges } from '@/lib/college-mapping';

export default function NameInstitution({
  onBack,
  onDone,
}: {
  onBack: () => void;
  onDone: (a: { name: string; institution: string }) => void;
}) {
  const [name, setName] = useState('');
  const [institution, setInstitution] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleInstituteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInstitution(val);
    if (val.trim().length >= 2) {
      try {
        const matches = searchColleges(val).slice(0, 5);
        setSuggestions(matches);
        setShowSuggestions(matches.length > 0);
      } catch {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSelectCollege = (col: string) => {
    setInstitution(col);
    setShowSuggestions(false);
  };

  const valid = name.trim().length >= 2 && institution.trim().length >= 2;

  return (
    <>
      <BackButton onClick={onBack} />
      <Heading title="তোমার নাম ও প্রতিষ্ঠান?" />
      <form
        className="mt-4 sm:mt-8"
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) onDone({ name: name.trim(), institution: institution.trim() });
        }}
      >
        <Field
          label="তোমার নাম"
          icon="user"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="তোমার নাম লিখো"
        />

        <div className="relative">
          <Field
            label="শিক্ষা প্রতিষ্ঠান / কলেজ"
            value={institution}
            onChange={handleInstituteChange}
            placeholder="কলেজ বা প্রতিষ্ঠানের নাম লিখো"
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-[88px] z-20 max-h-48 overflow-y-auto rounded-2xl border border-white/10 bg-[#16181e] p-2 shadow-2xl backdrop-blur-xl">
              {suggestions.map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => handleSelectCollege(col)}
                  className="w-full rounded-xl px-4 py-2.5 text-left text-sm text-zinc-200 transition hover:bg-white/10 hover:text-white font-['Kalpurush',sans-serif]"
                >
                  {col}
                </button>
              ))}
            </div>
          )}
        </div>

        <PrimaryButton disabled={!valid}>এগিয়ে যাও</PrimaryButton>
      </form>
    </>
  );
}
