'use client';

import React from 'react';
import { ExamConfig } from '@/lib/types';
import ExamSetupForm from '@/components/student/ui/exam/ExamSetupForm';

/**
 * Props for the ExamSetupContainer component.
 */
interface ExamSetupContainerProps {
  /** Callback function triggered when the user starts the exam with valid configuration. */
  onStartExam: (config: ExamConfig) => void;
  /** Loading state indicating if the exam initialization is in progress. */
  isLoading: boolean;
}

/**
 * ExamSetupContainer Component
 *
 * Wraps the ExamSetupForm to provide the exam configuration interface.
 *
 * @param props - {@link ExamSetupContainerProps}
 */
export const ExamSetupContainer: React.FC<ExamSetupContainerProps> = ({
  onStartExam,
  isLoading,
}) => {
  return <ExamSetupForm onStartExam={onStartExam} isLoading={isLoading} />;
};
