'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAdminLoggedIn, isLoadingAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoadingAdmin && !isAdminLoggedIn) {
      router.push('/admin');
    }
  }, [isAdminLoggedIn, isLoadingAdmin, router]);

  if (isLoadingAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdminLoggedIn) {
    return null;
  }

  return <>{children}</>;
}
