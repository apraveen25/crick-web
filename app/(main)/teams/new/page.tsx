'use client';

import { useRouter } from 'next/navigation';
import { redirect } from 'next/navigation';

export default function NewTeamPage() {
  redirect('/teams');
}
