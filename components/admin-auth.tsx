'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function AdminAuth() {
  const router = useRouter();
  const { loginAdmin } = useAuth();
  const { t, toggleLanguage, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    username: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { username, password } = form;

      if (!username.trim() || !password.trim()) {
        throw new Error(t('requiredField'));
      }

      const success = loginAdmin(username, password);
      if (!success) {
        throw new Error(t('loginFailed'));
      }

      router.push('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || t('loginFailed'));
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
            {t('adminDashboard')}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">{t('username')}</label>
              <Input
                type="text"
                placeholder={t('enterUsername')}
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                disabled={loading}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">{t('password')}</label>
              <Input
                type="password"
                placeholder={t('enterPassword')}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                disabled={loading}
                className="mt-1"
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? t('loading') : t('login')}
            </Button>
          </form>

          <div className="mt-4 text-xs text-muted-foreground text-center">
            <p>Demo Credentials:</p>
            <p>Username: ADMIN</p>
            <p>Password: ADMIN123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
