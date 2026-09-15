import { Metadata } from 'next';
import PolicyPageShell from '@/components/legal/PolicyPageShell';
import { LEGAL_CONTENT } from '@/lib/constants/legal-content';

export const metadata: Metadata = {
  title: 'Privacy Policy | Obhyash',
  description:
    'Read the official Obhyash Privacy Policy. Learn how we protect student data, uphold user security, and support full account and data deletion rights.',
};

export default function PrivacyPolicyPage() {
  return <PolicyPageShell document={LEGAL_CONTENT.privacy} activeSlug="privacy" />;
}
