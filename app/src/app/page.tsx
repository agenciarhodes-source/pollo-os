'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useSession } from '@/demo/session';

export default function Home() {
  const s = useSession();
  const router = useRouter();
  useEffect(() => {
    if (!s.ready) return;
    router.replace(!s.profile ? '/login' : !s.company ? '/empresa' : '/ceo');
  }, [s.ready, s.profile, s.company, router]);
  return null;
}
