'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle2, ShieldAlert, Building2, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DeleteAccountPage() {
  const router = useRouter();
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // 1. Authenticate user
      const loginRes = await fetch('/api/auth/citizen/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNumber, password }),
      });

      const loginData = await loginRes.json();

      if (!loginRes.ok) {
        throw new Error(loginData.error || 'Authentication failed. Please check your credentials.');
      }

      const userId = loginData.id;

      // 2. Perform account deletion
      const deleteRes = await fetch(`/api/citizens?id=${userId}`, {
        method: 'DELETE',
      });

      const deleteData = await deleteRes.json();

      if (!deleteRes.ok) {
        throw new Error(deleteData.error || 'Failed to delete account.');
      }

      setSuccess(true);
      setMobileNumber('');
      setPassword('');
      
      // Clear localStorage or cookies if any login session is active in browser
      if (typeof window !== 'undefined') {
        localStorage.removeItem('citizenUser');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col auth-page-bg py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md mx-auto space-y-6">
        
        {/* Navigation / Header Bar */}
        <div className="flex justify-between items-center bg-white/90 backdrop-blur-md shadow-md border-b-4 border-[#C31F26] p-4 rounded-xl">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-[#F2D409] to-[#D4A017] rounded-full flex items-center justify-center border border-[#C31F26] shadow-sm">
              <Building2 className="h-4 w-4 text-[#C31F26]" />
            </div>
            <span className="font-bold text-lg text-[#C31F26]" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
              புதுயுக விஜயம்
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/')}
            className="flex items-center gap-1.5 font-semibold text-xs border-[#C31F26]/30 text-[#C31F26] hover:bg-[#C31F26]/10"
          >
            <ArrowLeft className="h-4 w-4" /> Home
          </Button>
        </div>

        {/* Delete Form Card */}
        <Card className="shadow-2xl border-[#C31F26]/15 rounded-2xl overflow-hidden bg-white">
          <CardHeader className="bg-gradient-to-r from-[#FDF5E6] to-[#FAE9C8] px-6 py-5 border-b border-[#C31F26]/10 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-3">
              <ShieldAlert className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl font-bold text-red-700">
              Account Deletion Portal
            </CardTitle>
            <CardDescription className="text-sm text-[#5C2B2B] mt-1">
              Puthuyuga Vijayam Civic Complaint Management System
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 sm:p-8 space-y-6">
            
            {success ? (
              <div className="space-y-4 text-center py-4">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-2">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-950">Account Successfully Deleted</h3>
                <p className="text-sm text-gray-700">
                  Your profile and login credentials have been permanently removed from our databases. 
                  Any complaints you reported remain logged anonymously for civic maintenance purposes.
                </p>
                <Button 
                  onClick={() => router.push('/')}
                  className="w-full mt-2 bg-[#C31F26] hover:bg-[#a0191f] text-white font-semibold"
                >
                  Return to Homepage
                </Button>
              </div>
            ) : (
              <form onSubmit={handleDelete} className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 leading-relaxed space-y-1">
                  <p className="font-bold flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-700" /> Important Notice
                  </p>
                  <p>
                    Deleting your account is permanent. This action will erase your registered profile, password, and active login session. Historical reports and analytics will be anonymized.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="mobileNumber">Registered Mobile Number</Label>
                  <Input
                    id="mobileNumber"
                    type="tel"
                    placeholder="Enter your 10-digit mobile number"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    required
                    disabled={isLoading}
                    className="border-gray-200 focus:border-[#C31F26] focus:ring-[#C31F26]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your account password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="border-gray-200 focus:border-[#C31F26] focus:ring-[#C31F26]"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-11 transition-all rounded-xl mt-2 flex items-center justify-center gap-2"
                >
                  {isLoading ? 'Processing Deletion...' : 'Permanently Delete My Account'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-[#8B3A3A]/60 pb-6">
          &copy; {new Date().getFullYear()} Rajapalayam Municipality. All rights reserved.
        </div>
      </div>
    </div>
  );
}
