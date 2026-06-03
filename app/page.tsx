'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CitizenAuth } from '@/components/citizen-auth';
import { AdminAuth } from '@/components/admin-auth';

function HomeContent() {
  const searchParams = useSearchParams();
  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => {
    if (searchParams.get('role') === 'admin') {
      setShowAdmin(true);
    }
  }, [searchParams]);

  if (showAdmin) {
    return <AdminAuth />;
  }

  return <CitizenAuth />;
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center auth-page-bg">
        <div className="text-center">
          <div className="auth-emblem-circle mx-auto mb-4">
            <div className="text-3xl">🏛️</div>
          </div>
          <p className="text-[#6B1D1D] font-bold animate-pulse">Loading...</p>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
