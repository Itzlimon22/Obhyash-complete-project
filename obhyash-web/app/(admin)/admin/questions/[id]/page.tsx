'use client';

import { useRouter, useParams } from 'next/navigation';
import NewQuestionPage from '../new/page';

// Edit page reuses the New page component
// The page detects edit mode via the URL params
export default function EditQuestionPage() {
  return <NewQuestionPage />;
}
