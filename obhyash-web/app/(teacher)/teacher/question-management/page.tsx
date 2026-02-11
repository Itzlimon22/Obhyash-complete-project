'use client';

import React from 'react';
import QuestionManagementView from '@/components/shared/question-management-view';
import { useAuth } from '@/components/auth/AuthProvider'; // Fixed import path
import { Loader2 } from 'lucide-react';

export default function TeacherQuestionManagementPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-emerald-600" size={40} />
      </div>
    );
  }

  if (!user) {
    return null; // Value handled by middleware/redirects usually
  }

  return (
    <QuestionManagementView
      title="আমার প্রশ্ন ব্যাংক (My Question Bank)"
      baseFilters={{
        author: user.email, // Filter questions by this teacher's email
      }}
      basePath="/teacher/questions"
    />
  );
}
