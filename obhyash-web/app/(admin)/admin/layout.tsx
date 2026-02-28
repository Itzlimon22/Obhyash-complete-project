import React from 'react';
import ClientLayout from '@/components/admin/layout/ClientLayout';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClientLayout>{children}</ClientLayout>;
}
