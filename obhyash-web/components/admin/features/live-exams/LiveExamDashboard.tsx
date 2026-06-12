import { usePathname} from 'next/navigation';
"use client";

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
      toast.error("Failed to fetch live exams");
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
                  <td colSpan={6} className="p-8 text-center text-neutral-500">
                    Loading exams...
                  </td>
                </tr>
              ) : exams.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-neutral-500">
                    No live exams found. Create one to get started.
                  </td>
                </tr>
              ) : (
                exams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-neutral-900 dark:text-white">
                        {exam.title}
                      </p>
                      <p className="text-xs text-neutral-500">{exam.description || "No description"}</p>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg text-xs font-semibold capitalize">
                        {exam.category}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="text-xs">
                        <p><span className="text-neutral-500">Starts:</span> {new Date(exam.start_time).toLocaleString()}</p>
                        <p><span className="text-neutral-500">Ends:</span> {new Date(exam.end_time).toLocaleString()}</p>
                      </div>
                    </td>
                    <td className="p-4 text-xs text-neutral-600 dark:text-neutral-400">
                      <p>{exam.duration_minutes} mins • {exam.total_marks} marks</p>
                      <p>{exam.total_questions || 0} questions added</p>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize ${
                        exam.status === "published" 
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : exam.status === "archived"
                          ? "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      }`}>
                        {exam.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          href={`${basePath}/${exam.id}/builder`}
                          className="p-1.5 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
                          title="Question Builder"
                        >
                          <List size={18} />
                        </Link>
                        <Link 
                          href={`${basePath}/${exam.id}/results`}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                          title="Leaderboard & Results"
                        >
                          <Trophy size={18} />
                        </Link>
                        <button
                          onClick={() => {
                            setEditingExam(exam);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-md transition-colors"
                          title="Edit Exam Info"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(exam.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                          title="Delete Exam"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
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
