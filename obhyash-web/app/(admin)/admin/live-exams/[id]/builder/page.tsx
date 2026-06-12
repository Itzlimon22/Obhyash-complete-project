import { Metadata } from 'next';
import LiveExamBuilder from '@/components/admin/features/live-exams/LiveExamBuilder';

export const metadata: Metadata = {
  title: 'Live Exam Builder | Admin',
  description: 'Add and organize questions for a live exam.',
};

export default async function LiveExamBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <LiveExamBuilder examId={resolvedParams.id} />;
}
