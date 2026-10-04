import { useState } from 'react';
import AdminApp from './admin/AdminApp.tsx';
import { Language } from './lib/translations.ts';

export default function App() {
  const [lang, setLang] = useState<Language>('de');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      <AdminApp
        lang={lang}
        onChangeLanguage={setLang}
      />
    </div>
  );
}
