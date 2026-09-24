import { redirect } from 'next/navigation';

export default function AffiliateRegisterRedirect() {
  redirect('/affiliate/auth/register');
}
