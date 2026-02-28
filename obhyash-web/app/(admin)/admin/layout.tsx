import ClientLayout from '@/components/admin/layout/ClientLayout';
import { Suspense } from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClientLayout>
      <Suspense fallback={null}>{children}</Suspense>
    </ClientLayout>
  );
}
