import { getUserProfile } from '@/services/user-service';
import TeacherProfileView from '@/components/teacher/ui/TeacherProfileView';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'প্রোফাইল | অব‍্যাস শিক্ষক প্যানেল',
  description: 'শিক্ষক প্রোফাইল',
};

export default async function TeacherProfilePage() {
  const user = await getUserProfile('me');

  if (!user || user.role !== 'Teacher') {
    redirect('/login');
  }

  // TODO: Fetch real stats from stats-service
  const stats = {
    totalQuestions: 154,
    approved: 142,
    pending: 8,
    rejected: 4,
  };

  return <TeacherProfileView user={user} stats={stats} />;
}
