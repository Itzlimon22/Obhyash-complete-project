import { getStudentPageData } from '@/services/student-page-data';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const { userProfile, subjects, initialHistory } = await getStudentPageData();
  return (
    <DashboardClient
      user={userProfile}
      subjects={subjects}
      initialHistory={initialHistory}
    />
  );
}

