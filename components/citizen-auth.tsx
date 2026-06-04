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
    <div className="min-h-screen md:h-screen w-full md:overflow-hidden flex flex-col justify-center md:justify-between py-6 md:py-0 md:pt-4 md:pb-0 px-4 sm:px-6 lg:px-8 relative auth-tcm-bg">
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

      {/* Main Container */}
      <div className="container mx-auto max-w-6xl flex-1 flex flex-col justify-center md:justify-between gap-6 pt-2 pb-6 md:pb-0">
        
        {/* Top Header: Logo + Title + Dots */}
        <div className="flex flex-col items-center text-center mt-1 mb-2 md:flex-shrink-0">
          <div className="flex items-center justify-center gap-4 sm:gap-6 mb-1 w-full max-w-[340px] xs:max-w-[400px] sm:max-w-md">
            {/* Left Portrait: Mobile only */}
            <div className="md:hidden flex-shrink-0">
              <img 
                src="/HIV838cbIAAghD0.jpg.jpeg" 
                alt="Leader Left" 
                className="w-20 h-20 xs:w-24 xs:h-24 sm:w-28 sm:h-28 rounded-full border-2 border-[#C31F26] object-cover shadow-lg"
              />
            </div>
            
            {/* App Logo */}
            <img 
              src="/Puthuyuga Vijayam Logo.png" 
              alt="App Logo" 
              className="w-24 h-24 xs:w-28 xs:h-28 sm:w-32 sm:h-32 md:w-32 md:h-32 object-contain filter drop-shadow-md transition-transform hover:scale-105"
            />
            
            {/* Right Portrait: Mobile only */}
            <div className="md:hidden flex-shrink-0">
              <img 
                src="/WhatsApp Image 2026-06-03 at 16.32.56.jpeg" 
                alt="Leader Right" 
                className="w-20 h-20 xs:w-24 xs:h-24 sm:w-28 sm:h-28 rounded-full border-2 border-[#C31F26] object-cover shadow-lg"
              />
            </div>
          </div>

          <h1 
            className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#6B1D1D] tracking-tight leading-tight mt-2.5 animate-fade-in" 
            style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}
          >
            புதுயுக விஜயம்
          </h1>
          <div className="flex items-center justify-center gap-1.5 mt-3">
            <span className={`w-2.5 h-2.5 rounded-full transition-colors ${mode === 'login' ? 'bg-[#C31F26]' : 'bg-[#C31F26]/30'}`}></span>
            <span className={`w-2.5 h-2.5 rounded-full transition-colors ${mode === 'register' ? 'bg-[#C31F26]' : 'bg-[#C31F26]/30'}`}></span>
          </div>
        </div>

        {/* 2-Column Content Section */}
        <div className="w-full max-w-[1100px] mx-auto md:mr-auto md:ml-6 lg:ml-12 flex flex-col md:flex-row items-center md:items-end justify-center md:justify-start gap-6 lg:gap-12 pt-2 pb-0 md:pb-0 md:mt-auto md:flex-shrink-0">
          
          {/* Column 1: Left Branding Banner Image */}
          <div className="hidden md:flex md:w-[48%] flex-shrink-0 justify-center md:justify-start md:self-end">
            <img 
              src="/ChatGPT Image Jun 3, 2026, 05_13_05 PM-Photoroom.png" 
              alt="Branding Banner" 
              className="w-full max-w-[320px] xs:max-w-[380px] sm:max-w-[420px] md:max-w-[480px] lg:max-w-[500px] md:max-h-[calc(100vh-210px)] object-contain object-bottom drop-shadow-2xl animate-fade-in"
            />
          </div>

          {/* Column 2: Auth Form Card */}
          <div className="w-full max-w-md flex-shrink-0 flex justify-center md:justify-start md:self-center md:mb-8">
            <Card className="w-full shadow-2xl border-0 rounded-3xl overflow-hidden bg-white/95 backdrop-blur-sm md:h-[510px]">
              <CardContent className="p-5 md:p-6 h-full flex flex-col justify-between">
                <div className="flex-1 flex flex-col justify-center overflow-y-auto pr-1">
                  {/* Form Header */}
                  <div className="mb-3">
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
                    <form onSubmit={handleLogin} className="space-y-3">
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
                          className="pl-11 h-11 rounded-xl border-gray-200 bg-gray-50/70 text-base focus:bg-white focus:border-[#C31F26] transition-all"
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
                          className="pl-11 pr-11 h-11 rounded-xl border-gray-200 bg-gray-50/70 text-base focus:bg-white focus:border-[#C31F26] transition-all"
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
                        className="w-full h-11 rounded-xl text-base font-bold bg-[#7B1E1E] hover:bg-[#5C1515] text-white shadow-lg shadow-[#7B1E1E]/20 transition-all active:scale-[0.98]"
                      >
                        {loading ? t('loading') : t('login')}
                      </Button>
                    </form>
                  ) : (
                    <form onSubmit={handleRegister} className="space-y-2.5">
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
                          className="pl-11 h-11 rounded-xl border-gray-200 bg-gray-50/70 text-base focus:bg-white focus:border-[#C31F26] transition-all"
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
                          className="pl-11 h-11 rounded-xl border-gray-200 bg-gray-50/70 text-base focus:bg-white focus:border-[#C31F26] transition-all"
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
                          className="pl-11 pr-11 h-11 rounded-xl border-gray-200 bg-gray-50/70 text-base focus:bg-white focus:border-[#C31F26] transition-all"
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
                          className="pl-11 pr-11 h-11 rounded-xl border-gray-200 bg-gray-50/70 text-base focus:bg-white focus:border-[#C31F26] transition-all"
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
                        className="w-full h-11 rounded-xl text-base font-bold bg-[#7B1E1E] hover:bg-[#5C1515] text-white shadow-lg shadow-[#7B1E1E]/20 transition-all active:scale-[0.98]"
                      >
                        {loading ? t('loading') : t('register')}
                      </Button>
                    </form>
                  )}

                  {/* Toggle Login/Register */}
                  <div className="text-center mt-4">
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
                </div>

                {/* Privacy Link */}
                <div className="text-center mt-3 pt-3 border-t border-gray-100 flex-shrink-0">
                  <button 
                    type="button" 
                    onClick={() => router.push('/privacy')}
                    className="text-xs text-gray-400 hover:text-gray-600 underline transition-colors"
                  >
                    {t('privacyPolicy')}
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>

      </div>
    </div>
  );
}
