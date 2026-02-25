'use client';
import { useEffect, useState } from 'react';
import { Gift } from 'lucide-react';
import Link from 'next/link';

interface ReferralInfo {
  referral?: { code: string } | null;
  history: Array<{
    id: string;
    redeemed_at: string;
    redeemed_by: { email: string; name: string };
  }>;
}

export default function ReferralPage() {
  const [data, setData] = useState<ReferralInfo>({
    referral: null,
    history: [],
  });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetch('/api/referral/me')
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const generateCode = async () => {
    setGenerating(true);
    const res = await fetch('/api/referral/create', { method: 'POST' });
    const json = await res.json();
    setData((prev) => ({ ...prev, referral: json.referral }));
    setGenerating(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
        রেফারেল প্রোগ্রাম
      </h1>

      {/* Referral Code Section */}
      <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-emerald-600" />
            <span className="font-medium text-neutral-800 dark:text-neutral-200">
              আপনার রেফারেল কোড
            </span>
          </div>
          {data.referral?.code ? (
            <div className="flex items-center gap-2">
              <code className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 rounded">
                {data.referral.code}
              </code>
              <button
                onClick={() =>
                  navigator.clipboard.writeText(data.referral!.code)
                }
                className="text-sm text-emerald-600 dark:text-emerald-400 underline"
              >
                কপি করুন
              </button>
            </div>
          ) : (
            <button
              onClick={generateCode}
              disabled={generating}
              className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
            >
              কোড তৈরি করুন
            </button>
          )}
        </div>
      </div>

      {/* History Table */}
      <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800">
        <h2 className="text-lg font-semibold mb-3 text-neutral-800 dark:text-neutral-200">
          রিডিম্পশন ইতিহাস
        </h2>
        {loading ? (
          <p className="text-neutral-500 dark:text-neutral-400">লোড হচ্ছে…</p>
        ) : data.history.length === 0 ? (
          <p className="text-neutral-500 dark:text-neutral-400">
            কোনো রিডিম্পশন নেই।
          </p>
        ) : (
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-neutral-100 dark:bg-neutral-800">
                <th className="px-2 py-1 text-left text-sm font-medium">
                  তারিখ
                </th>
                <th className="px-2 py-1 text-left text-sm font-medium">
                  ব্যবহারকারী
                </th>
              </tr>
            </thead>
            <tbody>
              {data.history.map((h) => (
                <tr
                  key={h.id}
                  className="border-b border-neutral-200 dark:border-neutral-700"
                >
                  <td className="px-2 py-1 text-sm">
                    {new Date(h.redeemed_at).toLocaleDateString('bn-BD')}
                  </td>
                  <td className="px-2 py-1 text-sm">
                    {h.redeemed_by.name || h.redeemed_by.email}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Link
        href="/profile"
        className="inline-block mt-4 text-emerald-600 dark:text-emerald-400 hover:underline"
      >
        ← প্রোফাইলে ফিরে যান
      </Link>
    </div>
  );
}
