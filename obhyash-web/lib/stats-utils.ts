import { ExamResult, ExamHistory } from '@/lib/types';

export const calculateActivityStats = (
  history: (ExamResult | ExamHistory)[],
) => {
  const days = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'];
  const today = new Date();
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(today.getDate() - (6 - i));
    return {
      date: d.toISOString().split('T')[0],
      name: days[d.getDay()],
      xp: 0,
    };
  });

  history.forEach((exam) => {
    const examDate = new Date(exam.date).toISOString().split('T')[0];
    const dayStat = last7Days.find((d) => d.date === examDate);
    if (dayStat) {
      // Use correctCount if available (ExamResult), otherwise fallback to score (ExamHistory)
      // Assuming score ~ correctCount for ExamHistory approximation
      const points =
        'correctCount' in exam ? exam.correctCount : Math.round(exam.score);
      dayStat.xp += points * 10;
    }
  });

  return last7Days.map(({ name, xp }) => ({ name, xp }));
};

export const calculateRadarData = (history: ExamResult[]) => {
  const subjectStats: Record<string, { total: number; correct: number }> = {};

  history.forEach((exam) => {
    const subject = exam.subjectLabel || exam.subject;
    if (!subjectStats[subject]) {
      subjectStats[subject] = { total: 0, correct: 0 };
    }
    subjectStats[subject].total += exam.totalQuestions;
    subjectStats[subject].correct += exam.correctCount;
  });

  const radarData = Object.entries(subjectStats).map(([subject, stats]) => ({
    subject,
    score:
      stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
    fullMark: 100,
  }));

  if (radarData.length === 0) {
    return [
      { subject: 'Physics', score: 0 },
      { subject: 'Chemistry', score: 0 },
      { subject: 'Math', score: 0 },
      { subject: 'Biology', score: 0 },
      { subject: 'Higher Math', score: 0 },
      { subject: 'ICT', score: 0 },
    ];
  }

  // Sort by score or name? Maybe score descending to show strengths?
  // Or just slice.
  return radarData.slice(0, 6);
};
