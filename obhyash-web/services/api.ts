import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL || '',
  process.env.REACT_APP_SUPABASE_ANON_KEY || '',
);
import {
  User,
  Transaction,
  SubscriptionPlan,
  Question,
  Report,
  Dataset,
  StatData,
  PlanStat,
} from '../lib/types';
import { Users, FileQuestion, Flag } from 'lucide-react';

// ✅ FIXED: Generic Helper to convert snake_case to camelCase
const toCamelCase = <T = unknown>(obj: unknown): T => {
  if (Array.isArray(obj)) {
    return obj.map((i) => toCamelCase<unknown>(i)) as unknown as T;
  }

  if (
    obj !== null &&
    typeof obj === 'object' &&
    (obj as object).constructor === Object
  ) {
    const record = obj as Record<string, unknown>;

    const newObj = Object.keys(record).reduce(
      (result, key) => {
        const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
        result[camelKey] = toCamelCase(record[key]);
        return result;
      },
      {} as Record<string, unknown>,
    );

    return newObj as unknown as T;
  }

  return obj as unknown as T;
};

// Helper to convert camelCase to snake_case (Input is usually typed, so less strict)
const toSnakeCase = (obj: unknown): unknown => {
  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase);
  }

  if (
    obj !== null &&
    typeof obj === 'object' &&
    (obj as object).constructor === Object
  ) {
    const record = obj as Record<string, unknown>;

    return Object.keys(record).reduce(
      (result, key) => {
        const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        result[snakeKey] = toSnakeCase(record[key]);
        return result;
      },
      {} as Record<string, unknown>,
    );
  }

  return obj;
};

export const api = {
  // --- USER OPERATIONS ---
  users: {
    list: async (): Promise<User[]> => {
      const { data, error } = await supabase.from('users').select('*');
      if (error) throw error;
      // ✅ FIXED: Explicitly casting the return type
      return toCamelCase<User[]>(data || []);
    },
    create: async (user: Omit<User, 'id'>): Promise<User> => {
      const { data, error } = await supabase
        .from('users')
        .insert([toSnakeCase(user)])
        .select()
        .single();
      if (error) throw error;
      // ✅ FIXED
      return toCamelCase<User>(data);
    },
    update: async (id: string, updates: Partial<User>): Promise<User> => {
      const { data, error } = await supabase
        .from('users')
        .update(toSnakeCase(updates))
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      // ✅ FIXED
      return toCamelCase<User>(data);
    },
    delete: async (id: string): Promise<void> => {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) throw error;
    },
    deleteBulk: async (ids: string[]): Promise<void> => {
      const { error } = await supabase.from('users').delete().in('id', ids);
      if (error) throw error;
    },
  },

  // --- QUESTION OPERATIONS ---
  questions: {
    list: async (): Promise<Question[]> => {
      const { data, error } = await supabase.from('questions').select('*');
      if (error) throw error;
      // ✅ FIXED
      return toCamelCase<Question[]>(data || []);
    },
    create: async (
      question: Omit<Question, 'id' | 'version' | 'createdAt'>,
    ): Promise<Question> => {
      const payload = {
        ...question,
        version: 1,
        created_at: new Date().toISOString().split('T')[0],
      };
      const { data, error } = await supabase
        .from('questions')
        .insert([toSnakeCase(payload)])
        .select()
        .single();
      if (error) throw error;
      // ✅ FIXED
      return toCamelCase<Question>(data);
    },
    bulkCreate: async (questions: Partial<Question>[]): Promise<void> => {
      const payload = questions.map((q) => ({
        ...q,
        version: 1,
        created_at: new Date().toISOString().split('T')[0],
        status: q.status || 'Pending',
      }));
      const { error } = await supabase
        .from('questions')
        .insert(toSnakeCase(payload));
      if (error) throw error;
    },
    update: async (
      id: string,
      updates: Partial<Question>,
    ): Promise<Question> => {
      const { data, error } = await supabase
        .from('questions')
        .update(toSnakeCase(updates))
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      // ✅ FIXED
      return toCamelCase<Question>(data);
    },
    delete: async (id: string): Promise<void> => {
      const { error } = await supabase.from('questions').delete().eq('id', id);
      if (error) throw error;
    },
  },

  // --- REPORT OPERATIONS ---
  reports: {
    list: async (): Promise<Report[]> => {
      const { data, error } = await supabase
        .from('reports')
        .select('*, question_preview:questions(*)');
      if (error) throw error;
      // ✅ FIXED
      return toCamelCase<Report[]>(data || []);
    },
    resolve: async (reportId: string): Promise<void> => {
      const { error } = await supabase
        .from('reports')
        .update({ status: 'Resolved' })
        .eq('id', reportId);
      if (error) throw error;
    },
    ignore: async (reportId: string): Promise<void> => {
      const { error } = await supabase
        .from('reports')
        .update({ status: 'Ignored' })
        .eq('id', reportId);
      if (error) throw error;
    },
  },

  // --- FINANCE OPERATIONS ---
  finance: {
    getTransactions: async (): Promise<Transaction[]> => {
      const { data, error } = await supabase.from('transactions').select('*');
      if (error) throw error;
      // ✅ FIXED
      return toCamelCase<Transaction[]>(data || []);
    },
    getPlanStats: async (): Promise<PlanStat[]> => {
      const { data, error } = await supabase.from('plan_stats').select('*');
      if (error) throw error;
      // ✅ FIXED
      return toCamelCase<PlanStat[]>(data || []);
    },
    createPlan: async (
      plan: Omit<SubscriptionPlan, 'id'>,
    ): Promise<SubscriptionPlan> => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .insert([toSnakeCase(plan)])
        .select()
        .single();
      if (error) throw error;
      // ✅ FIXED
      return toCamelCase<SubscriptionPlan>(data);
    },
  },

  // --- DASHBOARD OPERATIONS ---
  dashboard: {
    getStats: async (): Promise<StatData[]> => {
      const { count: userCount, error: userError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      const { count: questionCount, error: qError } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true });

      const { count: reportCount, error: rError } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Pending');

      if (userError || qError || rError)
        throw new Error('Failed to fetch stats');

      // No changes needed here as this is manually constructed
      return [
        {
          id: 'total-users',
          title: 'Total Users',
          value: userCount || 0,
          icon: Users,
          trend: { value: 12, isPositive: true },
          colorClass: 'text-brand-500',
          bgClass: 'bg-brand-500/10',
        },
        {
          id: 'total-questions',
          title: 'Active Questions',
          value: questionCount || 0,
          icon: FileQuestion,
          trend: { value: 4, isPositive: true },
          colorClass: 'text-rose-500',
          bgClass: 'bg-rose-500/10',
        },
        {
          id: 'pending-reports',
          title: 'Pending Reports',
          value: reportCount || 0,
          icon: Flag,
          trend: { value: 2, isPositive: false },
          colorClass: 'text-amber-500',
          bgClass: 'bg-amber-500/10',
        },
      ];
    },
  },

  // --- ANALYTICS OPERATIONS ---
  analytics: {
    getGrowthData: async (range: string = '30d') => {
      const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
      const { data, error } = await supabase
        .from('user_growth_daily')
        .select('*')
        .gte(
          'date',
          new Date(Date.now() - days * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
        )
        .order('date', { ascending: true });
      if (error) throw error;
      // ✅ FIXED (Assuming 'any' for now since I don't see a GrowthData type,
      // but 'unknown' works if you add a type later)
      return toCamelCase<unknown[]>(data || []);
    },
    getRevenueData: async (range: string = '30d') => {
      const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
      const { data, error } = await supabase
        .from('revenue_daily')
        .select('*')
        .gte(
          'date',
          new Date(Date.now() - days * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
        )
        .order('date', { ascending: true });
      if (error) throw error;
      // ✅ FIXED
      return toCamelCase<unknown[]>(data || []);
    },
    getDatasets: async (): Promise<Dataset[]> => {
      const { data, error } = await supabase.from('datasets').select('*');
      if (error) throw error;
      // ✅ FIXED
      return toCamelCase<Dataset[]>(data || []);
    },
  },

  // --- SYSTEM OPERATIONS ---
  system: {
    triggerBackup: async () => {
      const { data, error } =
        await supabase.functions.invoke('backup-database');
      if (error) throw error;
      return data;
    },
    seedData: async () => {
      const { data, error } = await supabase.functions.invoke('seed-database');
      if (error) throw error;
      return data;
    },
  },

  // Inside your api object export
  public: {
    getLandingStats: async () => {
      const { data, error } = await supabase.rpc('get_landing_stats');
      if (error) {
        console.error('Failed to fetch landing stats:', error);
        return { totalUsers: 0, totalQuestions: 0, activePlans: 0 };
      }
      return data; // Returns { totalUsers: 123, totalQuestions: 500, ... }
    },
    getPlans: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  },
};
