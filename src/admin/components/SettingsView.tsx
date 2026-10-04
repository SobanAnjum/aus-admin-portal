import { Settings, ShieldCheck, Database, User, Globe, Key } from 'lucide-react';
import { Language, translations } from '../../lib/translations.ts';

interface SettingsViewProps {
  currentUser: { name?: string; email?: string; role?: string } | null;
  lang: Language;
  onChangeLanguage: (lang: Language) => void;
}

export default function SettingsView({ currentUser, lang, onChangeLanguage }: SettingsViewProps) {
  const t = translations[lang];

  return (
    <div className="flex-1 p-8 overflow-y-auto space-y-6 bg-slate-50">
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600" />
          <span>System- & Kanzlei-Einstellungen</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Verwalten Sie Ihr Beraterprofil, Spracheinstellungen und Systemanbindungen.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        {/* User Profile Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" />
            <span>Kanzlei-Benutzerprofil</span>
          </h3>
          <div className="space-y-3 text-xs">
            <div>
              <span className="font-bold text-slate-400 uppercase tracking-wide text-[9px] block">Name</span>
              <p className="text-slate-900 font-bold text-sm mt-0.5">{currentUser?.name || 'Abdul Sattar'}</p>
            </div>
            <div>
              <span className="font-bold text-slate-400 uppercase tracking-wide text-[9px] block">E-Mail</span>
              <p className="text-slate-700 font-medium mt-0.5">{currentUser?.email || 'abdul.sattar@aus-beratung.de'}</p>
            </div>
            <div>
              <span className="font-bold text-slate-400 uppercase tracking-wide text-[9px] block">Berechtigungsstufe</span>
              <span className="inline-block mt-1 px-2.5 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-full font-bold uppercase text-[10px]">
                {currentUser?.role === 'admin' ? 'Super-Administrator' : 'Senior-Berater'}
              </span>
            </div>
          </div>
        </div>

        {/* Database Status Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3 flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-600" />
            <span>Datenbank & Cloud-Sync</span>
          </h3>
          <div className="space-y-3 text-xs text-slate-600">
            <p className="leading-relaxed">
              Die Buchungsplattform synchronisiert Termine und Mandantendaten in Echtzeit zwischen dem Kunden-Portal und dem internen Management-Desk.
            </p>
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Architektur:</span>
                <span className="text-slate-900 font-bold">PostgreSQL / Drizzle ORM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Live-Sync:</span>
                <span className="text-emerald-600 font-bold">● Aktiv & Synchron</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Verschlüsselung:</span>
                <span className="text-slate-900">AES-256 / SSL</span>
              </div>
            </div>
          </div>
        </div>

        {/* Language Selection Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3 flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-600" />
            <span>Sprachumgebung</span>
          </h3>
          <div className="flex gap-2">
            {(['de', 'en', 'ur'] as Language[]).map((l) => (
              <button
                key={l}
                onClick={() => onChangeLanguage(l)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  lang === l
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {l === 'de' ? 'Deutsch (DE)' : l === 'en' ? 'English (EN)' : 'اردو (UR)'}
              </button>
            ))}
          </div>
        </div>

        {/* Security & Access Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3 flex items-center gap-2">
            <Key className="w-4 h-4 text-blue-600" />
            <span>Zwei-Faktor & Authentifizierung</span>
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Google Firebase Authentifizierung schützt alle internen Kanzleibereiche vor unbefugtem Zugriff.
          </p>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>Mitarbeiter-Sitzung verifiziert</span>
          </span>
        </div>
      </div>
    </div>
  );
}
