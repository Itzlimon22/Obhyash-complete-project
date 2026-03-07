
import React from 'react';
import { Invoice } from '@/lib/types';

interface BillingHistoryProps {
  invoices: Invoice[];
  onDownload: (invoice: Invoice) => void;
}

const BillingHistory: React.FC<BillingHistoryProps> = ({ invoices, onDownload }) => {
  
  // Helper for status badge
  const getStatusBadge = (status: Invoice['status']) => {
      switch(status) {
          case 'paid': return <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded text-xs font-bold capitalize">Paid</span>;
          case 'pending': return <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded text-xs font-bold capitalize">Pending</span>;
          case 'failed': return <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded text-xs font-bold capitalize">Failed</span>;
      }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">বিলিং ইতিহাস</h3>
            {/* SUPABASE: This could trigger a PDF export of all invoices */}
            <button className="text-sm text-emerald-600 dark:text-emerald-400 font-bold hover:underline">
                সব ডাউনলোড করো
            </button>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                        <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">ইনভয়েস #</th>
                        <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">প্ল্যাও</th>
                        <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">তারিখ</th>
                        <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">অ্যামাউন্ট</th>
                        <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">স্ট্যাটাস</th>
                        <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300 text-right">রিসিপ্ট</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {invoices.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                                কোনো বিলিং ইতিহাস পাওয়া যায়নি
                            </td>
                        </tr>
                    ) : (
                        invoices.map((inv) => (
                            <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                <td className="px-6 py-4 font-mono text-slate-500 dark:text-slate-400">{inv.id}</td>
                                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{inv.planName}</td>
                                <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{inv.date}</td>
                                <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{inv.currency} {inv.amount}</td>
                                <td className="px-6 py-4">{getStatusBadge(inv.status)}</td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                        onClick={() => onDownload(inv)}
                                        className="text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                                        title="ডাউনলোড"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 ml-auto">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    </div>
  );
};

export default BillingHistory;
