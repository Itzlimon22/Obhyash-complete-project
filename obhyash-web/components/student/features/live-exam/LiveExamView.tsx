"use client";

import React from "react";
import AppLayout from "@/components/student/ui/layout/AppLayout";
import CourseSystemView from "@/components/student/features/courses/CourseSystemView";
import OldLiveExamView from "./OldLiveExamView";

export interface LiveExamViewProps {
  commonLayoutProps: any;
}

/**
 * =====================================================================
 * FEATURE FLAG: Controls whether to show the new Figma-designed Course
 * System or the legacy Live Exam system.
 * Default is FALSE (use new Figma Course System).
 * Set to TRUE to immediately restore the old course system.
 * =====================================================================
 */
export const USE_LEGACY_COURSES = false;

export const LiveExamView: React.FC<LiveExamViewProps> = (props) => {
  if (USE_LEGACY_COURSES) {
    return <OldLiveExamView {...props} />;
  }

  return (
    <AppLayout
      activeTab="courses"
      {...props.commonLayoutProps}
      title="কোর্সসমূহ"
      onBack={() => {
        if (props.commonLayoutProps?.onBack) {
          props.commonLayoutProps.onBack();
        } else if (props.commonLayoutProps?.onTabChange) {
          props.commonLayoutProps.onTabChange("dashboard");
        }
      }}
    >
      <div className="w-full max-w-6xl mx-auto px-1 sm:px-4 lg:px-6 py-2 sm:py-4 font-['HindSiliguri',sans-serif]">
        <CourseSystemView commonLayoutProps={props.commonLayoutProps} />
      </div>
    </AppLayout>
  );
};

export default LiveExamView;
