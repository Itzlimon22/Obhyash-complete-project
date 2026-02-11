'use client';

import React from 'react';
import QuestionManagementView from '@/components/shared/question-management-view';

export default function QuestionManagementPage() {
  return (
    <QuestionManagementView
      title="প্রশ্ন ব্যাংক (Question Bank)"
      baseFilters={{}} // Admin sees all questions
      basePath="/admin/questions"
    />
  );
}
