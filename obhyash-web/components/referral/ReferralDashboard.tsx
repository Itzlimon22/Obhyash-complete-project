import React, { useEffect, useState } from 'react';
import styles from './ReferralDashboard.module.css';

interface ReferralInfo {
  referral: {
    code: string;
    created_at: string;
  } | null;
  history: Array<{
    id: string;
    redeemed_at: string;
    redeemed_by: { name: string; email: string };
    admin_status: string;
  }>;
  totalApproved: number;
  scratchCards: Array<{
    id: string;
    is_scratched: boolean;
    reward_type?: string;
  }>;
}

import { ScratchCardWeb } from './ScratchCardWeb';
import { ReferralLeaderboardWeb } from './ReferralLeaderboardWeb';

export const ReferralDashboard: React.FC = () => {
  const [data, setData] = useState<ReferralInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/referral/me');
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error('Failed to load referral data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const copyCode = async () => {
    if (data?.referral?.code) {
      try {
        await navigator.clipboard.writeText(data.referral.code);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (e) {
        console.error('Copy failed', e);
      }
    }
  };

  const shareReferral = async () => {
    if (!navigator.share || !data?.referral?.code) return;
    try {
      await navigator.share({
        title: 'Join the platform with my referral!',
        text: `Use my referral code ${data.referral.code} to get a free month of premium.`,
        url: window.location.origin,
      });
    } catch (e) {
      console.error('Share failed', e);
    }
  };

  if (loading) {
    return <div className={styles.loader}>Loading…</div>;
  }

  return (
    <section className={styles.dashboard}>
      <h1 className={styles.title}>আপনার রেফারেল ড্যাশবোর্ড</h1>
      {data?.referral ? (
        <div className={styles.codeBox}>
          <p className={styles.label}>আপনার কোড</p>
          <div className={styles.codeContainer}>
            <span className={styles.code}>{data.referral.code}</span>
            <button className={styles.copyBtn} onClick={copyCode}>
              {copySuccess ? 'কপি হয়েছে' : 'কপি'}
            </button>
            <button className={styles.shareBtn} onClick={shareReferral}>
              শেয়ার করো
            </button>
          </div>
        </div>
      ) : (
        <p className={styles.noCode}>আপনি এখনও কোনো রেফারেল কোড তৈরি করেননি।</p>
      )}

      {data?.referral && (
        <>
          {/* Gamification Progress Section */}
          <div className="mt-8 bg-white dark:bg-[#121212] p-6 rounded-2xl border border-neutral-200 dark:border-[#2b2b2b]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold font-anek text-slate-900 dark:text-slate-100">
                স্ক্র্যাচ কার্ড প্রগ্রেস
              </h2>
              <div className="px-3 py-1 bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 rounded-full font-bold font-anek">
                {data.totalApproved || 0} / {Math.max((((data.totalApproved || 0) / 3) | 0) + 1, 1) * 3}
              </div>
            </div>
            
            <div className="h-3 w-full bg-slate-100 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-yellow-500 transition-all duration-500"
                style={{ width: `${(((data.totalApproved || 0) % 3) / 3) * 100}%` }}
              />
            </div>
            <p className="mt-3 text-sm text-slate-500 font-anek">
              {3 - ((data.totalApproved || 0) % 3) === 3 && (data.totalApproved || 0) > 0
                ? 'অভিনন্দন! আপনি একটি নতুন স্ক্র্যাচ কার্ড পেয়েছেন!'
                : `আর মাত্র ${3 - ((data.totalApproved || 0) % 3)} টি সফল রেফারেল করলে পাবেন একটি স্ক্র্যাচ কার্ড!`}
            </p>
          </div>

          {/* Scratch Cards Section */}
          {data.scratchCards?.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-bold font-anek text-slate-900 dark:text-slate-100 mb-4">
                আপনার স্ক্র্যাচ কার্ডসমূহ
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {data.scratchCards.map((card) => (
                  <ScratchCardWeb 
                    key={card.id} 
                    card={card} 
                    onRevealed={() => fetchData()} 
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <ReferralLeaderboardWeb />

      <h2 className={styles.subTitle}>ইতিহাস</h2>
      {data?.history?.length ? (
        <ul className={styles.historyList}>
          {data.history.map((h) => (
            <li key={h.id} className={styles.historyItem}>
              <div>
                <strong>{h.redeemed_by.name || 'অজানা'}</strong> (
                {h.redeemed_by.email})
              </div>
              <div>{new Date(h.redeemed_at).toLocaleDateString()}</div>
              <div className={styles.status}>Status: {h.admin_status}</div>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.noHistory}>কোনো রিডেম্পশন নেই।</p>
      )}
    </section>
  );
};
