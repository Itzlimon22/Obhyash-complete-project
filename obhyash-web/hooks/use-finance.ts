import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Transaction, SubscriptionPlan } from '@/lib/types';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/error-utils';

interface FinanceStats {
  revenue: number;
  active: number;
  successRate: number | string;
}

export const useFinance = () => {
  const supabase = createClient();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]); // To show list of plans
  const [stats, setStats] = useState<FinanceStats>({
    revenue: 0,
    active: 0,
    successRate: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // --- Fetch All Data ---
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Transactions with User Info
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .select(
          `
          *,
          user:profiles ( full_name, email )
        `,
        )
        .order('date', { ascending: false });

      if (txError) throw txError;

      // 2. Fetch Plans
      const { data: planData, error: planError } = await supabase
        .from('plans')
        .select('*');

      if (planError) throw planError;

      // 3. Map Transactions to UI Model
      interface SupabaseTransaction {
        id: string;
        plan_name: string;
        amount: number;
        status: string;
        date: string;
        invoice_id?: string;
        method: string;
        user?: {
          full_name?: string;
          email?: string;
        };
      }

      const mappedTxs: Transaction[] = (txData || []).map(
        (t: SupabaseTransaction) => ({
          id: t.id,
          user: {
            name: t.user?.full_name || 'Unknown',
            email: t.user?.email || '',
            initial: (t.user?.full_name?.[0] || '?').toUpperCase(),
            color: 'bg-brand-500', // You can randomize this if you want
          },
          plan: t.plan_name,
          amount: t.amount,
          status: (['Completed', 'Pending', 'Failed'].includes(t.status)
            ? t.status
            : 'Pending') as 'Completed' | 'Pending' | 'Failed',
          date: new Date(t.date).toLocaleDateString(),
          invoiceId: t.invoice_id || 'N/A',
          method: t.method,
        }),
      );

      // 4. Calculate Basic Stats (Client-side for now)
      const totalRevenue = mappedTxs.reduce(
        (sum, t) => sum + (t.status === 'Completed' ? Number(t.amount) : 0),
        0,
      );
      const successCount = mappedTxs.filter(
        (t) => t.status === 'Completed',
      ).length;
      const rate =
        mappedTxs.length > 0 ? (successCount / mappedTxs.length) * 100 : 100;

      setTransactions(mappedTxs);
      setPlans(planData as SubscriptionPlan[]);
      setStats({
        revenue: totalRevenue,
        active: mappedTxs.length, // Just a count for demo
        successRate: rate.toFixed(1),
      });
    } catch (error) {
      console.error('Failed to fetch finance data:', error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // --- Create Plan ---
  const createPlan = async (plan: Partial<SubscriptionPlan>) => {
    try {
      const { error } = await supabase.from('plans').insert({
        name: plan.name,
        price: plan.price,
        interval: plan.billingCycle?.toLowerCase() || 'monthly',
        features: plan.features,
        is_recommended: plan.isRecommended,
      });

      if (error) throw error;
      toast.success('Plan created successfully');
      await fetchData(); // Refresh
      return true;
    } catch (error) {
      console.error('Failed to create plan:', error);
      toast.error(getErrorMessage(error));
      return false;
    }
  };

  // Initial Load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    transactions,
    plans,
    stats,
    isLoading,
    createPlan,
    refresh: fetchData,
  };
};
