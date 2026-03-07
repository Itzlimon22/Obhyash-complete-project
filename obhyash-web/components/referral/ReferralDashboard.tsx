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
}

export const ReferralDashboard: React.FC = () => {
  const [data, setData] = useState<ReferralInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
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
