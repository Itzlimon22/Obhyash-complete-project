import { supabase, isSupabaseConfigured } from './core';
import { Report, ReportStatus } from '@/lib/types';
import { extendSubscription } from './subscription-service';
import { toast } from 'sonner';
import { uploadReportImage } from './storage-service';

export interface SubmitReportData {
  questionId: number | string;
  type: string; // ReportReason
  comment: string;
  imageFile?: File;
  /** Pass a pre-uploaded R2 URL to skip the upload step inside submitReport. */
  imageUrl?: string;
  reporterId: string;
  reporterName: string;
}

export const submitReport = async (data: SubmitReportData) => {
  if (!isSupabaseConfigured()) {
    throw new Error('Database not configured');
  }

  try {
    // 1. Resolve image URL — use pre-uploaded URL if provided, otherwise upload now
    let imageUrl: string | null = data.imageUrl ?? null;

    if (!imageUrl && data.imageFile) {
      const { url } = await uploadReportImage(data.imageFile);
      imageUrl = url;
    }

    // 2. Insert Report into DB
    // Handle 'guest' reporterId: set to null if it's 'guest' to avoid UUID error
    const reporterId =
      data.reporterId === 'guest' || !data.reporterId ? null : data.reporterId;

    const { error: insertError } = await supabase.from('reports').insert({
      question_id: data.questionId,
      reporter_id: reporterId,
      reporter_name: data.reporterName,
      reason: data.type,
      description: data.comment,
      image_url: imageUrl,
      status: 'Pending',
      created_at: new Date().toISOString(),
    });

    if (insertError) throw insertError;

    return { success: true };
  } catch (error) {
    console.error('Submit Report Error Details:', error);
    throw error;
  }
};

export const getReports = async (
  statusFilter?: ReportStatus,
  page: number = 1,
  pageSize: number = 20,
  searchQuery: string = '',
): Promise<{ reports: Report[]; count: number }> => {
  try {
    let query = supabase.from('reports').select('*', { count: 'exact' });

    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }

    if (searchQuery) {
      // Allows searching by reporter id or reporting reason
      query = query.or(
        `reporter_id.ilike.%${searchQuery}%,reason.ilike.%${searchQuery}%,reporter_name.ilike.%${searchQuery}%`,
      );
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const reports = data || [];
    if (reports.length === 0) return { reports: [], count: count || 0 };

    // Manually fetch questions to avoid Foreign Key relation errors
    const questionIds = Array.from(
      new Set(reports.map((r: Report) => r.question_id).filter(Boolean)),
    );

    if (questionIds.length > 0) {
      const { data: questionsData } = await supabase
        .from('questions')
        .select(
          'id, question, options, correct_answer_indices, explanation, subject',
        )
        .in('id', questionIds);

      if (questionsData) {
        const questionMap = new Map(
          questionsData.map(
            (q: {
              id: number;
              question: string;
              options: string[];
              correct_answer_indices: number[];
              explanation: string;
              subject: string;
            }) => [q.id, q],
          ),
        );

        // Map questions back to reports
        const mappedReports = reports.map((report: Report) => ({
          ...report,
          question: questionMap.get(Number(report.question_id)) || null,
        })) as unknown as Report[];

        return { reports: mappedReports, count: count || 0 };
      }
    }

    return { reports: reports as unknown as Report[], count: count || 0 };
  } catch (error) {
    console.error('Get Reports Error:', error);
    return { reports: [], count: 0 };
  }
};

export const resolveReport = async (
  reportId: string,
  action: 'Accept' | 'Reject',
  adminComment?: string,
) => {
  try {
    // 1. Update Report Status
    const status: ReportStatus = action === 'Accept' ? 'Resolved' : 'Ignored';
    const { data: report, error: updateError } = await supabase
      .from('reports')
      .update({
        status,
        admin_comment: adminComment,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', reportId)
      .select()
      .single();

    if (updateError) throw updateError;

    // 2. If Accepted, Reward User (+1 Day Subscription)
    if (action === 'Accept' && report) {
      await extendSubscription(report.reporter_id, 1);
      toast.success(
        'রিপোর্ট গ্রহণ করা হয়েছে এবং শিক্ষার্থীকে ১ দিনের সাবস্ক্রিপশন উপহার দেওয়া হয়েছে!',
      );
    } else {
      toast.info('রিপোর্ট বাতিল করা হয়েছে।');
    }

    return { success: true };
  } catch (error) {
    console.error('Resolve Report Error:', error);
    toast.error('রিপোর্ট প্রসেস করতে সমস্যা হয়েছে।');
    throw error;
  }
};

export const getUserReports = async (
  userId: string,
  page: number = 1,
  pageSize: number = 10,
): Promise<Report[]> => {
  if (!userId) return [];
  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error } = await supabase
      .from('reports')
      .select(
        'id, question_id, reporter_id, reporter_name, reason, description, image_url, status, admin_comment, created_at, resolved_at',
      )
      .eq('reporter_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const reports = data || [];
    if (reports.length === 0) return [];

    // Manually fetch questions to avoid Foreign Key relation errors
    const questionIds = Array.from(
      new Set(
        reports
          .map((r: { question_id: unknown }) => r.question_id)
          .filter(Boolean),
      ),
    );

    if (questionIds.length > 0) {
      const { data: questionsData } = await supabase
        .from('questions')
        .select(
          'id, question, options, correct_answer_indices, explanation, subject',
        )
        .in('id', questionIds);

      if (questionsData) {
        const questionMap = new Map(
          questionsData.map((q: { id: unknown }) => [q.id, q]),
        );

        // Map questions back to reports
        return reports.map((report: { question_id: unknown }) => ({
          ...report,
          question: questionMap.get(Number(report.question_id)) || null,
        })) as unknown as Report[];
      }
    }

    return reports as unknown as Report[];
  } catch (error) {
    console.error('Get User Reports Error:', error);
    return [];
  }
};
