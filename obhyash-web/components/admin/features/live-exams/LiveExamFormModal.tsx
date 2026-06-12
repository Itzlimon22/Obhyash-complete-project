import React, { useState } from "react";
import { X } from "lucide-react";
import { LiveExam } from "@/lib/types";

interface Props {
  exam: LiveExam | null;
  onSave: (data: Partial<LiveExam>) => void;
  onClose: () => void;
}

export default function LiveExamFormModal({ exam, onSave, onClose }: Props) {
  const [formData, setFormData] = useState<Partial<LiveExam>>({
    title: exam?.title || "",
    category: exam?.category || "",
    description: exam?.description || "",
    start_time: exam?.start_time ? new Date(exam.start_time).toISOString().slice(0, 16) : "",
    end_time: exam?.end_time ? new Date(exam.end_time).toISOString().slice(0, 16) : "",
    duration_minutes: exam?.duration_minutes || 60,
    total_marks: exam?.total_marks || 100,
    negative_marking: exam?.negative_marking !== undefined ? exam.negative_marking : 0.25,
    status: exam?.status || "draft",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      start_time: new Date(formData.start_time as string).toISOString(),
      end_time: new Date(formData.end_time as string).toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-900 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
            {exam ? "Edit Live Exam" : "Create Live Exam"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-semibold">Title</label>
              <input
                required
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-2"
                placeholder="e.g. Medical Weekly Test - 1"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold">Category</label>
              <input
                required
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value.toLowerCase() })}
                className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-2"
                placeholder="e.g. medical, engineering"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-2"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-semibold">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-2"
                rows={3}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold">Start Time</label>
              <input
                required
                type="datetime-local"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-2"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold">End Time</label>
              <input
                required
                type="datetime-local"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-2"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold">Duration (Minutes)</label>
              <input
                required
                type="number"
                min="1"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: Number(e.target.value) })}
                className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-2"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold">Total Marks</label>
              <input
                required
                type="number"
                min="1"
                value={formData.total_marks}
                onChange={(e) => setFormData({ ...formData, total_marks: Number(e.target.value) })}
                className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-2"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold">Negative Marking</label>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                value={formData.negative_marking}
                onChange={(e) => setFormData({ ...formData, negative_marking: Number(e.target.value) })}
                className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-2"
              />
            </div>
          </div>
        </form>

        <div className="p-6 border-t border-neutral-200 dark:border-neutral-800 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800">
            Cancel
          </button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold">
            {exam ? "Update Exam" : "Create Exam"}
          </button>
        </div>
      </div>
    </div>
  );
}
