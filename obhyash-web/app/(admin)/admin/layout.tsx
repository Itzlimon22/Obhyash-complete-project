import ClientLayout from '@/components/admin/layout/ClientLayout';
import { Suspense } from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <ClientLayout>{children}</ClientLayout>
    </Suspense>
  );
}
