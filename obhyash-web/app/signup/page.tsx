import { redirect } from 'next/navigation';

export default async function SignupPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = searchParams ? await searchParams : {};
  const qs = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (typeof v === 'string') qs.set(k, v);
    });
  }
  const query = qs.toString();
  redirect(`/auth/register${query ? `?${query}` : ''}`);
}
