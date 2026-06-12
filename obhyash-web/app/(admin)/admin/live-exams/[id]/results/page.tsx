import { Metadata } from 'next';
import LiveExamResults from '@/components/admin/features/live-exams/LiveExamResults';

export const metadata: Metadata = {
  title: 'Live Exam Results | Admin',
  description: 'View leaderboard and attempts for a live exam.',
};

export default async function LiveExamResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <LiveExamResults examId={resolvedParams.id} />;
}
