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
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;
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
  statusFilterOrIsAdmin?: ComplaintStatus | 'All' | boolean,
  page: number = 1,
  pageSize: number = 20,
  searchQuery: string = '',
): Promise<any> => {
  // If boolean was passed from legacy callers
  if (typeof statusFilterOrIsAdmin === 'boolean') {
    return getUserComplaints();
  }

  const statusFilter = statusFilterOrIsAdmin as ComplaintStatus | 'All' | undefined;

  if (typeof window !== 'undefined') {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });
      if (statusFilter && statusFilter !== 'All') {
        params.set('status', statusFilter);
      }
      if (searchQuery) {
        params.set('search', searchQuery);
      }

      const res = await fetch(`/api/admin/complaints?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          return {
            complaints: json.data.complaints || [],
            count: json.data.count || 0,
            stats: json.data.stats,
          };
        }
      }
    } catch (e) {
      console.warn('API getComplaints error, falling back:', e);
    }
  }

  if (!isSupabaseConfigured() || !supabase) return { complaints: [], count: 0 };

  try {
    let query = supabase
      .from('app_complaints')
      .select('*', { count: 'exact' });

    if (statusFilter && statusFilter !== 'All') {
      query = query.eq('status', statusFilter);
    }
    if (searchQuery) {
      query = query.ilike('description', `%${searchQuery}%`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    return { complaints: data || [], count: count || 0 };
  } catch (error) {
    console.error('Error fetching complaints:', error);
    return { complaints: [], count: 0 };
  }
};

/**
 * Get current user's submitted complaints
 */
export const getUserComplaints = async (): Promise<AppComplaint[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return [];

    const { data, error } = await supabase
      .from('app_complaints')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user complaints:', error);
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
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/admin/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resolve',
          complaintId,
          feedback,
          status,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          return { success: true };
        }
      }
    } catch (e) {
      console.warn('API resolveComplaint error, falling back:', e);
    }
  }

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
