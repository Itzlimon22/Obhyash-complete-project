"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  FileQuestion,
  Award,
  Layers,
  Timer,
  AlertCircle,
  Calculator,
  Eye,
  Play,
  Atom,
  FlaskConical,
  Dna,
  BookOpen,
  Languages,
  Globe,
  Check,
  Loader2,
  Landmark,
  Compass,
  Scale,
  TrendingUp,
  Laptop,
  Binary,
  Briefcase,
  Banknote,
  BookMarked,
  GraduationCap,
} from "lucide-react";
import { Question } from "@/lib/types";
import { BanglaNameHelper } from "@/lib/bangla-name-helper";
import {
  InstituteCardItem,
  InstituteExamSet,
  formatDurationMinutes,
} from "./InstituteDetailView";
import QuestionViewerPage from "./QuestionViewerPage";
import { fetchInstituteExamSetQuestions } from "@/services/question-bank-service";

interface ExamSetDetailViewProps {
  institute: InstituteCardItem;
  examSet: InstituteExamSet;
  onBack: () => void;
  onTakeExam?: (examSet: InstituteExamSet, questions: Question[]) => void;
  showHeader?: boolean;
}

export interface SubjectDistribution {
  subject: string;
  questions: string;
  marks: string;
  icon: React.ElementType;
  color: string;
  hexColor: string;
  bgColor: string;
  questionCount: number;
  totalMarks: number;
  durationMinutes: number;
}

export function getSubjectDistributions(
  instituteId: string,
  set: InstituteExamSet,
  division: string = ""
): SubjectDistribution[] {
  const id = instituteId.toLowerCase();
  const isWritten =
    set.type === "written" ||
    set.id.toLowerCase().includes("written") ||
    set.title.toLowerCase().includes("written") ||
    set.title.includes("লিখিত");

  // ── SSC Board / School Exams ──
  if (id.startsWith("board_") || id.startsWith("school_")) {
    const div = division.toLowerCase();
    const isBusiness =
      div.includes("business") || div.includes("commerce") || div.includes("ব্যবসায়");
    const isHumanities =
      div.includes("humanities") || div.includes("arts") || div.includes("মানবিক");

    if (isBusiness) {
      if (isWritten) {
        return [
          {
            subject: "হিসাববিজ্ঞান",
            questions: "১১টি সৃজনশীল প্রশ্ন",
            marks: "৭০ নম্বর",
            icon: BookOpen,
            color: "text-blue-900 dark:text-blue-300",
            hexColor: "#1E3A8A",
            bgColor: "bg-blue-900/10",
            questionCount: 11,
            totalMarks: 70,
            durationMinutes: 150,
          },
          {
            subject: "ব্যবসায় উদ্যোগ",
            questions: "১১টি সৃজনশীল প্রশ্ন",
            marks: "৭০ নম্বর",
            icon: Briefcase,
            color: "text-amber-800 dark:text-amber-300",
            hexColor: "#7A3602",
            bgColor: "bg-amber-800/10",
            questionCount: 11,
            totalMarks: 70,
            durationMinutes: 150,
          },
          {
            subject: "ফিন্যান্স ও ব্যাংকিং",
            questions: "১১টি সৃজনশীল প্রশ্ন",
            marks: "৭০ নম্বর",
            icon: Banknote,
            color: "text-emerald-800 dark:text-emerald-300",
            hexColor: "#065F46",
            bgColor: "bg-emerald-800/10",
            questionCount: 11,
            totalMarks: 70,
            durationMinutes: 150,
          },
          {
            subject: "সাধারণ গণিত",
            questions: "১১টি সৃজনশীল প্রশ্ন",
            marks: "৭০ নম্বর",
            icon: Calculator,
            color: "text-orange-600 dark:text-orange-400",
            hexColor: "#EA580C",
            bgColor: "bg-orange-600/10",
            questionCount: 11,
            totalMarks: 70,
            durationMinutes: 150,
          },
          {
            subject: "বাংলা",
            questions: "১১টি সৃজনশীল প্রশ্ন",
            marks: "৭০ নম্বর",
            icon: BookMarked,
            color: "text-pink-800 dark:text-pink-300",
            hexColor: "#831843",
            bgColor: "bg-pink-800/10",
            questionCount: 11,
            totalMarks: 70,
            durationMinutes: 150,
          },
          {
            subject: "ইংরেজি",
            questions: "রিটেন প্রশ্ন",
            marks: "১০০ নম্বর",
            icon: Languages,
            color: "text-teal-700 dark:text-teal-300",
            hexColor: "#0F766E",
            bgColor: "bg-teal-700/10",
            questionCount: 10,
            totalMarks: 100,
            durationMinutes: 180,
          },
        ];
      } else {
        return [
          {
            subject: "হিসাববিজ্ঞান",
            questions: "৩০টি প্রশ্ন",
            marks: "৩০ নম্বর",
            icon: BookOpen,
            color: "text-blue-900 dark:text-blue-300",
            hexColor: "#1E3A8A",
            bgColor: "bg-blue-900/10",
            questionCount: 30,
            totalMarks: 30,
            durationMinutes: 30,
          },
          {
            subject: "ব্যবসায় উদ্যোগ",
            questions: "৩০টি প্রশ্ন",
            marks: "৩০ নম্বর",
            icon: Briefcase,
            color: "text-amber-800 dark:text-amber-300",
            hexColor: "#7A3602",
            bgColor: "bg-amber-800/10",
            questionCount: 30,
            totalMarks: 30,
            durationMinutes: 30,
          },
          {
            subject: "ফিন্যান্স ও ব্যাংকিং",
            questions: "৩০টি প্রশ্ন",
            marks: "৩০ নম্বর",
            icon: Banknote,
            color: "text-emerald-800 dark:text-emerald-300",
            hexColor: "#065F46",
            bgColor: "bg-emerald-800/10",
            questionCount: 30,
            totalMarks: 30,
            durationMinutes: 30,
          },
          {
            subject: "সাধারণ গণিত",
            questions: "৩০টি প্রশ্ন",
            marks: "৩০ নম্বর",
            icon: Calculator,
            color: "text-orange-600 dark:text-orange-400",
            hexColor: "#EA580C",
            bgColor: "bg-orange-600/10",
            questionCount: 30,
            totalMarks: 30,
            durationMinutes: 30,
          },
          {
            subject: "বাংলা",
            questions: "৩০টি প্রশ্ন",
            marks: "৩০ নম্বর",
            icon: BookMarked,
            color: "text-pink-800 dark:text-pink-300",
            hexColor: "#831843",
            bgColor: "bg-pink-800/10",
            questionCount: 30,
            totalMarks: 30,
            durationMinutes: 30,
          },
          {
            subject: "ইংরেজি",
            questions: "৩০টি প্রশ্ন",
            marks: "৩০ নম্বর",
            icon: Languages,
            color: "text-teal-700 dark:text-teal-300",
            hexColor: "#0F766E",
            bgColor: "bg-teal-700/10",
            questionCount: 30,
            totalMarks: 30,
            durationMinutes: 30,
          },
          {
            subject: "তথ্য ও যোগাযোগ প্রযুক্তি",
            questions: "২৫টি প্রশ্ন",
            marks: "২৫ নম্বর",
            icon: Laptop,
            color: "text-sky-600 dark:text-sky-400",
            hexColor: "#0284C7",
            bgColor: "bg-sky-600/10",
            questionCount: 25,
            totalMarks: 25,
            durationMinutes: 25,
          },
        ];
      }
    }

    if (isHumanities) {
      if (isWritten) {
        return [
          {
            subject: "ইতিহাস ও বিশ্ব সভ্যতা",
            questions: "১১টি সৃজনশীল প্রশ্ন",
            marks: "৭০ নম্বর",
            icon: Landmark,
            color: "text-fuchsia-900 dark:text-fuchsia-300",
            hexColor: "#701A75",
            bgColor: "bg-fuchsia-900/10",
            questionCount: 11,
            totalMarks: 70,
            durationMinutes: 150,
          },
          {
            subject: "ভূগোল ও পরিবেশ",
            questions: "১১টি সৃজনশীল প্রশ্ন",
            marks: "৭০ নম্বর",
            icon: Compass,
            color: "text-teal-700 dark:text-teal-300",
            hexColor: "#0F766E",
            bgColor: "bg-teal-700/10",
            questionCount: 11,
            totalMarks: 70,
            durationMinutes: 150,
          },
          {
            subject: "পৌরনীতি ও নাগরিকতা",
            questions: "১১টি সৃজনশীল প্রশ্ন",
            marks: "৭০ নম্বর",
            icon: Scale,
            color: "text-cyan-900 dark:text-cyan-300",
            hexColor: "#164E63",
            bgColor: "bg-cyan-900/10",
            questionCount: 11,
            totalMarks: 70,
            durationMinutes: 150,
          },
          {
            subject: "অর্থনীতি",
            questions: "১১টি সৃজনশীল প্রশ্ন",
            marks: "৭০ নম্বর",
            icon: TrendingUp,
            color: "text-pink-800 dark:text-pink-300",
            hexColor: "#831843",
            bgColor: "bg-pink-800/10",
            questionCount: 11,
            totalMarks: 70,
            durationMinutes: 150,
          },
          {
            subject: "সাধারণ গণিত",
            questions: "১১টি সৃজনশীল প্রশ্ন",
            marks: "৭০ নম্বর",
            icon: Calculator,
            color: "text-orange-600 dark:text-orange-400",
            hexColor: "#EA580C",
            bgColor: "bg-orange-600/10",
            questionCount: 11,
            totalMarks: 70,
            durationMinutes: 150,
          },
          {
            subject: "বাংলা",
            questions: "১১টি সৃজনশীল প্রশ্ন",
            marks: "৭০ নম্বর",
            icon: BookMarked,
            color: "text-pink-800 dark:text-pink-300",
            hexColor: "#831843",
            bgColor: "bg-pink-800/10",
            questionCount: 11,
            totalMarks: 70,
            durationMinutes: 150,
          },
        ];
      } else {
        return [
          {
            subject: "ইতিহাস ও বিশ্ব সভ্যতা",
            questions: "৩০টি প্রশ্ন",
            marks: "৩০ নম্বর",
            icon: Landmark,
            color: "text-fuchsia-900 dark:text-fuchsia-300",
            hexColor: "#701A75",
            bgColor: "bg-fuchsia-900/10",
            questionCount: 30,
            totalMarks: 30,
            durationMinutes: 30,
          },
          {
            subject: "ভূগোল ও পরিবেশ",
            questions: "৩০টি প্রশ্ন",
            marks: "৩০ নম্বর",
            icon: Compass,
            color: "text-teal-700 dark:text-teal-300",
            hexColor: "#0F766E",
            bgColor: "bg-teal-700/10",
            questionCount: 30,
            totalMarks: 30,
            durationMinutes: 30,
          },
          {
            subject: "পৌরনীতি ও নাগরিকতা",
            questions: "৩০টি প্রশ্ন",
            marks: "৩০ নম্বর",
            icon: Scale,
            color: "text-cyan-900 dark:text-cyan-300",
            hexColor: "#164E63",
            bgColor: "bg-cyan-900/10",
            questionCount: 30,
            totalMarks: 30,
            durationMinutes: 30,
          },
          {
            subject: "অর্থনীতি",
            questions: "৩০টি প্রশ্ন",
            marks: "৩০ নম্বর",
            icon: TrendingUp,
            color: "text-pink-800 dark:text-pink-300",
            hexColor: "#831843",
            bgColor: "bg-pink-800/10",
            questionCount: 30,
            totalMarks: 30,
            durationMinutes: 30,
          },
          {
            subject: "সাধারণ গণিত",
            questions: "৩০টি প্রশ্ন",
            marks: "৩০ নম্বর",
            icon: Calculator,
            color: "text-orange-600 dark:text-orange-400",
            hexColor: "#EA580C",
            bgColor: "bg-orange-600/10",
            questionCount: 30,
            totalMarks: 30,
            durationMinutes: 30,
          },
          {
            subject: "বাংলা",
            questions: "৩০টি প্রশ্ন",
            marks: "৩০ নম্বর",
            icon: BookMarked,
            color: "text-pink-800 dark:text-pink-300",
            hexColor: "#831843",
            bgColor: "bg-pink-800/10",
            questionCount: 30,
            totalMarks: 30,
            durationMinutes: 30,
          },
          {
            subject: "তথ্য ও যোগাযোগ প্রযুক্তি",
            questions: "২৫টি প্রশ্ন",
            marks: "২৫ নম্বর",
            icon: Laptop,
            color: "text-sky-600 dark:text-sky-400",
            hexColor: "#0284C7",
            bgColor: "bg-sky-600/10",
            questionCount: 25,
            totalMarks: 25,
            durationMinutes: 25,
          },
        ];
      }
    }

    // Default: Science
    if (isWritten) {
      return [
        {
          subject: "পদার্থবিজ্ঞান",
          questions: "১১টি সৃজনশীল প্রশ্ন",
          marks: "৫০ নম্বর",
          icon: Atom,
          color: "text-blue-600 dark:text-blue-400",
          hexColor: "#2563EB",
          bgColor: "bg-blue-600/10",
          questionCount: 11,
          totalMarks: 50,
          durationMinutes: 150,
        },
        {
          subject: "রসায়ন",
          questions: "১১টি সৃজনশীল প্রশ্ন",
          marks: "৫০ নম্বর",
          icon: FlaskConical,
          color: "text-purple-600 dark:text-purple-400",
          hexColor: "#8B5CF6",
          bgColor: "bg-purple-600/10",
          questionCount: 11,
          totalMarks: 50,
          durationMinutes: 150,
        },
        {
          subject: "উচ্চতর গণিত",
          questions: "১১টি সৃজনশীল প্রশ্ন",
          marks: "৫০ নম্বর",
          icon: Calculator,
          color: "text-orange-600 dark:text-orange-400",
          hexColor: "#EA580C",
          bgColor: "bg-orange-600/10",
          questionCount: 11,
          totalMarks: 50,
          durationMinutes: 150,
        },
        {
          subject: "জীববিজ্ঞান",
          questions: "১১টি সৃজনশীল প্রশ্ন",
          marks: "৫০ নম্বর",
          icon: Dna,
          color: "text-emerald-600 dark:text-emerald-400",
          hexColor: "#059669",
          bgColor: "bg-emerald-600/10",
          questionCount: 11,
          totalMarks: 50,
          durationMinutes: 150,
        },
        {
          subject: "সাধারণ গণিত",
          questions: "১১টি সৃজনশীল প্রশ্ন",
          marks: "৭০ নম্বর",
          icon: Binary,
          color: "text-teal-600 dark:text-teal-400",
          hexColor: "#0D9488",
          bgColor: "bg-teal-600/10",
          questionCount: 11,
          totalMarks: 70,
          durationMinutes: 150,
        },
        {
          subject: "বাংলা",
          questions: "১১টি সৃজনশীল প্রশ্ন",
          marks: "৭০ নম্বর",
          icon: BookMarked,
          color: "text-pink-800 dark:text-pink-300",
          hexColor: "#831843",
          bgColor: "bg-pink-800/10",
          questionCount: 11,
          totalMarks: 70,
          durationMinutes: 150,
        },
      ];
    } else {
      return [
        {
          subject: "পদার্থবিজ্ঞান",
          questions: "২৫টি প্রশ্ন",
          marks: "২৫ নম্বর",
          icon: Atom,
          color: "text-blue-600 dark:text-blue-400",
          hexColor: "#2563EB",
          bgColor: "bg-blue-600/10",
          questionCount: 25,
          totalMarks: 25,
          durationMinutes: 25,
        },
        {
          subject: "রসায়ন",
          questions: "২৫টি প্রশ্ন",
          marks: "২৫ নম্বর",
          icon: FlaskConical,
          color: "text-purple-600 dark:text-purple-400",
          hexColor: "#8B5CF6",
          bgColor: "bg-purple-600/10",
          questionCount: 25,
          totalMarks: 25,
          durationMinutes: 25,
        },
        {
          subject: "উচ্চতর গণিত",
          questions: "২৫টি প্রশ্ন",
          marks: "২৫ নম্বর",
          icon: Calculator,
          color: "text-orange-600 dark:text-orange-400",
          hexColor: "#EA580C",
          bgColor: "bg-orange-600/10",
          questionCount: 25,
          totalMarks: 25,
          durationMinutes: 25,
        },
        {
          subject: "জীববিজ্ঞান",
          questions: "২৫টি প্রশ্ন",
          marks: "২৫ নম্বর",
          icon: Dna,
          color: "text-emerald-600 dark:text-emerald-400",
          hexColor: "#059669",
          bgColor: "bg-emerald-600/10",
          questionCount: 25,
          totalMarks: 25,
          durationMinutes: 25,
        },
        {
          subject: "সাধারণ গণিত",
          questions: "৩০টি প্রশ্ন",
          marks: "৩০ নম্বর",
          icon: Binary,
          color: "text-teal-600 dark:text-teal-400",
          hexColor: "#0D9488",
          bgColor: "bg-teal-600/10",
          questionCount: 30,
          totalMarks: 30,
          durationMinutes: 30,
        },
        {
          subject: "বাংলা",
          questions: "৩০টি প্রশ্ন",
          marks: "৩০ নম্বর",
          icon: BookMarked,
          color: "text-pink-800 dark:text-pink-300",
          hexColor: "#831843",
          bgColor: "bg-pink-800/10",
          questionCount: 30,
          totalMarks: 30,
          durationMinutes: 30,
        },
        {
          subject: "ইংরেজি",
          questions: "৩০টি প্রশ্ন",
          marks: "৩০ নম্বর",
          icon: Languages,
          color: "text-blue-900 dark:text-blue-300",
          hexColor: "#1E3A8A",
          bgColor: "bg-blue-900/10",
          questionCount: 30,
          totalMarks: 30,
          durationMinutes: 30,
        },
        {
          subject: "তথ্য ও যোগাযোগ প্রযুক্তি",
          questions: "২৫টি প্রশ্ন",
          marks: "২৫ নম্বর",
          icon: Laptop,
          color: "text-sky-600 dark:text-sky-400",
          hexColor: "#0284C7",
          bgColor: "bg-sky-600/10",
          questionCount: 25,
          totalMarks: 25,
          durationMinutes: 25,
        },
      ];
    }
  }

  // ── Admission Test Distributions ──
  if (id === "buet") {
    if (isWritten) {
      return [
        {
          subject: "পদার্থবিজ্ঞান",
          questions: "১৩-১৪টি প্রশ্ন",
          marks: "১৩৫ নম্বর",
          icon: Atom,
          color: "text-blue-600 dark:text-blue-400",
          hexColor: "#2563EB",
          bgColor: "bg-blue-500/10",
          questionCount: 14,
          totalMarks: 135,
          durationMinutes: 60,
        },
        {
          subject: "রসায়ন",
          questions: "১৩-১৪টি প্রশ্ন",
          marks: "১৩৫ নম্বর",
          icon: FlaskConical,
          color: "text-purple-600 dark:text-purple-400",
          hexColor: "#8B5CF6",
          bgColor: "bg-purple-500/10",
          questionCount: 13,
          totalMarks: 135,
          durationMinutes: 60,
        },
        {
          subject: "উচ্চতর গণিত",
          questions: "১৩-১৪টি প্রশ্ন",
          marks: "১৩০ নম্বর",
          icon: Calculator,
          color: "text-orange-600 dark:text-orange-400",
          hexColor: "#EA580C",
          bgColor: "bg-orange-500/10",
          questionCount: 13,
          totalMarks: 130,
          durationMinutes: 60,
        },
      ];
    } else {
      return [
        {
          subject: "পদার্থবিজ্ঞান",
          questions: "৩৪টি প্রশ্ন",
          marks: "৩৪ নম্বর",
          icon: Atom,
          color: "text-blue-600 dark:text-blue-400",
          hexColor: "#2563EB",
          bgColor: "bg-blue-500/10",
          questionCount: 34,
          totalMarks: 34,
          durationMinutes: 34,
        },
        {
          subject: "রসায়ন",
          questions: "৩৩টি প্রশ্ন",
          marks: "৩৩ নম্বর",
          icon: FlaskConical,
          color: "text-purple-600 dark:text-purple-400",
          hexColor: "#8B5CF6",
          bgColor: "bg-purple-500/10",
          questionCount: 33,
          totalMarks: 33,
          durationMinutes: 33,
        },
        {
          subject: "উচ্চতর গণিত",
          questions: "৩৩টি প্রশ্ন",
          marks: "৩৩ নম্বর",
          icon: Calculator,
          color: "text-orange-600 dark:text-orange-400",
          hexColor: "#EA580C",
          bgColor: "bg-orange-500/10",
          questionCount: 33,
          totalMarks: 33,
          durationMinutes: 33,
        },
      ];
    }
  }

  if (id === "ckruet" || id === "ruet" || id === "kuet" || id === "cuet") {
    return [
      {
        subject: "পদার্থবিজ্ঞান",
        questions: "২৫টি প্রশ্ন",
        marks: "১২৫ নম্বর",
        icon: Atom,
        color: "text-blue-600 dark:text-blue-400",
        hexColor: "#2563EB",
        bgColor: "bg-blue-500/10",
        questionCount: 25,
        totalMarks: 125,
        durationMinutes: 30,
      },
      {
        subject: "রসায়ন",
        questions: "২৫টি প্রশ্ন",
        marks: "১২৫ নম্বর",
        icon: FlaskConical,
        color: "text-purple-600 dark:text-purple-400",
        hexColor: "#8B5CF6",
        bgColor: "bg-purple-500/10",
        questionCount: 25,
        totalMarks: 125,
        durationMinutes: 30,
      },
      {
        subject: "উচ্চতর গণিত",
        questions: "২৫টি প্রশ্ন",
        marks: "১২৫ নম্বর",
        icon: Calculator,
        color: "text-orange-600 dark:text-orange-400",
        hexColor: "#EA580C",
        bgColor: "bg-orange-500/10",
        questionCount: 25,
        totalMarks: 125,
        durationMinutes: 30,
      },
      {
        subject: "ইংরেজি",
        questions: "২৫টি প্রশ্ন",
        marks: "১২৫ নম্বর",
        icon: BookOpen,
        color: "text-teal-600 dark:text-teal-400",
        hexColor: "#0F766E",
        bgColor: "bg-teal-500/10",
        questionCount: 25,
        totalMarks: 125,
        durationMinutes: 30,
      },
    ];
  }

  if (id === "medical") {
    return [
      {
        subject: "জীববিজ্ঞান",
        questions: "৩০টি প্রশ্ন",
        marks: "৩০ নম্বর",
        icon: Dna,
        color: "text-emerald-600 dark:text-emerald-400",
        hexColor: "#059669",
        bgColor: "bg-emerald-500/10",
        questionCount: 30,
        totalMarks: 30,
        durationMinutes: 30,
      },
      {
        subject: "রসায়ন",
        questions: "২৫টি প্রশ্ন",
        marks: "২৫ নম্বর",
        icon: FlaskConical,
        color: "text-purple-600 dark:text-purple-400",
        hexColor: "#8B5CF6",
        bgColor: "bg-purple-500/10",
        questionCount: 25,
        totalMarks: 25,
        durationMinutes: 25,
      },
      {
        subject: "পদার্থবিজ্ঞান",
        questions: "২০টি প্রশ্ন",
        marks: "২০ নম্বর",
        icon: Atom,
        color: "text-blue-600 dark:text-blue-400",
        hexColor: "#2563EB",
        bgColor: "bg-blue-500/10",
        questionCount: 20,
        totalMarks: 20,
        durationMinutes: 20,
      },
      {
        subject: "ইংরেজি",
        questions: "১৫টি প্রশ্ন",
        marks: "১৫ নম্বর",
        icon: Languages,
        color: "text-orange-600 dark:text-orange-400",
        hexColor: "#EA580C",
        bgColor: "bg-orange-500/10",
        questionCount: 15,
        totalMarks: 15,
        durationMinutes: 15,
      },
      {
        subject: "সাধারণ জ্ঞান",
        questions: "১০টি প্রশ্ন",
        marks: "১০ নম্বর",
        icon: Globe,
        color: "text-rose-600 dark:text-rose-400",
        hexColor: "#E11D48",
        bgColor: "bg-rose-500/10",
        questionCount: 10,
        totalMarks: 10,
        durationMinutes: 10,
      },
    ];
  }

  if (id.includes("du") || id === "varsity_ka") {
    return [
      {
        subject: "পদার্থবিজ্ঞান",
        questions: "১৫টি MCQ + লিখিত",
        marks: "২৫ নম্বর",
        icon: Atom,
        color: "text-blue-600 dark:text-blue-400",
        hexColor: "#2563EB",
        bgColor: "bg-blue-500/10",
        questionCount: 15,
        totalMarks: 25,
        durationMinutes: 22,
      },
      {
        subject: "রসায়ন",
        questions: "১৫টি MCQ + লিখিত",
        marks: "২৫ নম্বর",
        icon: FlaskConical,
        color: "text-purple-600 dark:text-purple-400",
        hexColor: "#8B5CF6",
        bgColor: "bg-purple-500/10",
        questionCount: 15,
        totalMarks: 25,
        durationMinutes: 22,
      },
      {
        subject: "উচ্চতর গণিত",
        questions: "১৫টি MCQ + লিখিত",
        marks: "২৫ নম্বর",
        icon: Calculator,
        color: "text-orange-600 dark:text-orange-400",
        hexColor: "#EA580C",
        bgColor: "bg-orange-500/10",
        questionCount: 15,
        totalMarks: 25,
        durationMinutes: 22,
      },
      {
        subject: "জীববিজ্ঞান / আইসিটি",
        questions: "১৫টি MCQ + লিখিত",
        marks: "২৫ নম্বর",
        icon: Dna,
        color: "text-emerald-600 dark:text-emerald-400",
        hexColor: "#059669",
        bgColor: "bg-emerald-500/10",
        questionCount: 15,
        totalMarks: 25,
        durationMinutes: 22,
      },
    ];
  }

  // Default distribution
  return [
    {
      subject: "পদার্থবিজ্ঞান",
      questions: "২৫টি প্রশ্ন",
      marks: "২৫ নম্বর",
      icon: Atom,
      color: "text-blue-600 dark:text-blue-400",
      hexColor: "#2563EB",
      bgColor: "bg-blue-500/10",
      questionCount: 25,
      totalMarks: 25,
      durationMinutes: 25,
    },
    {
      subject: "রসায়ন",
      questions: "২৫টি প্রশ্ন",
      marks: "২৫ নম্বর",
      icon: FlaskConical,
      color: "text-purple-600 dark:text-purple-400",
      hexColor: "#8B5CF6",
      bgColor: "bg-purple-500/10",
      questionCount: 25,
      totalMarks: 25,
      durationMinutes: 25,
    },
    {
      subject: "উচ্চতর গণিত",
      questions: "২৫টি প্রশ্ন",
      marks: "২৫ নম্বর",
      icon: Calculator,
      color: "text-orange-600 dark:text-orange-400",
      hexColor: "#EA580C",
      bgColor: "bg-orange-500/10",
      questionCount: 25,
      totalMarks: 25,
      durationMinutes: 25,
    },
    {
      subject: "জীববিজ্ঞান / অন্যান্য",
      questions: "২৫টি প্রশ্ন",
      marks: "২৫ নম্বর",
      icon: Dna,
      color: "text-teal-600 dark:text-teal-400",
      hexColor: "#0D9488",
      bgColor: "bg-teal-500/10",
      questionCount: 25,
      totalMarks: 25,
      durationMinutes: 25,
    },
  ];
}

export const ExamSetDetailView: React.FC<ExamSetDetailViewProps> = ({
  institute,
  examSet,
  onBack,
  onTakeExam,
  showHeader = true,
}) => {
  const [viewMode, setViewMode] = useState<"details" | "read">("details");
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [fetchedQuestions, setFetchedQuestions] = useState<Question[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [initializedSubjects, setInitializedSubjects] = useState(false);

  const instId = institute.id.toLowerCase();
  const isWritten =
    examSet.type === "written" ||
    examSet.id.toLowerCase().includes("written") ||
    examSet.title.toLowerCase().includes("written") ||
    examSet.title.includes("লিখিত");
  const isBuet = instId === "buet";
  const isBoardOrSchool =
    instId.startsWith("board_") || instId.startsWith("school_");

  const distributions = getSubjectDistributions(institute.id, examSet);

  // Initialize selection once distributions are ready
  useEffect(() => {
    if (!initializedSubjects && distributions.length > 0) {
      if (isWritten) {
        // For CQ, default select only the first subject
        setSelectedSubjects([distributions[0].subject]);
      } else {
        // For MCQ, default select first 4 core subjects (or all if <= 4)
        const defaultTake = distributions.length > 4 ? 4 : distributions.length;
        setSelectedSubjects(distributions.slice(0, defaultTake).map((d) => d.subject));
      }
      setInitializedSubjects(true);
    }
  }, [distributions, isWritten, initializedSubjects]);

  const toggleSubject = (dist: SubjectDistribution) => {
    if (isWritten) {
      // CQ: Only single subject can be selected
      setSelectedSubjects([dist.subject]);
      setFetchedQuestions([]);
    } else {
      // MCQ: Can select multiple subjects, but must keep at least 1 selected
      if (selectedSubjects.includes(dist.subject)) {
        if (selectedSubjects.length > 1) {
          setSelectedSubjects(selectedSubjects.filter((s) => s !== dist.subject));
          setFetchedQuestions([]);
        } else {
          alert("কমপক্ষে একটি বিষয় নির্বাচন করতে হবে");
        }
      } else {
        setSelectedSubjects([...selectedSubjects, dist.subject]);
        setFetchedQuestions([]);
      }
    }
  };

  // Dynamic calculations
  const selectedDistributions = isBoardOrSchool
    ? distributions.filter((d) => selectedSubjects.includes(d.subject))
    : distributions;

  const calculatedQuestions =
    selectedDistributions.length > 0
      ? selectedDistributions.reduce((sum, d) => sum + d.questionCount, 0)
      : examSet.questionCount;

  const calculatedDuration =
    selectedDistributions.length > 0
      ? selectedDistributions.reduce((sum, d) => sum + d.durationMinutes, 0)
      : examSet.durationMinutes;

  const calculatedMarks =
    selectedDistributions.length > 0
      ? selectedDistributions.reduce((sum, d) => sum + d.totalMarks, 0)
      : (examSet.marks || (isWritten ? 70 : 100));

  const formatText = isWritten
    ? "লিখিত (CQ)"
    : examSet.type === "combined"
    ? "MCQ + লিখিত"
    : isBuet
    ? "প্রিলি (MCQ)"
    : "MCQ";

  const negativeMarkText = !isWritten ? "০.২৫ নম্বর / ভুল" : "নেই";
  const calculatorAllowed =
    instId === "medical" ? "অনুমোদিত নয়" : "অনুমোদিত (Non-prog)";

  const subtitleText = isBoardOrSchool
    ? `${institute.name} • পরীক্ষা সাল: ${examSet.year}`
    : `${institute.name} ভর্তি পরীক্ষা • সেশন: ${examSet.year}`;

  // Helper to ensure questions are loaded
  const loadQuestions = async (): Promise<Question[]> => {
    if (fetchedQuestions.length > 0) return fetchedQuestions;
    setIsLoadingQuestions(true);
    try {
      const qs = await fetchInstituteExamSetQuestions(
        institute.id,
        examSet,
        isBoardOrSchool ? selectedSubjects : undefined
      );
      setFetchedQuestions(qs);
      return qs;
    } catch (err) {
      console.error("Error loading questions:", err);
      return [];
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  // Handler for 'প্রশ্ন দেখো' (Read/Study Mode)
  const handleViewQuestions = async () => {
    const qs = await loadQuestions();
    if (qs.length > 0) {
      setViewMode("read");
    }
  };

  // Handler for 'পরীক্ষা দাও' (Mock Exam Mode)
  const handleStartExam = async () => {
    const qs = await loadQuestions();
    if (onTakeExam) {
      onTakeExam(
        {
          ...examSet,
          questionCount: calculatedQuestions,
          durationMinutes: calculatedDuration,
          marks: calculatedMarks,
        },
        qs
      );
    } else if (typeof window !== "undefined") {
      window.location.href = `/setup?institute=${institute.id}&set=${examSet.id}&duration=${calculatedDuration}&marks=${calculatedMarks}`;
    }
  };

  // If in Read/Practice mode, show the full QuestionViewerPage
  if (viewMode === "read") {
    return (
      <QuestionViewerPage
        institute={institute}
        examSet={examSet}
        questions={fetchedQuestions}
        onBack={() => setViewMode("details")}
        onTakeExam={handleStartExam}
        showHeader={showHeader}
      />
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-5 animate-in fade-in duration-200 relative font-['HindSiliguri',sans-serif]">
      {/* Loading Overlay */}
      {isLoadingQuestions && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#18181B] rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col items-center gap-3 max-w-xs text-center animate-in zoom-in-95">
            <Loader2 size={36} className="text-blue-600 animate-spin" />
            <span className="font-bold text-sm text-neutral-900 dark:text-white">
              প্রশ্নাবলি সাজানো হচ্ছে...
            </span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {institute.name} ({examSet.year}) সেশনের প্রশ্ন লোড হচ্ছে
            </span>
          </div>
        </div>
      )}

      {/* ── Top Bar with Back Button & Centered Title ── */}
      {showHeader && (
        <div className="relative flex items-center justify-center min-h-[44px]">
          <button
            type="button"
            onClick={onBack}
            className="absolute left-0 w-9 h-9 rounded-xl bg-white dark:bg-[#121212] border border-neutral-200/80 dark:border-white/[0.08] flex items-center justify-center text-neutral-800 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shadow-2xs cursor-pointer active:scale-95"
            aria-label="Back"
          >
            <ArrowLeft size={18} strokeWidth={2.2} />
          </button>
          <h1 className="text-[16px] sm:text-lg font-bold text-neutral-900 dark:text-white font-['Anek_Bangla',sans-serif] leading-tight text-center truncate max-w-[70%]">
            {examSet.title}
          </h1>
        </div>
      )}

      {/* ── Header Badge Card ── */}
      <div className="bg-white dark:bg-[#18181B] rounded-[20px] p-4 sm:p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-full bg-white border border-neutral-100 dark:border-neutral-800 p-1.5 shadow-sm flex items-center justify-center shrink-0">
          <img
            src={institute.logo}
            alt={institute.name}
            className="w-full h-full object-contain rounded-full"
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h2 className="text-[17px] sm:text-[19px] font-bold text-neutral-900 dark:text-white font-['Anek_Bangla',sans-serif] truncate">
              {examSet.title}
            </h2>
          </div>
          <p className="text-xs sm:text-[13px] font-medium text-neutral-500 dark:text-neutral-400">
            {subtitleText}
          </p>
        </div>
      </div>

      {/* ── Section: পরীক্ষার তথ্যাবলি (Dynamically updated based on selection) ── */}
      <div className="space-y-2.5">
        <h3 className="font-bold text-base text-neutral-900 dark:text-white font-['Anek_Bangla',sans-serif]">
          পরীক্ষার তথ্যাবলি
        </h3>

        <div className="bg-white dark:bg-[#18181B] rounded-[16px] border border-neutral-200/80 dark:border-neutral-800 p-4 shadow-xs">
          <div className="space-y-3.5">
            {/* Row 1: মোট প্রশ্ন | নির্ধারিত সময় */}
            <div className="grid grid-cols-2 divide-x divide-neutral-200 dark:divide-neutral-800">
              <div className="flex flex-col items-center justify-center text-center pr-2">
                <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                  মোট প্রশ্ন
                </span>
                <span className="text-sm font-bold text-neutral-900 dark:text-white mt-0.5">
                  {BanglaNameHelper.toBanglaNumeral(calculatedQuestions)}টি প্রশ্ন
                </span>
              </div>
              <div className="flex flex-col items-center justify-center text-center pl-2">
                <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                  নির্ধারিত সময়
                </span>
                <span className="text-sm font-bold text-neutral-900 dark:text-white mt-0.5">
                  {formatDurationMinutes(calculatedDuration)}
                </span>
              </div>
            </div>

            <div className="border-t border-neutral-100 dark:border-neutral-800/80" />

            {/* Row 2: পূর্ণমান | নেগেটিভ মার্ক */}
            <div className="grid grid-cols-2 divide-x divide-neutral-200 dark:divide-neutral-800">
              <div className="flex flex-col items-center justify-center text-center pr-2">
                <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                  পূর্ণমান
                </span>
                <span className="text-sm font-bold text-neutral-900 dark:text-white mt-0.5">
                  {BanglaNameHelper.toBanglaNumeral(calculatedMarks)} নম্বর
                </span>
              </div>
              <div className="flex flex-col items-center justify-center text-center pl-2">
                <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                  নেগেটিভ মার্ক
                </span>
                <span className="text-sm font-bold text-neutral-900 dark:text-white mt-0.5">
                  {negativeMarkText}
                </span>
              </div>
            </div>

            <div className="border-t border-neutral-100 dark:border-neutral-800/80" />

            {/* Row 3: পদ্ধতি | ক্যালকুলেটর */}
            <div className="grid grid-cols-2 divide-x divide-neutral-200 dark:divide-neutral-800">
              <div className="flex flex-col items-center justify-center text-center pr-2">
                <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                  পদ্ধতি
                </span>
                <span className="text-sm font-bold text-neutral-900 dark:text-white mt-0.5">
                  {formatText}
                </span>
              </div>
              <div className="flex flex-col items-center justify-center text-center pl-2">
                <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                  ক্যালকুলেটর
                </span>
                <span className="text-sm font-bold text-neutral-900 dark:text-white mt-0.5">
                  {calculatorAllowed}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section Header: SSC = subject select, HSC/Admission = mark distribution ── */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-neutral-900 dark:text-white font-['Anek_Bangla',sans-serif]">
            {isBoardOrSchool
              ? isWritten
                ? "বিষয় নির্বাচন (একটি প্রযোজ্য)"
                : "বিষয় নির্বাচন (একাধিক সম্ভব)"
              : "নম্বর বণ্টন"}
          </h3>

          {/* Badge for SSC selectable mode */}
          {isBoardOrSchool && (
            <div
              className={`px-2.5 py-0.5 rounded-lg border text-xs font-semibold ${
                isWritten
                  ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30"
                  : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
              }`}
            >
              {isWritten
                ? "১টি বিষয়"
                : `${BanglaNameHelper.toBanglaNumeral(selectedSubjects.length)}টি নির্বাচিত`}
            </div>
          )}
        </div>

        {/* ── SSC: 2-column interactive grid | HSC/Admission: static rows ── */}
        {isBoardOrSchool ? (
          <div className="grid grid-cols-2 gap-2">
            {distributions.map((dist, idx) => {
              const isSelected = selectedSubjects.includes(dist.subject);

              return (
                <div
                  key={idx}
                  onClick={() => toggleSubject(dist)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex items-center justify-between gap-2 shadow-2xs ${
                    isSelected
                      ? "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-500/60 dark:border-emerald-500/40"
                      : "bg-white dark:bg-[#18181B] border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-300"
                  }`}
                >
                  <span
                    className={`text-[13px] leading-tight line-clamp-2 ${
                      isSelected
                        ? "font-bold text-neutral-900 dark:text-white"
                        : "font-medium text-neutral-700 dark:text-neutral-300"
                    }`}
                  >
                    {dist.subject}
                  </span>

                  {/* Radio / Checkbox Indicator */}
                  <div
                    className={`w-5 h-5 shrink-0 flex items-center justify-center transition-all ${
                      isWritten ? "rounded-full" : "rounded-[5px]"
                    } ${
                      isSelected
                        ? "bg-[#004633] text-white border border-[#004633]"
                        : "border-1.5 border-neutral-300 dark:border-neutral-600 bg-transparent"
                    }`}
                  >
                    {isSelected && (
                      isWritten ? (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      ) : (
                        <Check size={12} strokeWidth={3} className="text-white" />
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {distributions.map((dist, idx) => {
              const IconComp = dist.icon;
              return (
                <div
                  key={idx}
                  className="bg-white dark:bg-[#18181B] rounded-xl border border-neutral-200/80 dark:border-neutral-800 p-3 sm:px-3.5 flex items-center gap-3 shadow-2xs"
                >
                  <div
                    className={`w-9 h-9 rounded-full ${dist.bgColor} flex items-center justify-center shrink-0`}
                  >
                    <IconComp size={18} className={dist.color} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold text-sm text-neutral-900 dark:text-white block truncate">
                      {dist.subject}
                    </span>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 block truncate">
                      {dist.questions} • {dist.marks}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Fixed Bottom Action Bar: ২ টি বাটন (প্রশ্ন দেখো, পরীক্ষা দাও) ── */}
      <div className="pt-3 pb-3 sticky bottom-0 z-20 bg-white/90 dark:bg-[#000000]/90 backdrop-blur-md border-t border-neutral-200/80 dark:border-neutral-800 -mx-4 px-4 sm:-mx-6 sm:px-6">
        <div className="flex gap-3 max-w-4xl mx-auto">
          {/* Button 1: প্রশ্ন দেখো (View Questions) */}
          <button
            type="button"
            onClick={handleViewQuestions}
            disabled={isLoadingQuestions}
            className="flex-1 h-12 rounded-[14px] bg-transparent border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 font-semibold text-[15px] transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
          >
            <span>প্রশ্ন দেখো</span>
          </button>

          {/* Button 2: পরীক্ষা দাও (Take Exam) */}
          <button
            type="button"
            onClick={handleStartExam}
            disabled={isLoadingQuestions}
            className="flex-1 h-12 rounded-[14px] bg-[#004633] text-white hover:bg-[#003d2c] font-bold text-[15px] transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md active:scale-[0.98] disabled:opacity-50"
          >
            <span>পরীক্ষা দাও</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamSetDetailView;
