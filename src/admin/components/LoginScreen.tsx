import React, { useState } from 'react';
import { signInWithGoogle, signInWithEmail, isLiveSupabaseConfigured } from '../../lib/supabase.ts';
import { ShieldCheck, CalendarCheck, Lock, User, ArrowRight, Key, Sparkles } from 'lucide-react';
import { Language, translations } from '../../lib/translations.ts';

interface LoginScreenProps {
  onLoginSuccess?: (user: any, token: string) => void;
  onBypassLogin?: () => void;
}

export default function LoginScreen({ onLoginSuccess, onBypassLogin }: LoginScreenProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [lang] = useState<Language>('de');

  const t = translations[lang];

  // Configurable admin credentials from .env
  const configuredAdminUser = (import.meta.env.VITE_ADMIN_USERNAME || 'admin').trim();
  const configuredAdminPass = (import.meta.env.VITE_ADMIN_PASSWORD || 'Passwort123!').trim();

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Bitte geben Sie Benutzername/E-Mail und Passwort ein.');
      return;
    }

    setLoading(true);
    setError(null);

    const inputUser = username.trim().toLowerCase();
    const targetUser = configuredAdminUser.toLowerCase();

    // 1. Direct match with configured .env username/password or official admin email
    const isEnvUserMatch = inputUser === targetUser || 
                           inputUser === 'admin@aus-beratung.de' || 
                           inputUser === 'abdul.sattar@aus-beratung.de' ||
                           inputUser === 'admin';

    if (isEnvUserMatch && password === configuredAdminPass) {
      setTimeout(() => {
        setLoading(false);
        const adminProfile = {
          uid: 'abdul-sattar-uid',
          name: 'Dr. Abdul Sattar',
          email: inputUser.includes('@') ? inputUser : 'abdul.sattar@aus-beratung.de',
          role: 'admin',
          dbId: 1
        };
        const token = localStorage.getItem('idToken') || 'admin-secret-token';
        if (onLoginSuccess) {
          onLoginSuccess(adminProfile, token);
        } else if (onBypassLogin) {
          onBypassLogin();
        }
      }, 400);
      return;
    }

    // 2. Fallback to Supabase Auth if email format
    if (isLiveSupabaseConfigured && username.includes('@')) {
      try {
        const authRes: any = await signInWithEmail(username, password);
        const session = authRes?.session || authRes?.data?.session;
        const profile = authRes?.profile;
        if (!authRes?.error && (session || profile)) {
          const token = session?.access_token || localStorage.getItem('idToken') || 'admin-secret-token';
          const userProfile = profile || {
            uid: session?.user?.id || 'admin-uid',
            name: session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'Admin',
            email: session?.user?.email || username,
            role: 'admin'
          };
          if (onLoginSuccess) {
            onLoginSuccess(userProfile, token);
          } else if (onBypassLogin) {
            onBypassLogin();
          }
          setLoading(false);
          return;
        }
      } catch (err: any) {
        console.warn('Supabase auth attempt:', err);
      }
    }

    setLoading(false);
    setError(`Ungültige Zugangsdaten. Bitte prüfen Sie Ihre Eingabe oder die in der .env hinterlegten Anmeldedaten.`);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!isLiveSupabaseConfigured) {
        setError('Supabase Auth ist für Google-Anmeldung erforderlich.');
        return;
      }
      const { data, error: authError } = await signInWithGoogle();
      if (authError) {
        throw authError;
      }
      if (data?.session) {
        const token = data.session.access_token;
        const userProfile = {
          uid: data.session.user.id,
          name: data.session.user.user_metadata?.full_name || 'Admin',
          email: data.session.user.email,
          role: 'admin'
        };
        if (onLoginSuccess) onLoginSuccess(userProfile, token);
        else if (onBypassLogin) onBypassLogin();
      }
    } catch (err: any) {
      console.warn('Google sign-in error:', err);
      setError(err.message || 'Anmeldung fehlgeschlagen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between p-4 sm:p-6 font-sans">
      {/* Top minimal header */}
      <header className="max-w-6xl mx-auto w-full flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white text-sm shadow-md font-serif">
            A
          </div>
          <div className="flex items-baseline">
            <span className="text-base font-bold text-white font-serif">A u.S</span>
            <span className="text-xs text-blue-400 font-medium ml-2 font-sans">Kanzlei-Leitstand</span>
          </div>
        </div>

        {/* Secure Area Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 text-slate-300 text-xs font-medium rounded-lg border border-slate-700">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Geschützter Leitstand</span>
        </div>
      </header>

      {/* Main card */}
      <main className="flex-1 flex items-center justify-center py-12">
        <div className="bg-slate-950 rounded-3xl shadow-2xl border border-slate-800 p-8 sm:p-10 w-full max-w-md transition-all">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600/20 border border-blue-500/40 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-400 shadow-lg">
              <CalendarCheck className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight font-serif-title">
              A u.S Kanzlei-Leitstand
            </h1>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Melden Sie sich mit Ihren Kanzlei-Zugangsdaten an, um Termine, Verfügbarkeiten und Mandantenakten zu verwalten.
            </p>
          </div>

          {error && (
            <div className="p-3.5 bg-red-950/60 border border-red-800/80 rounded-xl text-xs text-red-300 mb-5 font-medium leading-relaxed">
              {error}
            </div>
          )}

          {/* Direct Login Form */}
          <form onSubmit={handleCustomLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Benutzername oder E-Mail
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder="admin oder abdul.sattar@aus-beratung.de"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Passwort
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 active:scale-98 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md mt-2"
            >
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <span>Anmelden</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Secondary Google Login Option */}
          <div className="mt-6 pt-6 border-t border-slate-800/80 space-y-3">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800/80 transition-all text-xs font-semibold text-slate-300 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.24-.63-.39-1.3-.39-2.09z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Alternativ mit Google anmelden</span>
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Konfigurierbar über .env</span>
            </span>
            <span>Geschützter Bereich</span>
          </div>
        </div>
      </main>

      <footer className="max-w-6xl mx-auto w-full text-center py-4 text-[11px] text-slate-500 border-t border-slate-800">
        © {new Date().getFullYear()} A u.S Wirtschaftsberatung e.K. • Interner Kanzlei-Leitstand
      </footer>
    </div>
  );
}
