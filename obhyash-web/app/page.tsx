import LandingPageClient from '@/components/landing/LandingPageClient';

// Middleware redirects authenticated users away from '/' before this page renders,
// so this component is only ever shown to unauthenticated (guest) visitors.
export default function Home() {
  return (
    <main>
      <LandingPageClient />
    </main>
  );
}
