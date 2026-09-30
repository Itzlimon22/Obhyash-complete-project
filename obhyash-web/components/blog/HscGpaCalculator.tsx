'use client';

import React, { useState, useMemo } from 'react';
import {
  RotateCcw,
  Copy,
  Check,
  AlertTriangle,
  CheckCircle2,
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
    label: 'বিজ্ঞান',
    subjects: [
      { id: 'bangla', name: 'বাংলা (১ম ও ২য় পত্র)' },
      { id: 'english', name: 'ইংরেজি (১ম ও ২য় পত্র)' },
      { id: 'ict', name: 'তথ্য ও যোগাযোগ প্রযুক্তি' },
      { id: 'physics', name: 'পদার্থবিজ্ঞান' },
      { id: 'chemistry', name: 'রসায়ন' },
      { id: 'higher_math', name: 'উচ্চতর গণিত' },
      { id: 'biology', name: 'জীববিজ্ঞান', isFourthSubject: true },
    ],
  },
  commerce: {
    label: 'ব্যবসায় শিক্ষা',
    subjects: [
      { id: 'bangla', name: 'বাংলা (১ম ও ২য় পত্র)' },
      { id: 'english', name: 'ইংরেজি (১ম ও ২য় পত্র)' },
      { id: 'ict', name: 'তথ্য ও যোগাযোগ প্রযুক্তি' },
      { id: 'accounting', name: 'হিসাববিজ্ঞান' },
      { id: 'business_org', name: 'ব্যবসায় সংগঠন' },
      { id: 'finance', name: 'ফিন্যান্স ও ব্যাংকিং' },
      { id: 'marketing', name: 'উৎপাদন ব্যবস্থাপনা', isFourthSubject: true },
    ],
  },
  humanities: {
    label: 'মানবিক',
    subjects: [
      { id: 'bangla', name: 'বাংলা (১ম ও ২য় পত্র)' },
      { id: 'english', name: 'ইংরেজি (১ম ও ২য় পত্র)' },
      { id: 'ict', name: 'তথ্য ও যোগাযোগ প্রযুক্তি' },
      { id: 'civics', name: 'পৌরনীতি ও সুশাসন' },
      { id: 'economics', name: 'অর্থনীতি' },
      { id: 'logic', name: 'যুক্তিবিদ্যা / ইতিহাস' },
      { id: 'sociology', name: 'সমাজবিজ্ঞান', isFourthSubject: true },
    ],
  },
};

export const HscGpaCalculator: React.FC = () => {
  const [selectedGroup, setSelectedGroup] = useState<string>('science');
  const [inputMode, setInputMode] = useState<'grade' | 'marks'>('grade');

  const [grades, setGrades] = useState<Record<string, GradeKey>>({
    bangla: 'A+',
    english: 'A+',
    ict: 'A+',
    physics: 'A+',
    chemistry: 'A+',
    higher_math: 'A+',
    biology: 'A+',
  });

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

  const setSubjectGrade = (id: string, grade: GradeKey) => {
    setGrades((prev) => ({ ...prev, [id]: grade }));
  };

  const setSubjectMark = (id: string, val: number) => {
    const clamped = Math.max(0, Math.min(100, isNaN(val) ? 0 : val));
    setMarks((prev) => ({ ...prev, [id]: clamped }));
    setGrades((prev) => ({ ...prev, [id]: getGradeFromMarks(clamped) }));
  };

  const handleReset = () => {
    const newGrades: Record<string, GradeKey> = {};
    const newMarks: Record<string, number> = {};
    activeSubjects.forEach((s) => {
      newGrades[s.id] = 'A+';
      newMarks[s.id] = 85;
    });
    setGrades(newGrades);
    setMarks(newMarks);
    toast.info('ক্যালকুলেটর রিসেট করা হয়েছে');
  };

  // ── Calculation ──
  const calculation = useMemo(() => {
    const mainSubjects = activeSubjects.filter((s) => !s.isFourthSubject);
    const fourthSubject = activeSubjects.find((s) => s.isFourthSubject);

    let hasMainFail = false;
    let failedSubjectName = '';
    let mainTotalPoints = 0;
    let isAllAPlus = true;

    mainSubjects.forEach((s) => {
      const g = grades[s.id] || 'F';
      const gp = GRADE_POINTS[g] ?? 0;
      mainTotalPoints += gp;
      if (g === 'F' && !hasMainFail) {
        hasMainFail = true;
        failedSubjectName = s.name;
      }
      if (g !== 'A+') isAllAPlus = false;
    });

    let fourthGradePoint = 0;
    let fourthBonusPoint = 0;

    if (fourthSubject) {
      const fourthGrade = grades[fourthSubject.id] || 'F';
      fourthGradePoint = GRADE_POINTS[fourthGrade] ?? 0;
      fourthBonusPoint = Math.max(0, fourthGradePoint - 2.0);
      if (fourthGrade !== 'A+') isAllAPlus = false;
    }

    if (hasMainFail) {
      return {
        gpa: 0.0,
        letterGrade: 'F',
        isFail: true,
        failedSubject: failedSubjectName,
        isGolden: false,
        mainTotalPoints,
        fourthBonusPoint,
        effectiveTotal: 0,
      };
    }

    const effectiveTotal = mainTotalPoints + fourthBonusPoint;
    const divisor = mainSubjects.length || 6;
    const rawGpa = effectiveTotal / divisor;
    const gpa = Math.min(5.0, Number(rawGpa.toFixed(2)));

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
      fourthBonusPoint,
      effectiveTotal,
    };
  }, [activeSubjects, grades]);

  const copyResult = () => {
    const summary = `🎓 HSC সম্ভাব্য রেজাল্ট: GPA ${calculation.gpa.toFixed(2)} (${calculation.letterGrade})${
      calculation.isGolden ? ' [গোল্ডেন A+]' : ''
    } | মূল পয়েন্ট: ${calculation.mainTotalPoints.toFixed(2)}, ৪র্থ বিষয় বোনাস: +${calculation.fourthBonusPoint.toFixed(
      2
    )} (Obhyash GPA Calculator)`;

    navigator.clipboard.writeText(summary);
    setCopied(true);
    toast.success('রেজাল্ট কপি হয়েছে!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="not-prose my-8 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#121214] p-4 sm:p-5 shadow-xs font-hind">
      {/* ── Compact Header ── */}
      <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100 dark:border-neutral-800">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">
            এইচএসসি জিপিএ ক্যালকুলেটর
          </h3>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
            ৪র্থ বিষয়ের বোনাস পয়েন্টসহ স্বয়ংক্রিয় ফলাফল
          </p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-neutral-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 transition active:scale-95 cursor-pointer"
          title="রিসেট"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* ── Group & Mode Controls ── */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 mb-4">
        {/* Group Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-neutral-900 p-1 rounded-xl">
          {Object.entries(GROUP_PRESETS).map(([key, group]) => {
            const isActive = selectedGroup === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleGroupChange(key)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                  isActive
                    ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {group.label}
              </button>
            );
          })}
        </div>

        {/* Input Mode Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-neutral-900 p-1 rounded-xl text-xs">
          <button
            type="button"
            onClick={() => setInputMode('grade')}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
              inputMode === 'grade'
                ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-neutral-400'
            }`}
          >
            গ্রেড
          </button>
          <button
            type="button"
            onClick={() => setInputMode('marks')}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
              inputMode === 'marks'
                ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-neutral-400'
            }`}
          >
            নম্বর (০-১০০)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-5 items-start">
        {/* ── Left: Subject List (Compact) ── */}
        <div className="md:col-span-7 space-y-2">
          {activeSubjects.map((sub) => {
            const currentGrade = grades[sub.id] || 'A+';
            const currentMark = marks[sub.id] ?? 85;
            const isFourth = sub.isFourthSubject;

            return (
              <div
                key={sub.id}
                className={`px-3 py-2 rounded-xl border flex items-center justify-between gap-3 ${
                  isFourth
                    ? 'bg-slate-50 dark:bg-neutral-900/60 border-slate-300 dark:border-neutral-700'
                    : 'bg-white dark:bg-neutral-900/30 border-slate-200 dark:border-neutral-800/80'
                }`}
              >
                <div className="min-w-0 flex items-center gap-2">
                  <span className="text-xs sm:text-sm text-slate-800 dark:text-neutral-200 truncate">
                    {sub.name}
                  </span>
                  {isFourth && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-200 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 shrink-0">
                      ৪র্থ বিষয়
                    </span>
                  )}
                </div>

                <div className="shrink-0">
                  {inputMode === 'marks' ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={currentMark}
                        onChange={(e) => setSubjectMark(sub.id, parseInt(e.target.value))}
                        className="w-14 h-8 text-center text-xs font-semibold bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-[#059669]"
                      />
                      <span className="w-9 text-center text-xs font-semibold text-slate-700 dark:text-neutral-300">
                        {currentGrade}
                      </span>
                    </div>
                  ) : (
                    <select
                      value={currentGrade}
                      onChange={(e) => setSubjectGrade(sub.id, e.target.value as GradeKey)}
                      className="h-8 px-2 rounded-lg text-xs font-medium border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-900 text-slate-800 dark:text-neutral-200 cursor-pointer focus:outline-none focus:border-[#059669]"
                    >
                      <option value="A+">A+ (৫.০০)</option>
                      <option value="A">A (৪.০০)</option>
                      <option value="A-">A- (৩.৫০)</option>
                      <option value="B">B (৩.০০)</option>
                      <option value="C">C (২.০০)</option>
                      <option value="D">D (১.০০)</option>
                      <option value="F">F (০.০০)</option>
                    </select>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Right: Result Card (Compact & Matches Obhyash Emerald Theme) ── */}
        <div className="md:col-span-5 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 p-4 space-y-3.5">
          <div className="text-center py-2">
            <span className="text-[11px] text-slate-500 dark:text-neutral-400 uppercase tracking-wider block mb-1">
              চূড়ান্ত জিপিএ
            </span>
            <div className="flex items-baseline justify-center gap-1.5">
              <span
                className={`text-4xl sm:text-5xl font-bold tracking-tight tabular-nums ${
                  calculation.isFail
                    ? 'text-red-500'
                    : 'text-slate-900 dark:text-white'
                }`}
              >
                {calculation.gpa.toFixed(2)}
              </span>
              <span className="text-xs text-slate-400 dark:text-neutral-500">/ ৫.০০</span>
            </div>

            <div className="mt-2">
              {calculation.isFail ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 text-xs font-semibold">
                  <AlertTriangle className="w-3 h-3" />
                  ফেল ({calculation.failedSubject})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-[#059669] dark:text-emerald-400 text-xs font-semibold">
                  <CheckCircle2 className="w-3 h-3" />
                  গ্রেড: {calculation.letterGrade}
                  {calculation.isGolden ? ' (গোল্ডেন A+)' : ''}
                </span>
              )}
            </div>
          </div>

          {/* Minimal Breakdown */}
          <div className="text-xs text-slate-600 dark:text-neutral-400 border-t border-slate-200 dark:border-neutral-800 pt-3 space-y-1.5">
            <div className="flex justify-between">
              <span>মূল ৬ বিষয়ের পয়েন্ট:</span>
              <span className="font-semibold text-slate-800 dark:text-neutral-200 tabular-nums">
                {calculation.mainTotalPoints.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>৪র্থ বিষয়ের বোনাস:</span>
              <span className="font-semibold text-[#059669] dark:text-emerald-400 tabular-nums">
                +{calculation.fourthBonusPoint.toFixed(2)}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 text-[11px] text-slate-500 dark:text-neutral-400 font-mono text-center">
              ({calculation.mainTotalPoints.toFixed(2)} + {calculation.fourthBonusPoint.toFixed(2)}) ÷ ৬ = {calculation.gpa.toFixed(2)}
            </div>
          </div>

          {/* Copy Button */}
          <button
            type="button"
            onClick={copyResult}
            className="w-full py-2 px-3 rounded-xl bg-[#004633] dark:bg-[#059669] hover:bg-[#003728] dark:hover:bg-[#047857] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-2xs"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>কপি হয়েছে</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>রেজাল্ট কপি করো</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HscGpaCalculator;
