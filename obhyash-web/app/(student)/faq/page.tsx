import { getStudentPageData } from '@/services/student-page-data';
import DashboardClient from '../dashboard/DashboardClient';

export default async function FaqRoutePage() {
  const { userProfile, subjects } = await getStudentPageData();
  return (
    <DashboardClient
      user={userProfile}
      subjects={subjects}
      initialTab="faq"
    />
  );
}
