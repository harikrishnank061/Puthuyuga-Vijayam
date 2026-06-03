'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { registerCitizen, getApiUrl, initializeDB } from '@/lib/db';
import { useLanguage } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, EyeOff, Phone, Lock, User, Building2 } from 'lucide-react';

type AuthMode = 'login' | 'register';

export function CitizenAuth() {
  const router = useRouter();
  const { loginCitizen } = useAuth();
  const { t, toggleLanguage, language } = useLanguage();
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loginForm, setLoginForm] = useState({
    mobileNumber: '',
    password: '',
  });

  const [registerForm, setRegisterForm] = useState({
    name: '',
    mobileNumber: '',
    password: '',
    confirmPassword: '',
  });

  // Initialize DB on mount
  useState(() => {
    initializeDB();
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { mobileNumber, password } = loginForm;
      const trimmedMobile = mobileNumber.trim();

      if (!trimmedMobile) {
        throw new Error(t('requiredField'));
      }
      if (!password) {
        throw new Error(t('requiredField'));
      }

      const res = await fetch(getApiUrl('/api/auth/citizen/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNumber: trimmedMobile, password }),
      });

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error(
            language === 'ta'
              ? 'இந்த அலைபேசி எண் இன்னும் பதிவு செய்யப்படவில்லை. தயவுசெய்து கீழே உள்ள "இப்போது பதிவு செய்யுங்கள்" பொத்தானை அழுத்தவும்!'
              : 'This mobile number is not registered yet. Please click "Register Now" below to sign up!'
          );
        }
        if (res.status === 401) {
          throw new Error(t('wrongPassword'));
        }
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || t('loginFailed'));
      }

      const citizen = await res.json();
      loginCitizen(citizen);
      router.push('/citizen/dashboard');
    } catch (err: any) {
      setError(err.message || t('loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { name, mobileNumber, password, confirmPassword } = registerForm;
      const trimmedName = name.trim();
      const trimmedMobile = mobileNumber.trim();

      if (!trimmedName || !trimmedMobile || !password) {
        throw new Error(t('requiredField'));
      }
      if (password.length < 4) {
        throw new Error(t('passwordMinLength'));
      }
      if (password !== confirmPassword) {
        throw new Error(t('passwordMismatch'));
      }

      const citizen = await registerCitizen(trimmedName, trimmedMobile, password);
      loginCitizen(citizen);
      router.push('/citizen/dashboard');
    } catch (err: any) {
      setError(err.message || t('registrationFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col auth-page-bg">
      {/* Language Toggle - Floating */}
      <div className="absolute top-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleLanguage}
          className="bg-white/90 backdrop-blur-sm shadow-md border-primary/20 font-bold text-sm px-3 py-1.5 rounded-full hover:bg-white"
        >
          {language === 'en' ? 'தமிழ்' : 'English'}
        </Button>
      </div>

      {/* Hero Section with Logo & Tamil Branding */}
      <div className="auth-hero-section pt-10 pb-6 px-4 text-center relative overflow-hidden">
        {/* Decorative side elements */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 opacity-15 pointer-events-none">
          <svg width="60" height="200" viewBox="0 0 60 200" fill="none">
            <path d="M0 0L60 30V170L0 200V0Z" fill="#C31F26"/>
          </svg>
        </div>
        <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-15 pointer-events-none">
          <svg width="60" height="200" viewBox="0 0 60 200" fill="none">
            <path d="M60 0L0 30V170L60 200V0Z" fill="#C31F26"/>
          </svg>
        </div>

        {/* Emblem/Logo */}
        <div className="auth-emblem-circle mx-auto mb-4">
          <div className="text-3xl">🏛️</div>
        </div>

        {/* App Title in Tamil */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#6B1D1D] tracking-tight leading-tight mb-0.5" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
          {language === 'ta' ? 'புதுயுக விஜயம்' : 'புதுயுக விஜயம்'}
        </h1>
        <h2 className="text-lg sm:text-xl font-bold text-[#8B3A3A] tracking-wide mb-3">
          Puthuyuga Vijayam
        </h2>

        {/* Tagline */}
        <p className="text-base sm:text-lg font-bold text-[#6B1D1D] mb-0.5" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
          {t('taglineTamil')}
        </p>
        <p className="text-sm text-[#8B3A3A] font-medium">
          {language === 'ta' ? 'உங்கள் பிரச்சனை, நமது தீர்வு' : 'Your Problem, Our Resolution'}
        </p>

        {/* Dot indicator */}
        <div className="flex items-center justify-center gap-1.5 mt-4">
          <span className={`w-2 h-2 rounded-full transition-colors ${mode === 'login' ? 'bg-[#C31F26]' : 'bg-[#C31F26]/30'}`}></span>
          <span className={`w-2 h-2 rounded-full transition-colors ${mode === 'register' ? 'bg-[#C31F26]' : 'bg-[#C31F26]/30'}`}></span>
        </div>
      </div>

      {/* Auth Form Card */}
      <div className="flex-1 px-4 -mt-2 pb-4 relative z-10">
        <Card className="w-full max-w-md mx-auto shadow-xl border-0 rounded-2xl overflow-hidden bg-white">
          <CardContent className="p-5 sm:p-7">
            {/* Form Header */}
            <div className="mb-5">
              <h3 className="text-xl sm:text-2xl font-bold text-[#6B1D1D]">
                {mode === 'login' ? t('loginToAccount') : t('createAccount')}
              </h3>
              <p className="text-sm text-gray-500 mt-0.5 font-medium">
                {mode === 'login' ? t('loginSubtext') : t('registerSubtext')}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium animate-fade-in">
                {error}
              </div>
            )}

            {mode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                {/* Mobile Number */}
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#C31F26]">
                    <Phone className="h-4.5 w-4.5" />
                  </div>
                  <Input
                    type="tel"
                    placeholder={t('enterMobile')}
                    value={loginForm.mobileNumber}
                    onChange={(e) => setLoginForm({ ...loginForm, mobileNumber: e.target.value })}
                    disabled={loading}
                    className="pl-11 h-12 rounded-xl border-gray-200 bg-gray-50/70 text-base focus:bg-white focus:border-[#C31F26] transition-all"
                  />
                </div>

                {/* Password */}
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#C31F26]">
                    <Lock className="h-4.5 w-4.5" />
                  </div>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('enterPassword')}
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    disabled={loading}
                    className="pl-11 pr-11 h-12 rounded-xl border-gray-200 bg-gray-50/70 text-base focus:bg-white focus:border-[#C31F26] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>

                {/* Forgot Password */}
                <div className="text-right">
                  <button type="button" className="text-sm font-semibold text-[#C31F26] hover:text-[#a0191f] transition-colors">
                    {t('forgotPassword')}
                  </button>
                </div>

                {/* Login Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-xl text-base font-bold bg-[#7B1E1E] hover:bg-[#5C1515] text-white shadow-lg shadow-[#7B1E1E]/20 transition-all active:scale-[0.98]"
                >
                  {loading ? t('loading') : t('login')}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-3.5">
                {/* Full Name */}
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#C31F26]">
                    <User className="h-4.5 w-4.5" />
                  </div>
                  <Input
                    type="text"
                    placeholder={t('enterName')}
                    value={registerForm.name}
                    onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                    disabled={loading}
                    className="pl-11 h-12 rounded-xl border-gray-200 bg-gray-50/70 text-base focus:bg-white focus:border-[#C31F26] transition-all"
                  />
                </div>

                {/* Mobile Number */}
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#C31F26]">
                    <Phone className="h-4.5 w-4.5" />
                  </div>
                  <Input
                    type="tel"
                    placeholder={t('enterMobile')}
                    value={registerForm.mobileNumber}
                    onChange={(e) => setRegisterForm({ ...registerForm, mobileNumber: e.target.value })}
                    disabled={loading}
                    className="pl-11 h-12 rounded-xl border-gray-200 bg-gray-50/70 text-base focus:bg-white focus:border-[#C31F26] transition-all"
                  />
                </div>

                {/* Password */}
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#C31F26]">
                    <Lock className="h-4.5 w-4.5" />
                  </div>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('enterPassword')}
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    disabled={loading}
                    className="pl-11 pr-11 h-12 rounded-xl border-gray-200 bg-gray-50/70 text-base focus:bg-white focus:border-[#C31F26] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>

                {/* Confirm Password */}
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#C31F26]">
                    <Lock className="h-4.5 w-4.5" />
                  </div>
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder={t('enterConfirmPassword')}
                    value={registerForm.confirmPassword}
                    onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                    disabled={loading}
                    className="pl-11 pr-11 h-12 rounded-xl border-gray-200 bg-gray-50/70 text-base focus:bg-white focus:border-[#C31F26] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>

                {/* Register Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-xl text-base font-bold bg-[#7B1E1E] hover:bg-[#5C1515] text-white shadow-lg shadow-[#7B1E1E]/20 transition-all active:scale-[0.98]"
                >
                  {loading ? t('loading') : t('register')}
                </Button>
              </form>
            )}

            {/* Divider with OR */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-gray-200"></div>
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">{t('or')}</span>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>

            {/* Role Selector Cards */}
            <div className="flex justify-center">
              {/* Admin Login */}
              <button
                type="button"
                className="auth-role-card group w-full max-w-[180px]"
                onClick={() => router.push('/?role=admin')}
              >
                <div className="auth-role-icon bg-red-100">
                  <Building2 className="h-5 w-5 text-[#C31F26]" />
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-gray-700 leading-tight">{t('adminLogin')}</span>
                <span className="text-[9px] text-gray-400 font-medium leading-tight">{t('adminLoginDesc')}</span>
              </button>
            </div>

            {/* Toggle Login/Register */}
            <div className="text-center mt-5">
              {mode === 'login' ? (
                <p className="text-sm text-gray-500">
                  {t('dontHaveAccount')}{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('register'); setError(''); }}
                    className="font-bold text-[#C31F26] hover:text-[#a0191f] transition-colors"
                  >
                    {t('registerNow')}
                  </button>
                </p>
              ) : (
                <p className="text-sm text-gray-500">
                  {t('alreadyHaveAccount')}{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setError(''); }}
                    className="font-bold text-[#C31F26] hover:text-[#a0191f] transition-colors"
                  >
                    {t('loginNow')}
                  </button>
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* City Skyline Footer */}
      <div className="auth-skyline-footer">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full" preserveAspectRatio="none">
          {/* Temple/building skyline silhouette */}
          <path d="M0 120V80L40 75L60 40L80 75L120 70L140 30L160 70L200 65L220 20L230 15L240 20L260 65L300 70L320 50L340 70L380 65L400 35L420 65L460 60L500 55L520 25L530 10L540 25L560 55L600 60L640 50L660 35L670 20L680 35L700 50L740 55L780 45L800 30L820 45L860 50L900 55L920 40L940 55L980 50L1000 20L1010 8L1020 20L1040 50L1080 55L1120 45L1140 30L1160 45L1200 50L1220 35L1240 50L1280 55L1300 45L1320 30L1340 45L1380 50L1420 55L1440 60V120H0Z" fill="#E8C84A" fillOpacity="0.4"/>
          <path d="M0 120V90L60 85L100 80L140 55L160 80L200 75L240 40L260 75L300 80L340 60L380 80L420 75L460 50L480 35L500 50L540 75L580 70L620 55L660 45L680 30L700 45L740 60L780 65L820 50L860 65L900 60L940 45L960 30L980 45L1020 60L1060 65L1100 55L1140 40L1160 55L1200 65L1240 60L1280 50L1300 35L1320 50L1360 60L1400 65L1440 70V120H0Z" fill="#E8C84A" fillOpacity="0.7"/>
          {/* Golden wave at bottom */}
          <rect y="100" width="1440" height="20" fill="#D4A017"/>
          {/* Red top border */}
          <rect y="95" width="1440" height="6" fill="#C31F26"/>
        </svg>
      </div>
    </div>
  );
}
