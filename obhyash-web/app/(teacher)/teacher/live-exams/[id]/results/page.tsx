import { Metadata } from 'next';
import LiveExamResults from '@/components/admin/features/live-exams/LiveExamResults';

export const metadata: Metadata = {
  title: 'Live Exam Leaderboard | Admin',
  description: 'View leaderboard and results for a live exam.',
};

export default function LiveExamResultsPage({ params }: { params: { id: string } }) {
  return <LiveExamResults examId={params.id} />;
}
