import { redirect } from 'next/navigation';

// Legacy listing form; the live 3-step form is at /sell.
export default function NewListingPage() {
  redirect('/sell');
}
