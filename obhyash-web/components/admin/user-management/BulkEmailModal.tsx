import React, { useState } from 'react';
import { X, Mail, Send, AlertCircle } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import EmailTemplateSelector from '@/components/admin/user-management/EmailTemplateSelector';

interface BulkEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  userIds: string[];
  onSuccess: () => void;
}

export default function BulkEmailModal({
  isOpen,
  onClose,
  selectedCount,
  userIds,
  onSuccess,
}: BulkEmailModalProps) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      toast.error('Please fill in both subject and message body');
      return;
    }

    setSending(true);
    const supabase = createClient();

    try {
      // In a real app, you might batch this or call an Edge Log/function
      // using the email_notifications table as a queue
      const notifications = userIds.map((userId) => ({
        user_id: userId,
        recipient_email: 'placeholder@example.com', // In real implementation, need to fetch emails or join
        subject,
        body,
        status: 'pending',
        created_at: new Date().toISOString(),
      }));

      // For this implementation, we will assume we call a backend function
      // or simply insert into notifications if that triggers a mailer.
      // Since we don't have the emails in `userIds`, we would typically
      // fetch them first or trust the backend to look them up.
      // Let's mimic the action by inserting a record for each user into email_notifications
      // Note: We need to acknowledge we might not have the email address here directly
      // if not passed. `page.tsx` should probably pass objects or we fetch.
      // But for bulk, usually an RPC function is better.
      // We will assume an RPC function `send_bulk_email` or insert to a queue.
      // Let's try inserting to `email_notifications` using a best-effort approach
      // essentially queueing them.

      // However, we don't have emails here. Let's create a queue-like wrapper
      // or assume we use the user_id to look it up on the server side.
      // Since we can't easily change the backend logic right now,
      // I will implement a client-side loop for now (not ideal for huge lists but works for small-medium)
      // OR better: Just call a single RPC if it existed.
      // I'll opt to fetch emails then insert.

      type User = { id: string; email: string };

      const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, email')
        .in('id', userIds);

      if (userError) throw userError;

      if (!users || users.length === 0) {
        throw new Error('No valid users found for email');
      }

      const { error: insertError } = await supabase
        .from('email_notifications')
        .insert(
          (users as User[]).map((u: User) => ({
            user_id: u.id,
            recipient_email: u.email,
            subject,
            body,
            status: 'pending', // pending for a background worker to pick up
          })),
        );

      if (insertError) throw insertError;

      toast.success(`Queued emails for ${users.length} users`);
      setSubject('');
      setBody('');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to send bulk emails:', error);
      toast.error('Failed to queue emails. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-neutral-900 rounded-t-2xl sm:rounded-2xl rounded-b-none sm:rounded-b-2xl animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 w-full max-w-lg shadow-xl border border-neutral-200 dark:border-neutral-800">
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-emerald-500" />
              Send Bulk Email
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Sending to{' '}
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {selectedCount}
              </span>{' '}
              selected users
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors text-neutral-500 dark:text-neutral-400"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <EmailTemplateSelector
            onSelect={(template) => {
              setSubject(template.subject);
              setBody(template.body);
            }}
          />

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Important Announcement"
              className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              Message Body
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              placeholder="Type your message here..."
              className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none"
            />
          </div>

          <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5" />
            <p className="text-xs text-red-700 dark:text-red-300">
              Emails will be queued for sending. Large batches may take some
              time to process completely.
            </p>
          </div>
        </div>

        <div className="p-6 border-t border-neutral-200 dark:border-neutral-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !subject || !body}
            className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send size={16} />
                <span>Send Emails</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
