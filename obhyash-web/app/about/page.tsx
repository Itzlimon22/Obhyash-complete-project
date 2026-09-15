import { Metadata } from 'next';
import PolicyPageShell from '@/components/legal/PolicyPageShell';
import { LEGAL_CONTENT } from '@/lib/constants/legal-content';

export const metadata: Metadata = {
  title: 'About Us | Obhyash',
  description:
    'Learn about Obhyash, the AI-powered smart examination and practice platform for HSC, SSC, and admission students in Bangladesh.',
};

export default function AboutPage() {
  return <PolicyPageShell document={LEGAL_CONTENT.about} activeSlug="about" />;
}
