import {
  AppFeatureRequest,
  FeatureCategory,
  FeatureRequestStatus,
} from '@/lib/types';
import { supabase, isSupabaseConfigured } from './core';

/**
 * Submit a new feature request
 */
export const submitFeatureRequest = async (
  category: FeatureCategory,
  title: string,
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

    const { error } = await supabase.from('app_feature_requests').insert({
      user_id: user.id,
      category,
      title: title.trim(),
      description: description.trim(),
      status: 'Under Review',
    });

    if (error) throw error;
    return { success: true };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('Error submitting feature request:', error);
    return { success: false, error: errorMessage };
  }
};

/**
 * Get current user's submitted feature requests
 */
export const getUserFeatureRequests = async (): Promise<
  AppFeatureRequest[]
> => {
  if (!isSupabaseConfigured() || !supabase) return [];

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return [];

    const { data, error } = await supabase
      .from('app_feature_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user feature requests:', error);
    return [];
  }
};

/**
 * Get feature requests for Admin or Public Roadmap
 */
export const getFeatureRequests = async (
  statusFilter?: FeatureRequestStatus | 'All',
  page: number = 1,
  pageSize: number = 20,
  searchQuery: string = '',
): Promise<{
  featureRequests: AppFeatureRequest[];
  count: number;
  stats?: {
    total: number;
    underReview: number;
    planned: number;
    inProgress: number;
    completed: number;
    declined: number;
  };
}> => {
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

      const res = await fetch(
        `/api/admin/feature-requests?${params.toString()}`,
      );
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          return {
            featureRequests: json.data.featureRequests || [],
            count: json.data.count || 0,
            stats: json.data.stats,
          };
        }
      }
    } catch (e) {
      console.warn('API getFeatureRequests error, falling back to direct DB:', e);
    }
  }

  if (!isSupabaseConfigured() || !supabase) {
    return { featureRequests: [], count: 0 };
  }

  try {
    let query = supabase
      .from('app_feature_requests')
      .select('*', { count: 'exact' });

    if (statusFilter && statusFilter !== 'All') {
      query = query.eq('status', statusFilter);
    }
    if (searchQuery) {
      query = query.or(
        `title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`,
      );
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return { featureRequests: data || [], count: count || 0 };
  } catch (error) {
    console.error('Error fetching feature requests:', error);
    return { featureRequests: [], count: 0 };
  }
};

/**
 * Update feature request status & feedback (Admin only)
 */
export const updateFeatureRequestStatus = async (
  requestId: string,
  status: FeatureRequestStatus,
  feedback?: string,
): Promise<{ success: boolean; error?: string }> => {
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/admin/feature-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateStatus',
          requestId,
          status,
          feedback,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          return { success: true };
        }
      }
    } catch (e) {
      console.warn('API updateFeatureRequestStatus error, falling back:', e);
    }
  }

  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: 'Database not configured' };
  }

  try {
    const { error } = await supabase
      .from('app_feature_requests')
      .update({
        status,
        admin_feedback: feedback,
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (error) throw error;
    return { success: true };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('Error updating feature request status:', error);
    return { success: false, error: errorMessage };
  }
};
