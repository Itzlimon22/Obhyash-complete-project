import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Report, Question, ReportStatus } from '@/lib/types';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/error-utils';

interface ReportRow {
  id: string;
  question_id: string;
  reporter_name?: string;
  reason: string;
  description: string;
  status: string;
  severity?: string;
  created_at: string;
  questions?: Question;
}

export const useReports = () => {
  const supabase = createClient();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ pending: 0, highSeverity: 0 });

  // --- Fetch Data ---
  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(
          `*, questions:question_id ( content, subject, id, explanation )`,
        )
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Map to safe types
      const mappedReports: Report[] = data.map((r: ReportRow) => ({
        id: r.id,
        questionId: r.question_id,
        reporterName: r.reporter_name || 'Anonymous',
        reason: r.reason as Report['reason'],
        description: r.description,
        status: r.status as ReportStatus,
        severity: (r.severity || 'Low') as 'Low' | 'Medium' | 'High',
        createdAt: new Date(r.created_at).toLocaleDateString(),
        questionPreview: r.questions
          ? {
              ...r.questions,
              // Ensure we have fallback if content is missing
              content: r.questions.question || 'Content unavailable',
            }
          : ({ question: 'Question deleted', id: 'deleted' } as Question),
      }));

      setReports(mappedReports);

      // Calculate Stats
      setStats({
        pending: mappedReports.filter((r) => r.status === 'Pending').length,
        highSeverity: mappedReports.filter(
          (r) => r.status === 'Pending' && r.severity === 'High',
        ).length,
      });
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // --- Actions ---

  const resolveReport = async (
    action: 'fix' | 'ignore' | 'delete',
    reportId: string,
    questionId: string,
    updatedData?: Partial<Question>,
  ) => {
    try {
      if (action === 'fix' && updatedData) {
        // 1. Update Question
        const { error: qError } = await supabase
          .from('questions')
          .update({
            content: updatedData.question,
            explanation: updatedData.explanation,
          })
          .eq('id', questionId);
        if (qError) throw qError;

        // 2. Resolve Report
        await supabase
          .from('reports')
          .update({ status: 'Resolved' })
          .eq('id', reportId);
        toast.success('Question fixed & report resolved');
      } else if (action === 'ignore') {
        await supabase
          .from('reports')
          .update({ status: 'Ignored' })
          .eq('id', reportId);
        toast.info('Report ignored');
      } else if (action === 'delete') {
        // Delete question (Report cascades or we update it manually)
        await supabase.from('questions').delete().eq('id', questionId);
        await supabase
          .from('reports')
          .update({ status: 'Resolved' })
          .eq('id', reportId);
        toast.success('Question deleted');
      }

      await fetchReports(); // Refresh
      return true;
    } catch (error) {
      console.error('Action failed:', error);
      toast.error(getErrorMessage(error));
      return false;
    }
  };

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return { reports, stats, isLoading, resolveReport, refresh: fetchReports };
};
