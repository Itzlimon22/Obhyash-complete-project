import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { UserProfile, ExamResult } from '@/lib/types';
import { getSubjectDisplayName } from '@/lib/data/subject-name-map';

export async function getStudentPageData(): Promise<{
  userProfile: UserProfile;
  subjects: any[];
  initialHistory: ExamResult[];
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const [{ data: dbProfile }, { data: subjectsData }, { data: examResultsData }] = await Promise.all([
    supabase.from('users').select('*').eq('id', user.id).single(),
    supabase.from('subjects').select('*').order('sort_order', { ascending: true, nullsFirst: false }),
    supabase
      .from('exam_results')
      .select('*')
      .eq('user_id', user.id)
      .neq('submission_type', 'started')
      .order('date', { ascending: false })
      .limit(100),
  ]);

  const subjects = subjectsData || [];

  const initialHistory: ExamResult[] = (examResultsData || []).map((data: any) => {
    const rawLabel = data.subject_label || data.subject;
    const resolvedLabel =
      rawLabel === data.subject ? getSubjectDisplayName(data.subject) : rawLabel;

    return {
      id: data.id,
      user_id: data.user_id,
      subject: data.subject,
      subjectLabel: resolvedLabel,
      examType: data.exam_type,
      date: data.date,
      score: data.score,
      totalMarks: data.total_marks,
      totalQuestions: data.total_questions,
      correctCount: data.correct_count,
      wrongCount: data.wrong_count,
      timeTaken: data.time_taken,
      negativeMarking: data.negative_marking,
      questions: data.questions,
      userAnswers: data.user_answers,
      flaggedQuestions: data.flagged_questions || [],
      chapters: data.chapters || 'General',
      submissionType: data.submission_type || 'digital',
      scriptImageData: data.script_image_data,
    };
  });

  const userProfile: UserProfile = dbProfile
    ? {
        ...dbProfile,
        streakCount: dbProfile.streak || dbProfile.streak_count || 0,
        lastStreakDate: dbProfile.last_streak_date,
        examsTaken: dbProfile.exams_taken || 0,
        enrolledExams: dbProfile.enrolled_exams || 0,
        avatarUrl: dbProfile.avatar_url,
        avatarColor: dbProfile.avatar_color,
        createdAt: dbProfile.created_at,
        role: dbProfile.role || 'Student',
        status: dbProfile.status || 'Active',
        xp: dbProfile.xp || 0,
        level: dbProfile.level || 'Beginner',
        subscription: dbProfile.subscription || {
          plan: 'Free',
          status: 'Active',
          expiry: '',
        },
        recentExams: initialHistory.slice(0, 10),
      }
    : {
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.full_name || 'Student',
        role: 'Student',
        status: 'Active',
        xp: 0,
        level: 'Beginner',
        examsTaken: 0,
        enrolledExams: 0,
        subscription: { plan: 'Free', status: 'Active', expiry: '' },
        recentExams: [],
      };

  return { userProfile, subjects, initialHistory };
}

