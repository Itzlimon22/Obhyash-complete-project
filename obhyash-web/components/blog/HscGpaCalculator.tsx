'use client';

import React, { useState, useMemo } from 'react';
import {
  Calculator,
  Award,
  Sparkles,
  RotateCcw,
  Copy,
  Check,
  AlertTriangle,
  Info,
  CheckCircle2,
  ChevronDown,
  BookOpen,
} from 'lucide-react';
import { toast } from 'sonner';

type GradeKey = 'A+' | 'A' | 'A-' | 'B' | 'C' | 'D' | 'F';

interface SubjectConfig {
  id: string;
  name: string;
  isFourthSubject?: boolean;
}

const GRADE_POINTS: Record<GradeKey, number> = {
  'A+': 5.0,
  A: 4.0,
  'A-': 3.5,
  B: 3.0,
  C: 2.0,
  D: 1.0,
  F: 0.0,
};

function getGradeFromMarks(marks: number): GradeKey {
  if (marks >= 80) return 'A+';
  if (marks >= 70) return 'A';
  if (marks >= 60) return 'A-';
  if (marks >= 50) return 'B';
  if (marks >= 40) return 'C';
  if (marks >= 33) return 'D';
  return 'F';
}

const GROUP_PRESETS: Record<string, { label: string; subjects: SubjectConfig[] }> = {
  science: {
    label: '🔬 বিজ্ঞান (Science)',
    subjects: [
      { id: 'bangla', name: 'বাংলা (১ম ও ২য় পত্র)' },
      { id: 'english', name: 'ইংরেজি (১ম ও ২য় পত্র)' },
      { id: 'ict', name: 'তথ্য ও যোগাযোগ প্রযুক্তি (ICT)' },
      { id: 'physics', name: 'পদার্থবিজ্ঞান' },
      { id: 'chemistry', name: 'রসায়ন' },
      { id: 'higher_math', name: 'উচ্চতর গণিত' },
      { id: 'biology', name: 'জীববিজ্ঞান (৪র্থ বিষয়)', isFourthSubject: true },
    ],
  },
  commerce: {
    label: '💼 ব্যবসায় শিক্ষা (Commerce)',
    subjects: [
      { id: 'bangla', name: 'বাংলা (১ম ও ২য় পত্র)' },
      { id: 'english', name: 'ইংরেজি (১ম ও ২য় পত্র)' },
      { id: 'ict', name: 'তথ্য ও যোগাযোগ প্রযুক্তি (ICT)' },
      { id: 'accounting', name: 'হিসাববিজ্ঞান' },
      { id: 'business_org', name: 'ব্যবসায় সংগঠন ও ব্যবস্থাপনা' },
      { id: 'finance', name: 'ফিন্যান্স, ব্যাংকিং ও বীমা' },
      { id: 'marketing', name: 'উৎপাদন ব্যবস্থাপনা (৪র্থ বিষয়)', isFourthSubject: true },
    ],
  },
  humanities: {
    label: '🎨 মানবিক (Humanities)',
    subjects: [
      { id: 'bangla', name: 'বাংলা (১ম ও ২য় পত্র)' },
      { id: 'english', name: 'ইংরেজি (১ম ও ২য় পত্র)' },
      { id: 'ict', name: 'তথ্য ও যোগাযোগ প্রযুক্তি (ICT)' },
      { id: 'civics', name: 'পৌরনীতি ও সুশাসন' },
      { id: 'economics', name: 'অর্থনীতি' },
      { id: 'logic', name: 'যুক্তিবিদ্যা / ইতিহাস' },
      { id: 'sociology', name: 'সমাজবিজ্ঞান (৪র্থ বিষয়)', isFourthSubject: true },
    ],
  },
};

export const HscGpaCalculator: React.FC = () => {
  const [selectedGroup, setSelectedGroup] = useState<string>('science');
  const [inputMode, setInputMode] = useState<'grade' | 'marks'>('grade');

  // Grades state: maps subjectId to GradeKey
  const [grades, setGrades] = useState<Record<string, GradeKey>>({
    bangla: 'A+',
    english: 'A+',
    ict: 'A+',
    physics: 'A+',
    chemistry: 'A+',
    higher_math: 'A+',
    biology: 'A+',
  });

  // Marks state: maps subjectId to number
  const [marks, setMarks] = useState<Record<string, number>>({
    bangla: 85,
    english: 82,
    ict: 88,
    physics: 84,
    chemistry: 80,
    higher_math: 85,
    biology: 85,
  });

  const [copied, setCopied] = useState<boolean>(false);

  const activeSubjects = GROUP_PRESETS[selectedGroup]?.subjects || GROUP_PRESETS.science.subjects;

  // Handle group change
  const handleGroupChange = (newGroup: string) => {
    setSelectedGroup(newGroup);
    const newSubjects = GROUP_PRESETS[newGroup]?.subjects || [];
    const newGrades: Record<string, GradeKey> = {};
    const newMarks: Record<string, number> = {};
    newSubjects.forEach((s) => {
      newGrades[s.id] = 'A+';
      newMarks[s.id] = 85;
    });
    setGrades(newGrades);
    setMarks(newMarks);
  };

  // Update grade for a subject
  const setSubjectGrade = (id: string, grade: GradeKey) => {
    setGrades((prev) => ({ ...prev, [id]: grade }));
  };

  // Update mark for a subject
  const setSubjectMark = (id: string, val: number) => {
    const clamped = Math.max(0, Math.min(100, isNaN(val) ? 0 : val));
    setMarks((prev) => ({ ...prev, [id]: clamped }));
    setGrades((prev) => ({ ...prev, [id]: getGradeFromMarks(clamped) }));
  };

  // Set all to A+
  const setAllAPlus = () => {
    const newGrades: Record<string, GradeKey> = {};
    const newMarks: Record<string, number> = {};
    activeSubjects.forEach((s) => {
      newGrades[s.id] = 'A+';
      newMarks[s.id] = 85;
    });
    setGrades(newGrades);
    setMarks(newMarks);
    toast.success('সকল বিষয়ে A+ সেট করা হয়েছে!');
  };

  // Reset to default
  const handleReset = () => {
    const newGrades: Record<string, GradeKey> = {};
    const newMarks: Record<string, number> = {};
    activeSubjects.forEach((s) => {
      newGrades[s.id] = 'A';
      newMarks[s.id] = 75;
    });
    setGrades(newGrades);
    setMarks(newMarks);
    toast.info('ক্যালকুলেটর রিসেট করা হয়েছে');
  };

  // ── GPA Calculation Engine ──
  const calculation = useMemo(() => {
    const mainSubjects = activeSubjects.filter((s) => !s.isFourthSubject);
    const fourthSubject = activeSubjects.find((s) => s.isFourthSubject);

    let hasMainFail = false;
    let failedSubjectName = '';
    let mainTotalPoints = 0;
    let isAllAPlus = true;

    // Check main subjects
    mainSubjects.forEach((s) => {
      const g = grades[s.id] || 'F';
      const gp = GRADE_POINTS[g] ?? 0;
      mainTotalPoints += gp;
      if (g === 'F' && !hasMainFail) {
        hasMainFail = true;
        failedSubjectName = s.name;
      }
      if (g !== 'A+') {
        isAllAPlus = false;
      }
    });

    // 4th Subject bonus
    let fourthGradePoint = 0;
    let fourthBonusPoint = 0;
    let fourthGrade: GradeKey = 'F';

    if (fourthSubject) {
      fourthGrade = grades[fourthSubject.id] || 'F';
      fourthGradePoint = GRADE_POINTS[fourthGrade] ?? 0;
      // Formula: Point above 2.00
      fourthBonusPoint = Math.max(0, fourthGradePoint - 2.0);
      if (fourthGrade !== 'A+') {
        isAllAPlus = false;
      }
    }

    if (hasMainFail) {
      return {
        gpa: 0.0,
        letterGrade: 'F',
        isFail: true,
        failedSubject: failedSubjectName,
        isGolden: false,
        mainTotalPoints,
        fourthGradePoint,
        fourthBonusPoint,
        effectiveTotal: 0,
      };
    }

    const effectiveTotal = mainTotalPoints + fourthBonusPoint;
    // HSC Formula: (Sum of 6 Main GPs + Bonus) / 6
    const divisor = mainSubjects.length || 6;
    const rawGpa = effectiveTotal / divisor;
    const gpa = Math.min(5.0, Number(rawGpa.toFixed(2)));

    // Derive overall letter grade
    let letterGrade: GradeKey = 'F';
    if (gpa >= 5.0) letterGrade = 'A+';
    else if (gpa >= 4.0) letterGrade = 'A';
    else if (gpa >= 3.5) letterGrade = 'A-';
    else if (gpa >= 3.0) letterGrade = 'B';
    else if (gpa >= 2.0) letterGrade = 'C';
    else if (gpa >= 1.0) letterGrade = 'D';

    const isGolden = isAllAPlus && gpa === 5.0;

    return {
      gpa,
      letterGrade,
      isFail: false,
      failedSubject: '',
      isGolden,
      mainTotalPoints,
      fourthGradePoint,
      fourthBonusPoint,
      effectiveTotal,
    };
  }, [activeSubjects, grades]);

  // Copy result summary
  const copyResult = () => {
    const summary = `🎓 আমার HSC সম্ভাব্য রেজাল্ট:
GPA: ${calculation.gpa.toFixed(2)} (${calculation.letterGrade})
${calculation.isGolden ? '🌟 গোল্ডেন A+ অর্জন!' : ''}
${calculation.isFail ? `⚠️ অনুত্তীর্ণ: ${calculation.failedSubject}-এ F গ্রেড` : ''}
মূল ৬ বিষয়ের পয়েন্ট: ${calculation.mainTotalPoints.toFixed(2)}
৪র্থ বিষয়ের বোনাস: +${calculation.fourthBonusPoint.toFixed(2)}
(হিসাবটি করা হয়েছে Obhyash HSC GPA Calculator দিয়ে: https://obhyash.com/blog/hsc-full-meaning-and-gpa-calculator)`;

    navigator.clipboard.writeText(summary);
    setCopied(true);
    toast.success('রেজাল্ট সামারি কপি হয়েছে!');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="not-prose my-10 rounded-3xl overflow-hidden border border-indigo-200/80 dark:border-indigo-900/40 bg-gradient-to-b from-white via-indigo-50/20 to-white dark:from-[#0F131E] dark:via-[#131826] dark:to-[#0F131E] shadow-xl shadow-indigo-500/5 font-['HindSiliguri',sans-serif]">
      {/* ── Top Header ── */}
      <div className="p-5 sm:p-7 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0">
              <Calculator className="w-6 h-6 text-yellow-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-yellow-400 text-slate-950 text-[10px] font-extrabold uppercase tracking-wider">
                  Live Engine
                </span>
                <span className="text-xs text-blue-100 font-medium">অফিশিয়াল বোর্ড ফর্মুলা</span>
              </div>
              <h3 className="text-lg sm:text-2xl font-bold tracking-tight text-white mt-0.5">
                এইচএসসি রিয়েল জিপিএ ক্যালকুলেটর
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={setAllAPlus}
              className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>সব A+ টেস্ট</span>
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white transition active:scale-95 cursor-pointer"
              title="রিসেট করো"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Control Bar: Group Selector & Mode Toggle ── */}
      <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Group Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {Object.entries(GROUP_PRESETS).map(([key, group]) => {
            const isActive = selectedGroup === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleGroupChange(key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {group.label}
              </button>
            );
          })}
        </div>

        {/* Input Mode Toggle */}
        <div className="flex items-center self-end sm:self-auto bg-slate-200 dark:bg-slate-800 p-0.5 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setInputMode('grade')}
            className={`px-3 py-1 rounded-lg transition cursor-pointer ${
              inputMode === 'grade'
                ? 'bg-white dark:bg-slate-950 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            লেটার গ্রেড মোড
          </button>
          <button
            type="button"
            onClick={() => setInputMode('marks')}
            className={`px-3 py-1 rounded-lg transition cursor-pointer ${
              inputMode === 'marks'
                ? 'bg-white dark:bg-slate-950 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            মার্কস ইনপুট (০-১০০)
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ── Left Column: Subject Inputs (7 cols on desktop) ── */}
        <div className="lg:col-span-7 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-1">
            <span>বিষয় ও পত্রসমূহ</span>
            <span>{inputMode === 'grade' ? 'প্রাপ্ত গ্রেড ও পয়েন্ট' : 'প্রাপ্ত নম্বর (Marks)'}</span>
          </div>

          {activeSubjects.map((sub, idx) => {
            const currentGrade = grades[sub.id] || 'A+';
            const currentMark = marks[sub.id] ?? 85;
            const currentPoint = GRADE_POINTS[currentGrade];
            const isFourth = sub.isFourthSubject;

            return (
              <div
                key={sub.id}
                className={`p-3 sm:p-3.5 rounded-2xl border transition-all ${
                  isFourth
                    ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-300/80 dark:border-amber-700/50 shadow-xs'
                    : 'bg-white dark:bg-[#161C2C] border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  {/* Subject Name & Badge */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                        {sub.name}
                      </span>
                    </div>

                    {isFourth && (
                      <span className="inline-block mt-0.5 text-[10px] text-amber-700 dark:text-amber-400 font-semibold">
                        ★ ২.০০ পয়েন্টের অতিরিক্ত অংশ মূল ফলাফলে বোনাস যোগ হবে
                      </span>
                    )}
                  </div>

                  {/* Input Controls */}
                  <div className="flex items-center gap-2 shrink-0">
                    {inputMode === 'marks' ? (
                      /* Marks Mode */
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={currentMark}
                          onChange={(e) => setSubjectMark(sub.id, parseInt(e.target.value))}
                          className="w-16 h-9 text-center font-bold text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                        />
                        <span
                          className={`w-12 h-9 rounded-xl flex items-center justify-center text-xs font-black ${
                            currentGrade === 'A+'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : currentGrade === 'F'
                              ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                              : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                          }`}
                        >
                          {currentGrade}
                        </span>
                      </div>
                    ) : (
                      /* Letter Grade Mode Dropdown */
                      <div className="flex items-center gap-1.5">
                        <select
                          value={currentGrade}
                          onChange={(e) => setSubjectGrade(sub.id, e.target.value as GradeKey)}
                          className={`h-9 px-2.5 rounded-xl text-xs font-black border cursor-pointer focus:outline-none transition ${
                            currentGrade === 'A+'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                              : currentGrade === 'F'
                              ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-300 dark:border-red-800'
                              : 'bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700'
                          }`}
                        >
                          <option value="A+">A+ (5.00)</option>
                          <option value="A">A (4.00)</option>
                          <option value="A-">A- (3.50)</option>
                          <option value="B">B (3.00)</option>
                          <option value="C">C (2.00)</option>
                          <option value="D">D (1.00)</option>
                          <option value="F">F (0.00)</option>
                        </select>
                        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 w-8 text-right tabular-nums">
                          {currentPoint.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Right Column: Real-time Live Result Card (5 cols on desktop) ── */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="sticky top-24 rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white border border-indigo-500/30 shadow-2xl relative overflow-hidden">
            {/* Ambient Background Aura */}
            <div className="absolute -top-16 -right-16 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

            {/* Header Badge */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase font-extrabold tracking-wider text-indigo-300 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-yellow-400" />
                ফলাফলের সারাংশ
              </span>
              {calculation.isGolden && (
                <span className="px-2.5 py-0.5 rounded-full bg-yellow-400/20 border border-yellow-400/40 text-yellow-300 text-[11px] font-black animate-pulse">
                  🌟 গোল্ডেন A+
                </span>
              )}
            </div>

            {/* Big GPA Metric Display */}
            <div className="text-center py-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md mb-4">
              <span className="text-xs text-indigo-200 block mb-1">সর্বমোট জিপিএ (GPA)</span>
              <div className="flex items-baseline justify-center gap-2">
                <span
                  className={`text-5xl sm:text-6xl font-black tracking-tight tabular-nums ${
                    calculation.isFail
                      ? 'text-red-400'
                      : calculation.isGolden
                      ? 'text-yellow-300 drop-shadow-[0_0_15px_rgba(253,224,71,0.5)]'
                      : 'text-white'
                  }`}
                >
                  {calculation.gpa.toFixed(2)}
                </span>
                <span className="text-base text-indigo-300 font-bold">/ ৫.০০</span>
              </div>

              {/* Status Badge */}
              <div className="mt-2">
                {calculation.isFail ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    অনুত্তীর্ণ (Fail)
                  </span>
                ) : (
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${
                      calculation.letterGrade === 'A+'
                        ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                        : 'bg-indigo-500/20 border-indigo-400/40 text-indigo-200'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    লেটার গ্রেড: {calculation.letterGrade}
                  </span>
                )}
              </div>
            </div>

            {/* Detailed Mathematical Breakdown */}
            <div className="space-y-2 text-xs text-indigo-100 border-t border-white/10 pt-3.5 mb-4">
              <div className="flex justify-between items-center py-0.5">
                <span className="text-slate-300">মূল ৬টি বিষয়ের মোট পয়েন্ট:</span>
                <span className="font-bold text-white tabular-nums">
                  {calculation.mainTotalPoints.toFixed(2)} / ৩০.০০
                </span>
              </div>

              <div className="flex justify-between items-center py-0.5 text-amber-300 font-semibold">
                <span>৪র্থ বিষয়ের বোনাস পয়েন্ট:</span>
                <span className="tabular-nums">
                  +{calculation.fourthBonusPoint.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-t border-white/10 font-bold text-white">
                <span>সর্বমোট কার্যকর পয়েন্ট:</span>
                <span className="tabular-nums">
                  {calculation.effectiveTotal.toFixed(2)}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 text-[11px] text-slate-300 leading-relaxed font-mono">
                সূত্র: ({calculation.mainTotalPoints.toFixed(2)} + {calculation.fourthBonusPoint.toFixed(2)}) ÷ ৬ = {calculation.gpa.toFixed(2)}
              </div>
            </div>

            {/* Failure Warning Alert */}
            {calculation.isFail && (
              <div className="p-3 mb-4 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>
                  <strong>সতর্কতা:</strong> {calculation.failedSubject}-এ F গ্রেড থাকায় চূড়ান্ত রেজাল্ট অনুত্তীর্ণ হয়েছে।
                </span>
              </div>
            )}

            {/* Share / Copy Result Button */}
            <button
              type="button"
              onClick={copyResult}
              className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer shadow-md ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white hover:bg-slate-100 text-slate-900'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>কপি সম্পন্ন হয়েছে!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>রেজাল্ট সামারি কপি করো</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HscGpaCalculator;
