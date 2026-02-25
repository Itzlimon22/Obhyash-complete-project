'use client';
import { useEffect, useState } from 'react';
import { Gift, Edit2, Check, X } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

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

  const [isEditing, setIsEditing] = useState(false);
  const [customCodeInput, setCustomCodeInput] = useState('');

  const generateCode = async (customCode?: string) => {
    setGenerating(true);
    try {
      const res = await fetch('/api/referral/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: customCode ? JSON.stringify({ customCode }) : undefined,
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Failed to update code');
      }

      setData((prev) => ({ ...prev, referral: json.referral }));
      if (customCode) {
        toast.success('কাস্টম কোড সফলভাবে সেট করা হয়েছে!');
        setIsEditing(false);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setGenerating(false);
    }
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
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customCodeInput}
                    onChange={(e) =>
                      setCustomCodeInput(e.target.value.toUpperCase())
                    }
                    className="px-2 py-1 text-sm border rounded dark:bg-neutral-800 dark:border-neutral-700 outline-none w-32"
                    placeholder="CUSTOM_123"
                  />
                  <button
                    onClick={() => generateCode(customCodeInput)}
                    disabled={generating || !customCodeInput}
                    className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded"
                    title="সেভ করুন"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <>
                  <code className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 rounded">
                    {data.referral.code}
                  </code>
                  <button
                    onClick={() => {
                      setCustomCodeInput(data.referral!.code);
                      setIsEditing(true);
                    }}
                    className="p-1 text-neutral-500 hover:text-emerald-600 transition"
                    title="কাস্টম কোড"
                  >
                    <Edit2 size={14} />
                  </button>
                  <div className="flex gap-3 ml-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(data.referral!.code);
                        toast.success('কোড কপি করা হয়েছে!');
                      }}
                      className="text-sm text-emerald-600 dark:text-emerald-400 underline hover:text-emerald-700 transition"
                    >
                      কোড কপি
                    </button>
                    <button
                      onClick={() => {
                        const link = `${window.location.origin}/signup?ref=${data.referral!.code}`;
                        navigator.clipboard.writeText(link);
                        toast.success('রেফারেল লিংক কপি করা হয়েছে!');
                      }}
                      className="text-sm text-emerald-600 dark:text-emerald-400 underline hover:text-emerald-700 transition"
                    >
                      লিংক কপি
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customCodeInput}
                onChange={(e) =>
                  setCustomCodeInput(
                    e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''),
                  )
                }
                className="px-3 py-2 text-sm border rounded dark:bg-neutral-800 dark:border-neutral-700 outline-none w-40"
                placeholder="নিজের কোড দিন"
                maxLength={20}
              />
              <button
                onClick={() => {
                  if (customCodeInput.length < 4) {
                    toast.error('কোড কমপক্ষে ৪ অক্ষরের হতে হবে');
                    return;
                  }
                  generateCode(customCodeInput);
                }}
                disabled={generating || customCodeInput.length < 4}
                className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition disabled:opacity-50"
              >
                সেভ করুন
              </button>
              <button
                onClick={() => generateCode()}
                disabled={generating}
                className="px-4 py-2 bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 rounded hover:bg-neutral-300 dark:hover:bg-neutral-700 transition disabled:opacity-50"
                title="অটো জেনারেট করুন"
              >
                অটো
              </button>
            </div>
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
                    {h.redeemed_by?.name || h.redeemed_by?.email || 'অজানা'}
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
