'use client';

import React from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import QuestionManagementView from '@/components/shared/question-management-view';
import { Loader2 } from 'lucide-react';

export default function TeacherQuestionManagementPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!user || !user.email) {
    return (
      <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-4 text-center">
        <p className="text-lg font-semibold text-neutral-600 dark:text-neutral-400">
          অনুগ্রহ করে লগ ইন করুন (Please log in to manage questions)
        </p>
      </div>
    );
  }

  return (
    <QuestionManagementView
      title="আমার প্রশ্ন ব্যাংক (My Question Bank)"
      baseFilters={{ author: user.email }}
      basePath="/teacher/question-management"
    />
  );
}
