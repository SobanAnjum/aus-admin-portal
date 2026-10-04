import { 
  LayoutDashboard, 
  CalendarDays, 
  Users, 
  Settings, 
  Plus, 
  HelpCircle, 
  LogOut, 
  Globe, 
  ExternalLink,
  X,
  MessageSquare,
  CalendarCheck
} from 'lucide-react';
import { Language, translations } from '../../lib/translations.ts';

interface AdminSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: { name?: string; email?: string; role?: string } | null;
  onNewTermin: () => void;
  onSignOut: () => void;
  lang: Language;
  onChangeLanguage: (lang: Language) => void;
  mobileSidebarOpen?: boolean;
  onCloseMobileSidebar?: () => void;
}

export default function AdminSidebar({
  activeTab,
  setActiveTab,
  currentUser,
  onNewTermin,
  onSignOut,
  lang,
  onChangeLanguage,
  mobileSidebarOpen = false,
  onCloseMobileSidebar,
}: AdminSidebarProps) {
  const t = translations[lang] || translations.de;

  const menuItems = [
    { id: 'Übersicht', label: t.overview, icon: LayoutDashboard },
    { id: 'Termine', label: t.appointments, icon: CalendarDays },
    { id: 'Verfügbarkeit', label: 'Verfügbarkeit', icon: CalendarCheck },
    { id: 'Chat & Tickets', label: 'Chat & Tickets', icon: MessageSquare },
    { id: 'Mandanten', label: t.clients, icon: Users },
    { id: 'Einstellungen', label: t.settings, icon: Settings },
  ];

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    if (onCloseMobileSidebar) {
      onCloseMobileSidebar();
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 py-6 border-slate-800">
      {/* Brand & Mobile Close Button */}
      <div className="px-6 mb-4">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center font-bold text-white shadow-xs text-sm font-serif">
              A
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white block font-serif">A u.S Management</span>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Kanzlei-Leitstand</span>
            </div>
          </div>

          {onCloseMobileSidebar && (
            <button
              onClick={onCloseMobileSidebar}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              aria-label="Close Sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        
        {/* Founder / User Card */}
        <div className="mt-4 flex items-center gap-3 p-2.5 bg-slate-800/90 rounded-xl border border-slate-700 shadow-2xs">
          <div className="w-9 h-9 rounded-xl overflow-hidden bg-white flex items-center justify-center text-slate-900 font-bold text-xs border border-slate-300 shrink-0">
            <img 
              src="/assets/abdul_sattar.png" 
              alt="Abdul Sattar" 
              className="w-full h-full object-cover object-top"
              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-100 truncate" title={currentUser?.name || 'Abdul Sattar'}>
              {currentUser?.name || 'Abdul Sattar (PhD, LL.M.)'}
            </p>
            <p className="text-[10px] text-slate-400 font-semibold truncate uppercase tracking-wider">
              {currentUser?.role === 'admin' ? 'Kanzleiinhaber' : t.advisor}
            </p>
          </div>
        </div>
      </div>

      {/* Language Switcher Capsule */}
      <div className="mx-4 mb-4 flex items-center justify-between gap-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider pl-1 flex items-center gap-1">
          <Globe className="w-3 h-3 text-slate-400" />
          <span>{lang === 'ur' ? 'زبان' : lang === 'en' ? 'Lang' : 'Sprache'}</span>
        </span>
        <div className="flex gap-1">
          {(['de', 'en', 'ur'] as Language[]).map((l) => (
            <button
              key={l}
              onClick={() => onChangeLanguage(l)}
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all uppercase cursor-pointer ${
                lang === l
                  ? 'bg-slate-800 text-white shadow-2xs border border-slate-700'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {l === 'de' ? 'DE' : l === 'en' ? 'EN' : 'UR'}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation menu */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`w-full flex items-center gap-3.5 py-2.5 px-3 rounded-xl transition-all text-start text-xs font-bold uppercase tracking-wider cursor-pointer ${
                isActive
                  ? 'bg-slate-800 text-white shadow-2xs border border-slate-700'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
              }`}
            >
              <IconComponent className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Action Suite Bottom */}
      <div className="p-3 border-t border-slate-800 space-y-2">
        <button
          onClick={() => {
            onNewTermin();
            if (onCloseMobileSidebar) onCloseMobileSidebar();
          }}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 active:scale-98 text-slate-950 transition-all text-xs font-bold uppercase tracking-wider shadow-2xs cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>{t.new_appointment}</span>
        </button>

        <div className="pt-1 flex items-center gap-1">
          <button
            onClick={() => handleTabClick('Help')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
              activeTab === 'Help'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{t.help}</span>
          </button>

          <button
            onClick={onSignOut}
            className="flex items-center justify-center gap-1 py-2 px-2.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/20 text-[11px] font-semibold transition-all cursor-pointer"
            title="Abmelden"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t.signout}</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className={`hidden lg:flex fixed ${lang === 'ur' ? 'right-0 border-l' : 'left-0 border-r'} top-0 h-full w-64 z-40 border-slate-800 flex-col shadow-lg`}>
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div 
            onClick={onCloseMobileSidebar} 
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs animate-fade-in"
          />
          <aside className={`relative z-10 w-72 max-w-[80vw] h-full shadow-2xl flex flex-col ${lang === 'ur' ? 'mr-auto' : 'ml-0'}`}>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
