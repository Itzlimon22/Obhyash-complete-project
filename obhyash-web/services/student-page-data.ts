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
    redirect('/auth/login');
  }

  const [{ data: dbProfile }, { data: subjectsData }, { data: examResultsData }] = await Promise.all([
    supabase.from('users').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('subjects').select('*').order('sort_order', { ascending: true, nullsFirst: false }),
    supabase
      .from('exam_results')
      .select('id, user_id, subject, subject_label, exam_type, date, score, total_marks, total_questions, correct_count, wrong_count, time_taken, negative_marking, chapters, submission_type')
      .eq('user_id', user.id)
      .neq('submission_type', 'started')
      .order('date', { ascending: false })
      .limit(20),
  ]);

  // If user profile is not completed (e.g. exited from Google onboarding without filling),
  // redirect them to /onboarding to finish setting up their stream and batch.
  const role = (dbProfile?.role || user.user_metadata?.role || '').toLowerCase();
  if (role !== 'admin' && role !== 'teacher') {
    if (!dbProfile || !dbProfile.stream || !dbProfile.batch) {
      redirect('/onboarding');
    }
  }

  // Filter and deduplicate subjects accurately for the user's stream & division
  const rawSubjects = subjectsData || [];
  const userStream = (dbProfile?.stream || dbProfile?.level || dbProfile?.batch || '').toLowerCase();
  const isSscUser = userStream.includes('ssc');
  const userDiv = (dbProfile?.division || dbProfile?.group || '').toLowerCase();

  const seenSubjectNames = new Set<string>();
  const subjects = rawSubjects.filter((s: any) => {
    const sId = (s.id || '').toLowerCase();
    const sName = (s.name || s.name_en || '').toLowerCase();
    const sStream = (s.stream || s.level || '').toLowerCase();
    const sDiv = (s.division || s.group || '').toLowerCase();

    if (sId === 'hsc_math_general') return false;

    // Stream filtering: SSC vs HSC
    if (isSscUser) {
      if (sStream.includes('hsc') && !sStream.includes('ssc')) return false;
      if (sId.startsWith('hsc_') || sId.startsWith('hsc-')) return false;
      if (sName.includes('১ম পত্র') || sName.includes('২য় পত্র') || sName.includes('২য় পত্র')) return false;
    } else {
      // Default to HSC / Admission
      if (sStream.includes('ssc') && !sStream.includes('hsc')) return false;
      if (sId.startsWith('ssc_') || sId.startsWith('ssc-') || sName.startsWith('ssc ')) return false;
      if (sName === 'গণিত' || sName.includes('সাধারণ গণিত') || sId === 'ssc_math') return false;
      if (sName.includes('বাংলাদেশ ও বিশ্বপরিচয়') || sId.includes('bgs')) return false;
    }

    // Division filtering
    if (userDiv.includes('science') || userDiv.includes('বিজ্ঞান')) {
      if (sDiv && sDiv !== 'general' && sDiv !== 'compulsory' && !sDiv.includes('science') && !sDiv.includes('বিজ্ঞান')) {
        return false;
      }
    } else if (userDiv.includes('humanities') || userDiv.includes('arts') || userDiv.includes('মানবিক')) {
      if (sDiv && sDiv !== 'general' && sDiv !== 'compulsory' && !sDiv.includes('humanities') && !sDiv.includes('মানবিক') && !sDiv.includes('arts')) {
        return false;
      }
    } else if (userDiv.includes('business') || userDiv.includes('commerce') || userDiv.includes('ব্যবসায়')) {
      if (sDiv && sDiv !== 'general' && sDiv !== 'compulsory' && !sDiv.includes('business') && !sDiv.includes('commerce') && !sDiv.includes('ব্যবসায়')) {
        return false;
      }
    }

    // Deduplicate by clean subject name
    const cleanName = (s.name || s.name_en || s.id || '').trim();
    if (cleanName && seenSubjectNames.has(cleanName)) return false;
    if (cleanName) seenSubjectNames.add(cleanName);

    return true;
  });

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

