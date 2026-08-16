"use client";
import { usePathname } from 'next/navigation';

import React, { useState, useEffect } from "react";
import { Plus, Edit2, List, Trash2, Trophy } from "lucide-react";
import { toast } from "sonner";
import { LiveExam } from "@/lib/types";
import { getLiveExams, deleteLiveExam, createLiveExam, updateLiveExam } from "@/services/live-exam-admin-service";
import Link from "next/link";
import LiveExamFormModal from "./LiveExamFormModal";

export default function LiveExamDashboard() {
  const pathname = usePathname();
  const basePath = pathname.startsWith('/teacher') ? '/teacher/live-exams' : '/admin/live-exams';
  const [exams, setExams] = useState<LiveExam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<LiveExam | null>(null);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      setIsLoading(true);
      const data = await getLiveExams();
      setExams(data);
    } catch (error) {
      toast.error("Failed to fetch live exams: " + String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveExam = async (examData: Partial<LiveExam>) => {
    try {
      if (editingExam) {
        await updateLiveExam(editingExam.id, examData);
        toast.success("Exam updated successfully");
      } else {
        await createLiveExam(examData);
        toast.success("Exam created successfully");
      }
      setIsModalOpen(false);
      fetchExams();
    } catch (error) {
      toast.error("Failed to save exam");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this exam?")) return;
    try {
      await deleteLiveExam(id);
      toast.success("Exam deleted successfully");
      fetchExams();
    } catch (error) {
      toast.error("Failed to delete exam");
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-neutral-900 dark:text-white">
            Live Exams Management
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Create and manage scheduled live exams
          </p>
        </div>
        <button
          onClick={() => {
            setEditingExam(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors"
        >
          <Plus size={18} />
          Create New Exam
        </button>
      </div>

      <div className="bg-white dark:bg-[#1c1c1c] rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800 text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                <th className="p-4">Title</th>
                <th className="p-4">Category</th>
                <th className="p-4">Schedule</th>
                <th className="p-4">Details</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-neutral-500 font-mono text-sm">
                    Loading live exams database...
                  </td>
                </tr>
              ) : exams.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-neutral-500">
                    No live exams found. Click "Create New Exam" to schedule your first exam.
                  </td>
                </tr>
              ) : (
                exams.map((exam) => {
                  const now = new Date().getTime();
                  const start = new Date(exam.start_time).getTime();
                  const end = new Date(exam.end_time).getTime();
                  const isLiveNow = now >= start && now <= end;
                  const isUpcoming = now < start;
                  const isEnded = now > end;

                  return (
                    <tr key={exam.id} className="hover:bg-neutral-50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {isLiveNow && (
                            <span className="flex h-2 w-2 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                            </span>
                          )}
                          <p className="font-bold text-neutral-900 dark:text-zinc-100 text-sm">
                            {exam.title}
                          </p>
                        </div>
                        <p className="text-xs text-neutral-500 dark:text-zinc-400 mt-0.5 line-clamp-1">
                          {exam.description || "No description provided"}
                        </p>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 bg-neutral-100 dark:bg-zinc-800 text-neutral-700 dark:text-zinc-300 rounded-lg text-xs font-semibold capitalize border border-neutral-200/60 dark:border-zinc-700/60">
                          {exam.category}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="text-xs space-y-0.5 font-mono">
                          <p className="text-neutral-700 dark:text-zinc-300"><span className="text-neutral-400">Starts:</span> {new Date(exam.start_time).toLocaleString()}</p>
                          <p className="text-neutral-500 dark:text-zinc-400"><span className="text-neutral-400">Ends:</span> {new Date(exam.end_time).toLocaleString()}</p>
                        </div>
                      </td>
                      <td className="p-4 text-xs text-neutral-600 dark:text-zinc-400">
                        <p className="font-semibold">{exam.duration_minutes} mins • {exam.total_marks} marks</p>
                        <p className="text-emerald-600 dark:text-emerald-400 font-bold">{exam.total_questions || 0} questions assigned</p>
                      </td>
                      <td className="p-4">
                        {isLiveNow ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                            LIVE NOW
                          </span>
                        ) : isUpcoming ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            Upcoming
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-zinc-800 text-neutral-600 dark:text-zinc-400 border border-neutral-200 dark:border-zinc-700">
                            Ended
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link 
                            href={`${basePath}/${exam.id}/builder`}
                            className="p-2 text-zinc-600 dark:text-zinc-300 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-colors border border-transparent hover:border-emerald-500/20"
                            title="Question Builder"
                          >
                            <List size={17} />
                          </Link>
                          <Link 
                            href={`${basePath}/${exam.id}/results`}
                            className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-xl transition-colors border border-transparent hover:border-blue-500/20"
                            title="Leaderboard & Results"
                          >
                            <Trophy size={17} />
                          </Link>
                          <button
                            onClick={() => {
                              setEditingExam(exam);
                              setIsModalOpen(true);
                            }}
                            className="p-2 text-amber-500 hover:bg-amber-500/10 rounded-xl transition-colors border border-transparent hover:border-amber-500/20"
                            title="Edit Exam Info"
                          >
                            <Edit2 size={17} />
                          </button>
                          <button
                            onClick={() => handleDelete(exam.id)}
                            className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors border border-transparent hover:border-rose-500/20"
                            title="Delete Exam"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <LiveExamFormModal
          exam={editingExam}
          onSave={handleSaveExam}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
