import { getStudentPageData } from '@/services/student-page-data';
import DashboardClient from '../dashboard/DashboardClient';

export default async function AccountLinkingRoutePage() {
  const { userProfile, subjects } = await getStudentPageData();
  return (
    <DashboardClient
      user={userProfile}
      subjects={subjects}
      initialTab="account-linking"
    />
  );
}
