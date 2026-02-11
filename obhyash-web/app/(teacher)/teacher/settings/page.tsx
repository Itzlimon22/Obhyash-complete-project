import { getUserProfile } from '@/services/user-service';
import TeacherSettingsView from '@/components/teacher/ui/TeacherSettingsView';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'সেটিংস | অব‍্যাস শিক্ষক প্যানেল',
  description: 'শিক্ষক অ্যাকাউন্ট সেটিংস',
};

export default async function TeacherSettingsPage() {
  const user = await getUserProfile('me');

  if (!user || user.role !== 'Teacher') {
    redirect('/login');
  }

  return <TeacherSettingsView user={user} />;
}
