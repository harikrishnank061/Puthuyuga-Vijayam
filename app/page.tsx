'use client';

import { useState } from 'react';
import { CitizenAuth } from '@/components/citizen-auth';
import { AdminAuth } from '@/components/admin-auth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type UserType = 'citizen' | 'admin' | null;

export default function Home() {
  const [userType, setUserType] = useState<UserType>(null);

  if (userType === 'citizen') {
    return <CitizenAuth />;
  }

  if (userType === 'admin') {
    return <AdminAuth />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-primary mb-4 tracking-tight">
          PUTHUYUGAVIJAYAM
        </h1>
        <p className="text-xl text-muted-foreground mb-2">
          Civic Complaint Management System
        </p>
        <p className="text-lg text-primary font-semibold">
          Rajapalayam, Tamil Nadu
        </p>
      </div>

      <Card className="w-full max-w-2xl p-6 md:p-12 shadow-xl">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold mb-2">Select Your Role</h2>
          <p className="text-muted-foreground">
            Choose how you want to access the system
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Button
            onClick={() => setUserType('citizen')}
            className="h-32 md:h-40 text-lg font-semibold flex flex-col items-center justify-center gap-3 bg-primary hover:bg-primary/90"
          >
            <svg
              className="w-12 h-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            Citizen
            <span className="text-xs font-normal opacity-90">Report Issues</span>
          </Button>

          <Button
            onClick={() => setUserType('admin')}
            className="h-32 md:h-40 text-lg font-semibold flex flex-col items-center justify-center gap-3 bg-secondary hover:bg-secondary/90 text-secondary-foreground"
          >
            <svg
              className="w-12 h-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            Admin
            <span className="text-xs font-normal opacity-90">Manage Complaints</span>
          </Button>
        </div>
      </Card>

      <div className="mt-12 text-center text-sm text-muted-foreground">
        <p>A platform for citizens to report civic issues and</p>
        <p>administrators to manage and resolve them efficiently</p>
      </div>
    </div>
  );
}
