import React, { useEffect, useState } from 'react';

const EMAIL_TEMPLATES = [
  {
    id: 'welcome',
    name: 'Welcome Message',
    subject: 'Welcome to Obhyash! 🚀',
    body: 'Hi there,\n\nWelcome to Obhyash! We are excited to have you on board. Start your journey by taking your first model test today.\n\nBest,\nThe Obhyash Team',
  },
  {
    id: 'exam_reminder',
    name: 'Exam Reminder',
    subject: 'Reminder: Your Upcoming Exam 📝',
    body: 'Hello,\n\nThis is a friendly reminder that you have an upcoming exam scheduled. Please make sure to prepare well.\n\nGood luck!',
  },
  {
    id: 'inactive_warning',
    name: 'Inactivity Warning',
    subject: 'We miss you! Come back soon 👋',
    body: "Hi,\n\nWe noticed you haven't been active lately. We have added new features and exams that might interest you.\n\nLog in today to continue your progress!",
  },
  {
    id: 'subscription_alert',
    name: 'Subscription Expiry',
    subject: 'Action Required: Subscription Expiring Soon ⚠️',
    body: 'Dear Student,\n\nYour subscription is expiring soon. Please renew to continue accessing premium features without interruption.\n\nThank you.',
  },
];

interface EmailTemplateSelectorProps {
  onSelect: (template: { subject: string; body: string }) => void;
}

export default function EmailTemplateSelector({
  onSelect,
}: EmailTemplateSelectorProps) {
  const [selectedId, setSelectedId] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedId(id);
    const template = EMAIL_TEMPLATES.find((t) => t.id === id);
    if (template) {
      onSelect({ subject: template.subject, body: template.body });
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
        Load Template
      </label>
      <select
        value={selectedId}
        onChange={handleChange}
        className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-700 dark:text-neutral-300 outline-none focus:ring-2 focus:ring-emerald-500"
      >
        <option value="">Select a template to auto-fill...</option>
        {EMAIL_TEMPLATES.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
    </div>
  );
}
