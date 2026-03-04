'use client';

import React, { useState, useEffect } from 'react';
import { getSubjects, getUserProfile } from '@/services/database';
import { getSubjectMetadata, SubjectMetadata } from '@/services/database';
import {
  fetchQuestionsWithDiagnostics,
  ExamDebugInfo,
} from '@/services/exam-service';
import { Question, ExamConfig, QuestionDifficulty } from '@/lib/types';
import {
  ArrowLeft,
  Play,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';

interface SubjectOption {
  id: string;
  name: string;
  label?: string;
  icon?: string;
  group?: string;
}

export default function ExamDebugPage() {
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Metadata State
  const [metadata, setMetadata] = useState<SubjectMetadata | null>(null);
  const [chapterOptions, setChapterOptions] = useState<string[]>([]);
  const [topicOptions, setTopicOptions] = useState<string[]>([]);
  const [isMetaLoading, setIsMetaLoading] = useState(false);

  // Selection State
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [examType, setExamType] = useState<string>('');
  const [count, setCount] = useState<number>(10);
  const [difficulty, setDifficulty] = useState<QuestionDifficulty>('Mixed');

  // Result State
  const [isFetching, setIsFetching] = useState(false);
  const [result, setResult] = useState<{
    questions: Question[];
    debug: ExamDebugInfo;
  } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const user = await getUserProfile('me');
        if (user) {
          // Fetch subjects based on user profile, just like ExamSetupForm
          const subs = await getSubjects(
            user.division,
            user.stream,
            user.optional_subject,
          );
          setSubjects(subs);
        } else {
          // Fallback if no user (e.g. admin browsing? mostly relies on user context)
          const subs = await getSubjects('HSC', 'Science');
          setSubjects(subs);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Load Metadata when Subject changes
  useEffect(() => {
    if (selectedSubject) {
      setIsMetaLoading(true);
      getSubjectMetadata(selectedSubject).then((data) => {
        if (data) {
          setMetadata(data);
          setChapterOptions(data.chapters);
          setTopicOptions([]); // Reset topics until chapters selected
        } else {
          setChapterOptions([]);
          setTopicOptions([]);
        }
        setIsMetaLoading(false);
      });
      setSelectedChapters([]);
      setSelectedTopics([]);
    }
  }, [selectedSubject]);

  // Load Topics when Chapters change (simplified logic)
  useEffect(() => {
    if (selectedChapters.length > 0 && metadata) {
      const aggregatedTopics = new Set<string>();
      selectedChapters.forEach((chapter) => {
        if (metadata.topics[chapter]) {
          metadata.topics[chapter].forEach((t) => aggregatedTopics.add(t));
        }
      });
      setTopicOptions(Array.from(aggregatedTopics));
    } else if (metadata) {
      // If no chapter selected, maybe show all topics? Or none.
      // ExamForm shows none. Let's stick to exam form.
      setTopicOptions([]);
    }
  }, [selectedChapters, metadata]);

  const toggleChapter = (c: string) => {
    setSelectedChapters((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );
  };

  const toggleTopic = (t: string) => {
    setSelectedTopics((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );
  };

  const handleTestFetch = async () => {
    if (!selectedSubject) {
      alert('Please select a subject');
      return;
    }

    setIsFetching(true);
    setResult(null);

    const subjectObj = subjects.find((s) => s.id === selectedSubject);

    const config: ExamConfig = {
      subject: selectedSubject,
      subjectLabel: subjectObj?.name || '',
      chapters:
        selectedChapters.length > 0 ? selectedChapters.join(', ') : 'All',
      topics: selectedTopics.length > 0 ? selectedTopics.join(', ') : 'All',
      examType: examType || 'Mixed',
      durationMinutes: 10,
      questionCount: count,
      negativeMarking: 0,
      difficulty: difficulty,
    };

    try {
      const data = await fetchQuestionsWithDiagnostics(config);
      setResult(data);
    } catch (e) {
      console.error(e);
      alert('Fetch failed. Check console.');
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-900">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 hover:bg-gray-200 rounded-full transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold">Exam Fetch Debugger</h1>
          </div>
          <div className="text-sm text-gray-500">
            Use this tool to diagnose &quot;0 questions found&quot; errors.
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Controls */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4 h-fit">
            <h2 className="font-semibold text-lg border-b pb-2">
              Configuration
            </h2>

            <div>
              <label className="block text-sm font-medium mb-1">Subject</label>
              <select
                className="w-full p-2 border rounded-md"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
              >
                <option value="">-- Select Subject --</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.id.slice(0, 8)}...)
                  </option>
                ))}
              </select>
              {selectedSubject && (
                <div className="text-xs text-gray-400 mt-1 font-mono">
                  ID: {selectedSubject} <br />
                  Name: {subjects.find((s) => s.id === selectedSubject)?.name}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Chapters */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Chapters{' '}
                  {isMetaLoading && (
                    <span className="text-xs text-gray-500 animate-pulse">
                      (Loading...)
                    </span>
                  )}
                </label>
                <div className="h-40 overflow-y-auto border rounded-md p-2 bg-gray-50 text-sm space-y-1">
                  {!selectedSubject ? (
                    <div className="text-gray-400 text-xs text-center py-4">
                      Select a subject first
                    </div>
                  ) : chapterOptions.length === 0 && !isMetaLoading ? (
                    <div className="text-gray-400 text-xs text-center py-4">
                      No chapters found
                    </div>
                  ) : (
                    chapterOptions.map((c) => (
                      <div
                        key={c}
                        onClick={() => toggleChapter(c)}
                        className={`cursor-pointer px-2 py-1 rounded flex items-center gap-2 ${selectedChapters.includes(c) ? 'bg-emerald-100 text-emerald-700' : 'hover:bg-gray-200'}`}
                      >
                        <div
                          className={`w-3 h-3 rounded border ${selectedChapters.includes(c) ? 'bg-emerald-600 border-emerald-600' : 'border-gray-400'}`}
                        ></div>
                        {c}
                      </div>
                    ))
                  )}
                </div>
                <div className="text-xs text-right text-gray-500">
                  {selectedChapters.length} selected
                </div>
              </div>

              {/* Topics */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">Topics</label>
                <div className="h-40 overflow-y-auto border rounded-md p-2 bg-gray-50 text-sm space-y-1">
                  {selectedChapters.length === 0 ? (
                    <div className="text-gray-400 text-xs text-center py-4">
                      Select chapters first
                    </div>
                  ) : topicOptions.length === 0 ? (
                    <div className="text-gray-400 text-xs text-center py-4">
                      No topics found
                    </div>
                  ) : (
                    topicOptions.map((t) => (
                      <div
                        key={t}
                        onClick={() => toggleTopic(t)}
                        className={`cursor-pointer px-2 py-1 rounded flex items-center gap-2 ${selectedTopics.includes(t) ? 'bg-green-100 text-green-700' : 'hover:bg-gray-200'}`}
                      >
                        <div
                          className={`w-3 h-3 rounded border ${selectedTopics.includes(t) ? 'bg-green-600 border-green-600' : 'border-gray-400'}`}
                        ></div>
                        {t}
                      </div>
                    ))
                  )}
                </div>
                <div className="text-xs text-right text-gray-500">
                  {selectedTopics.length} selected
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Exam Type
                </label>
                <input
                  type="text"
                  placeholder="e.g. Daily"
                  className="w-full p-2 border rounded-md text-sm"
                  value={examType}
                  onChange={(e) => setExamType(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Difficulty
                </label>
                <select
                  className="w-full p-2 border rounded-md text-sm"
                  value={difficulty}
                  onChange={(e) =>
                    setDifficulty(e.target.value as QuestionDifficulty)
                  }
                >
                  <option value="Mixed">Mixed</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Count</label>
              <input
                type="number"
                className="w-full p-2 border rounded-md"
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value))}
              />
            </div>

            <button
              onClick={handleTestFetch}
              disabled={isFetching || loading}
              className="w-full bg-emerald-600 text-white py-3 rounded-lg font-medium hover:bg-emerald-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isFetching ? (
                'Fetching...'
              ) : (
                <>
                  <Play className="w-4 h-4" /> Test Fetch
                </>
              )}
            </button>
          </div>

          {/* Right: Results */}
          <div className="lg:col-span-2 space-y-6">
            {!result && !isFetching && (
              <div className="bg-gray-100 rounded-xl p-12 text-center text-gray-500 border-2 border-dashed border-gray-300">
                Configure settings and click &quot;Test Fetch&quot; to see diagnostics.
              </div>
            )}

            {result && (
              <>
                {/* Result Summary */}
                <div
                  className={`p-4 rounded-lg flex items-center gap-4 ${result.questions.length > 0 ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'} border`}
                >
                  {result.questions.length > 0 ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <XCircle className="w-6 h-6" />
                  )}
                  <div>
                    <h3 className="font-bold">
                      {result.questions.length} Questions Found
                    </h3>
                    <p className="text-sm opacity-90">
                      Method: {result.debug.fetchMethod}
                    </p>
                  </div>
                </div>

                {/* Diagnostics Log */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 font-semibold flex justify-between">
                    <span>Running Diagnostics</span>
                    <span className="text-xs bg-gray-200 px-2 py-1 rounded text-gray-600 font-mono">
                      Timestamp:{' '}
                      {new Date(result.debug.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="p-4 bg-gray-900 text-green-400 font-mono text-xs overflow-x-auto max-h-64 space-y-1">
                    {result.debug.diagnosis.map((line, i) => (
                      <div
                        key={i}
                        className="border-b border-gray-800 pb-1 mb-1 last:border-0"
                      >
                        {line}
                      </div>
                    ))}
                    {!result.debug.diagnosis.length && (
                      <div className="text-gray-500 opacity-50 italic">
                        No warnings or errors logged.
                      </div>
                    )}
                  </div>
                </div>

                {/* Internal Params */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 font-semibold text-sm">
                    Resolved Parameters (Internal)
                  </div>
                  <pre className="p-4 text-xs font-mono text-gray-600 bg-gray-50 overflow-x-auto">
                    {JSON.stringify(result.debug.resolvedParams, null, 2)}
                  </pre>
                </div>

                {/* Questions Preview */}
                {result.questions.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 font-semibold text-sm">
                      Fetched Questions Preview
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500">
                          <tr>
                            <th className="px-4 py-2">ID</th>
                            <th className="px-4 py-2">Question Text</th>
                            <th className="px-4 py-2">Type</th>
                            <th className="px-4 py-2">Subject (DB)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {result.questions.slice(0, 10).map((q) => (
                            <tr key={q.id}>
                              <td className="px-4 py-2 font-mono text-xs text-gray-400">
                                {(q.id as string).slice(0, 8)}...
                              </td>
                              <td
                                className="px-4 py-2 max-w-xs truncate"
                                title={q.question}
                              >
                                {q.question}
                              </td>
                              <td className="px-4 py-2">{q.examType || '-'}</td>
                              <td className="px-4 py-2">{q.subject || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {result.questions.length > 10 && (
                        <div className="p-2 text-center text-xs text-gray-500 bg-gray-50 border-t">
                          + {result.questions.length - 10} more questions...
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
