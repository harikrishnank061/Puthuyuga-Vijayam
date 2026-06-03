'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function CitizenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentCitizen, isLoadingCitizen } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoadingCitizen && !currentCitizen) {
      router.push('/');
    }
  }, [currentCitizen, isLoadingCitizen, router]);

  if (isLoadingCitizen) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentCitizen) {
    return null;
  }

  return <>{children}</>;
}
