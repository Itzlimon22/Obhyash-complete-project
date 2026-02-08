import { AppComplaint, ComplaintType, ComplaintStatus } from '@/lib/types';
import { supabase, isSupabaseConfigured } from './core';

/**
 * Submit a new complaint
 */
export const submitComplaint = async (
  type: ComplaintType,
  description: string,
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: 'Database not configured' };
  }

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'User not authenticated' };

    const { error } = await supabase.from('app_complaints').insert({
      user_id: user.id,
      type,
      description,
      status: 'Pending',
    });

    if (error) throw error;
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error submitting complaint:', error);
    return { success: false, error: errorMessage };
  }
};

/**
 * Get complaints (Admin only or User's own)
 */
export const getComplaints = async (
  isAdmin: boolean = false,
): Promise<AppComplaint[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];

  try {
    const query = supabase
      .from('app_complaints')
      .select('*')
      .order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching complaints:', error);
    return [];
  }
};

/**
 * Resolve a complaint (Admin only)
 */
export const resolveComplaint = async (
  complaintId: string,
  feedback: string,
  status: ComplaintStatus = 'Resolved',
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: 'Database not configured' };
  }

  try {
    const { error } = await supabase
      .from('app_complaints')
      .update({
        status,
        admin_feedback: feedback,
        updated_at: new Date().toISOString(),
      })
      .eq('id', complaintId);

    if (error) throw error;
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error resolving complaint:', error);
    return { success: false, error: errorMessage };
  }
};
