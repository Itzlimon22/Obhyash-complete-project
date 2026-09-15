import { Metadata } from 'next';
import PolicyPageShell from '@/components/legal/PolicyPageShell';
import { LEGAL_CONTENT } from '@/lib/constants/legal-content';

export const metadata: Metadata = {
  title: 'Terms & Conditions | Obhyash',
  description:
    'Read the official Terms and Conditions of Obhyash. Understand your rights, acceptable use policies, and subscription guidelines.',
};

export default function TermsAndConditionsPage() {
  return <PolicyPageShell document={LEGAL_CONTENT.terms} activeSlug="terms" />;
}
