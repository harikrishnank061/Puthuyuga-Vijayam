'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { registerCitizen, getCitizenByMobile, initializeDB, getApiUrl } from '@/lib/db';
import { useLanguage } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type AuthMode = 'login' | 'register';

export function CitizenAuth() {
  const router = useRouter();
  const { loginCitizen } = useAuth();
  const { t, toggleLanguage, language } = useLanguage();
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [loginForm, setLoginForm] = useState({
    mobileNumber: '',
  });

  const [registerForm, setRegisterForm] = useState({
    name: '',
    mobileNumber: '',
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
      const { mobileNumber } = loginForm;
      const trimmedMobile = mobileNumber.trim();

      if (!trimmedMobile) {
        throw new Error(t('requiredField'));
      }

      // Check directly via fetch to capture 404 unregistered status and output clear user instructions
      const res = await fetch(getApiUrl('/api/auth/citizen/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNumber: trimmedMobile }),
      });

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error(
            language === 'ta'
              ? 'இந்த அலைபேசி எண் இன்னும் பதிவு செய்யப்படவில்லை. தயவுசெய்து மேலே உள்ள "பதிவுசெய்க" தாவலைத் தேர்ந்தெடுத்து புதிய கணக்கை உருவாக்கவும்!'
              : 'This mobile number is not registered yet. Please click the "Register" tab above to sign up!'
          );
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
      const { name, mobileNumber } = registerForm;
      const trimmedName = name.trim();
      const trimmedMobile = mobileNumber.trim();

      if (!trimmedName || !trimmedMobile) {
        throw new Error(t('requiredField'));
      }

      const citizen = await registerCitizen(trimmedName, trimmedMobile);
      loginCitizen(citizen);
      router.push('/citizen/dashboard');
    } catch (err: any) {
      setError(err.message || t('registrationFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex flex-col items-center justify-center p-4 gap-4">
      <div className="w-full max-w-md flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleLanguage}
          className="gap-2 border-primary/20 bg-card text-card-foreground shadow-sm font-semibold"
        >
          {language === 'en' ? 'தமிழ்' : 'English'}
        </Button>
      </div>

      <Card className="w-full max-w-md shadow-lg border-primary/10">
        <CardHeader className="flag-card-header rounded-t-lg p-4 sm:p-6">
          <CardTitle className="text-2xl sm:text-3xl font-extrabold text-center flag-header-text">{t('appTitle')}</CardTitle>
          <CardDescription className="text-center mt-1 flag-header-subtext font-semibold text-xs sm:text-sm">
            {t('appSubtitle')}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-2 mb-6">
            <Button
              variant={mode === 'login' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => {
                setMode('login');
                setError('');
              }}
            >
              {t('login')}
            </Button>
            <Button
              variant={mode === 'register' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => {
                setMode('register');
                setError('');
              }}
            >
              {t('register')}
            </Button>
          </div>

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-sm font-medium">{t('mobileNumber')}</label>
                <Input
                  type="tel"
                  placeholder={t('enterMobile')}
                  value={loginForm.mobileNumber}
                  onChange={(e) =>
                    setLoginForm({ ...loginForm, mobileNumber: e.target.value })
                  }
                  disabled={loading}
                  className="mt-1"
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? t('loading') : t('login')}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="text-sm font-medium">{t('name')}</label>
                <Input
                  type="text"
                  placeholder={t('enterName')}
                  value={registerForm.name}
                  onChange={(e) =>
                    setRegisterForm({ ...registerForm, name: e.target.value })
                  }
                  disabled={loading}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">{t('mobileNumber')}</label>
                <Input
                  type="tel"
                  placeholder={t('enterMobile')}
                  value={registerForm.mobileNumber}
                  onChange={(e) =>
                    setRegisterForm({ ...registerForm, mobileNumber: e.target.value })
                  }
                  disabled={loading}
                  className="mt-1"
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? t('loading') : t('register')}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
