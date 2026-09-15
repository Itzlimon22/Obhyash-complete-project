import { Metadata } from 'next';
import PolicyPageShell from '@/components/legal/PolicyPageShell';
import { LEGAL_CONTENT } from '@/lib/constants/legal-content';

export const metadata: Metadata = {
  title: 'Refund Policy | Obhyash',
  description:
    'Read the official Obhyash Refund Policy. Understand our 48-hour satisfaction guarantee, eligibility criteria, and dispute resolution process.',
};

export default function RefundPolicyPage() {
  return <PolicyPageShell document={LEGAL_CONTENT.refund} activeSlug="refund" />;
}
