import React from 'react';
import styles from './ReferralHistory.module.css';

interface HistoryItem {
  id: string;
  redeemed_at: string;
  redeemed_by: { name: string; email: string };
  admin_status: string;
}

interface ReferralHistoryProps {
  history: HistoryItem[];
}

export const ReferralHistory: React.FC<ReferralHistoryProps> = ({
  history,
}) => {
  if (!history || history.length === 0) {
    return <p className={styles.empty}>কোনো রিডেম্পশন নেই।</p>;
  }

  return (
    <div className={styles.historyContainer}>
      {/* Desktop Table */}
      <table className={styles.table}>
        <thead>
          <tr>
            <th>নাম</th>
            <th>ইমেইল</th>
            <th>তারিখ</th>
            <th>স্ট্যাটাস</th>
          </tr>
        </thead>
        <tbody>
          {history.map((h) => (
            <tr key={h.id} className={styles.row}>
              <td>{h.redeemed_by.name || 'অজানা'}</td>
              <td>{h.redeemed_by.email}</td>
              <td>{new Date(h.redeemed_at).toLocaleDateString()}</td>
              <td className={styles.status}>{h.admin_status}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile Card List */}
      <div className={styles.cardList}>
        {history.map((h) => (
          <div key={h.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.name}>
                {h.redeemed_by.name || 'অজানা'}
              </span>
              <span className={styles.statusBadge}>{h.admin_status}</span>
            </div>
            <div className={styles.cardBody}>
              <p className={styles.email}>{h.redeemed_by.email}</p>
              <p className={styles.date}>
                তারিখ: {new Date(h.redeemed_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
