import { supabase } from './core';
import { Report, ReportStatus, ReportReason } from '@/lib/types';
import { extendSubscription } from './subscription-service';
import { toast } from 'sonner';

const REPORT_BUCKET = 'reports';

export interface SubmitReportData {
  questionId: number | string;
  type: string; // ReportReason
  comment: string;
  imageFile?: File;
  reporterId: string;
  reporterName: string;
}

export const submitReport = async (data: SubmitReportData) => {
  try {
    let imageUrl = null;

    // 1. Upload Image if exists
    if (data.imageFile) {
      const fileExt = data.imageFile.name.split('.').pop();
      const fileName = `${data.reporterId}_${Date.now()}.${fileExt}`;
      const config = {
        cacheControl: '3600',
        upsert: false,
      };

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from(REPORT_BUCKET)
        .upload(fileName, data.imageFile, config);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from(REPORT_BUCKET)
        .getPublicUrl(fileName);

      imageUrl = publicUrlData.publicUrl;
    }

    // 2. Insert Report into DB
    const { error: insertError } = await supabase.from('reports').insert({
      question_id: data.questionId,
      reporter_id: data.reporterId,
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
    console.error('Submit Report Error:', error);
    throw error;
  }
};

export const getReports = async (statusFilter?: ReportStatus) => {
  try {
    let query = supabase
      .from('reports')
      .select(
        `
        *,
        question:questions!question_id (
          id,
          question,
          options,
          correct_answer,
          explanation
        )
      `,
      )
      .order('created_at', { ascending: false });

    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Get Reports Error:', error);
    return [];
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

export const getUserReports = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select(
        `
        *,
        question:questions!question_id (
          id,
          question,
          options,
          correct_answer,
          explanation
        )
      `,
      )
      .eq('reporter_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Get User Reports Error:', error);
    return [];
  }
};
