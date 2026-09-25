import { getStudentPageData } from "@/services/student-page-data";
import DashboardClient from "../dashboard/DashboardClient";

export default async function PracticeRoutePage() {
  const { userProfile, subjects, initialHistory } = await getStudentPageData();

  return (
    <DashboardClient
      user={userProfile}
      subjects={subjects}
      initialHistory={initialHistory}
      initialTab="practice"
    />
  );
}
