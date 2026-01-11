'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check local storage for onboarding status
    const onboardingComplete = localStorage.getItem('framgen_onboarded');
    if (onboardingComplete) {
      router.push('/dashboard');
    } else {
      router.push('/onboarding');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse">Loading Framgen...</div>
    </div>
  );
}
