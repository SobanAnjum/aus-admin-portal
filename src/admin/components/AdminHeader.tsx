import { Search, Menu } from 'lucide-react';
import { Language, translations } from '../../lib/translations.ts';

interface AdminHeaderProps {
  activeTab: string;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  currentUser: { name?: string; email?: string; role?: string } | null;
  dataLoading: boolean;
  lang: Language;
  onOpenMobileSidebar?: () => void;
}

export default function AdminHeader({
  activeTab,
  searchQuery,
  setSearchQuery,
  currentUser,
  dataLoading,
  lang,
  onOpenMobileSidebar,
}: AdminHeaderProps) {
  const t = translations[lang] || translations.de;

  const getTabTitle = () => {
    switch (activeTab) {
      case 'Übersicht': return t.overview;
      case 'Termine': return t.appointments;
      case 'Mandanten': return t.clients;
      case 'Einstellungen': return t.settings;
      case 'Help': return t.help;
      default: return t.portal_title;
    }
  };

  return (
    <header className="h-16 px-4 sm:px-8 flex items-center justify-between border-b border-slate-200 bg-white sticky top-0 z-30 shrink-0">
      <div className="flex items-center gap-3">
        {/* Mobile Sidebar Hamburger */}
        {onOpenMobileSidebar && (
          <button
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Open Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <h1 className="text-base sm:text-lg font-bold text-slate-900 font-serif-title truncate">
          {getTabTitle()}
        </h1>
        {dataLoading && (
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
        )}
      </div>

      {/* Search bar & User Profile */}
      <div className="flex items-center gap-4 sm:gap-6">
        <div className="flex items-center gap-3 w-36 sm:w-64">
          <div className="relative w-full">
            <span className={`absolute ${lang === 'ur' ? 'right-3' : 'left-3'} top-2.5 text-slate-400`}>
              <Search className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full ${lang === 'ur' ? 'pr-9 pl-3' : 'pl-9 pr-3'} py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-slate-900 focus:bg-white transition-colors`}
              placeholder={t.search_placeholder}
            />
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-xs font-bold text-slate-900 font-serif">{currentUser?.name || 'Abdul Sattar'}</span>
            <span className="text-[9px] uppercase font-bold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
              {currentUser?.role === 'admin' ? 'Kanzleiinhaber' : t.advisor}
            </span>
          </div>
          <div className="w-8 h-8 rounded-full overflow-hidden bg-white text-slate-900 flex items-center justify-center font-bold text-xs shrink-0 border border-slate-300 shadow-2xs">
            <img 
              src="/assets/abdul_sattar.png" 
              alt="Abdul Sattar" 
              className="w-full h-full object-cover object-top"
              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
