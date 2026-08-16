'use client';

import React from 'react';
import QuestionManagementView from '@/components/shared/question-management-view';

const EMPTY_FILTERS = {};

export default function QuestionManagementPage() {
  return (
    <QuestionManagementView
      title="প্রশ্ন ব্যাংক (Question Bank)"
      baseFilters={EMPTY_FILTERS}
      basePath="/admin/questions"
    />
  );
}

