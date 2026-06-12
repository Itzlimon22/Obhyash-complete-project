import { Metadata } from 'next';
import LiveExamBuilder from '@/components/admin/features/live-exams/LiveExamBuilder';

export const metadata: Metadata = {
  title: 'Live Exam Builder | Admin',
  description: 'Add and organize questions for a live exam.',
};

export default function LiveExamBuilderPage({ params }: { params: { id: string } }) {
  return <LiveExamBuilder examId={params.id} />;
}
