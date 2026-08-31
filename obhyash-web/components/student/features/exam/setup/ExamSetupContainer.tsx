'use client';

import React from 'react';
import { ExamConfig, UserProfile } from '@/lib/types';
import ExamSetupForm from '@/components/student/ui/exam/ExamSetupForm';

/**
 * Props for the ExamSetupContainer component.
 */
interface ExamSetupContainerProps {
  /** Callback function triggered when the user starts the exam with valid configuration. */
  onStartExam: (config: ExamConfig) => void;
  /** Loading state indicating if the exam initialization is in progress. */
  isLoading: boolean;
  /** Current user profile */
  currentUser?: UserProfile | null;
  /** User's academic group/division — passed down to avoid a redundant DB fetch in ExamSetupForm */
  userDivision?: string;
  userStream?: string;
  userOptionalSubject?: string;
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
  currentUser,
  userDivision,
  userStream,
  userOptionalSubject,
}) => {
  return (
    <ExamSetupForm
      onStartExam={onStartExam}
      isLoading={isLoading}
      currentUser={currentUser}
      userDivision={userDivision}
      userStream={userStream}
      userOptionalSubject={userOptionalSubject}
    />
  );
};

