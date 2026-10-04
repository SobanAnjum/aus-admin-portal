import { useState } from 'react';
import { Appointment, Client, Advisor } from '../../types.ts';
import { Language, translations } from '../../lib/translations.ts';
import { 
  CalendarDays, 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Plus, 
  ArrowRight,
  Calendar,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

interface DashboardOverviewProps {
  appointments: Appointment[];
  clients: Client[];
  advisors: Advisor[];
  onSelectAppointment: (appointment: Appointment) => void;
  onNavigateToCalendar: () => void;
  onOpenNewModal: () => void;
  lang: Language;
}

export default function DashboardOverview({
  appointments,
  clients,
  advisors,
  onSelectAppointment,
  onNavigateToCalendar,
  onOpenNewModal,
  lang
}: DashboardOverviewProps) {
  const t = translations[lang] || translations.de;
  const [scheduleFilter, setScheduleFilter] = useState<'today' | 'upcoming' | 'all'>('today');

  const todayStr = new Date().toISOString().split('T')[0];

  const totalAppointments = appointments.length;
  const confirmedAppointments = appointments.filter(a => a.status === 'Bestätigt').length;
  const rescheduledAppointments = appointments.filter(a => a.status === 'Verschoben').length;
  const cancelledAppointments = appointments.filter(a => a.status === 'Storniert').length;
  const totalClients = clients.length;

  // Filter schedule
  const filteredSchedule = appointments.filter(apt => {
    if (scheduleFilter === 'today') return apt.date === todayStr;
    if (scheduleFilter === 'upcoming') return apt.date >= todayStr && apt.status !== 'Storniert';
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Bestätigt':
        return (
          <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-200">
            {t.status_bestaetigt}
          </span>
        );
      case 'Verschoben':
        return (
          <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-amber-200">
            {t.status_verschoben}
          </span>
        );
      case 'Storniert':
        return (
          <span className="bg-red-50 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-red-200">
            {t.status_storniert}
          </span>
        );
      default:
        return <span className="bg-slate-50 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-md">{status}</span>;
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-8 overflow-y-auto space-y-6 sm:space-y-8 bg-slate-50">
      {/* Welcome Banner — Clean Slate-900 Executive Header */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-sm border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            <span>Kanzlei-Management Leitstand</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-serif-title">
            Willkommen im A u.S Leitstand
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Hier sehen Sie alle aktuellen Beratungsanfragen, anstehende Termine und Kanzleikennzahlen auf einen Blick.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onOpenNewModal}
            className="px-4 py-2.5 bg-white hover:bg-slate-100 active:scale-98 text-slate-900 font-bold text-xs uppercase tracking-wider rounded-xl shadow-2xs transition-all cursor-pointer flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>{t.new_appointment}</span>
          </button>

          <button
            onClick={onNavigateToCalendar}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider rounded-xl border border-slate-700 transition-all cursor-pointer flex items-center gap-2"
          >
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>Zum Kalender</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-5">
        {/* Card 1: Total Clients */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Mandantenstamm</p>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{totalClients}</h3>
          <p className="text-[11px] text-emerald-600 mt-1 sm:mt-2 font-semibold">● Aktiv im System</p>
        </div>

        {/* Card 2: Total Appointments */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Gesamte Termine</p>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{totalAppointments}</h3>
          <p className="text-[11px] text-slate-500 mt-1 sm:mt-2 font-medium">Gebuchte Beratungen</p>
        </div>

        {/* Card 3: Confirmed */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t.status_bestaetigt}</p>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-600">{confirmedAppointments}</h3>
          <p className="text-[11px] text-emerald-700 mt-1 sm:mt-2 font-semibold">Fest eingeplant</p>
        </div>

        {/* Card 4: Rescheduled */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t.status_verschoben}</p>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-amber-600">{rescheduledAppointments}</h3>
          <p className="text-[11px] text-amber-700 mt-1 sm:mt-2 font-semibold">Neu terminiert</p>
        </div>

        {/* Card 5: Cancelled */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs col-span-2 sm:col-span-1">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t.status_storniert}</p>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-red-500">{cancelledAppointments}</h3>
          <p className="text-[11px] text-red-600 mt-1 sm:mt-2 font-semibold">Freigegebene Slots</p>
        </div>
      </div>

      {/* Main Grid: Schedule Timeline & Founder Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* Left Col: Schedule Feed (8 Cols) */}
        <div className="lg:col-span-8 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
          <div className="flex flex-wrap justify-between items-center gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-slate-700" />
              <h3 className="text-base font-bold text-slate-900 font-serif">Termin-Feed & Tagesübersicht</h3>
            </div>

            {/* Filter Toggle */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-xs">
              <button
                onClick={() => setScheduleFilter('today')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  scheduleFilter === 'today'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Heute
              </button>
              <button
                onClick={() => setScheduleFilter('upcoming')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  scheduleFilter === 'upcoming'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Anstehend
              </button>
              <button
                onClick={() => setScheduleFilter('all')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  scheduleFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Alle
              </button>
            </div>
          </div>

          {/* Appointment List */}
          <div className="space-y-3">
            {filteredSchedule.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                Keine Termine im ausgewählten Filter gefunden.
              </div>
            ) : (
              filteredSchedule.map((apt) => (
                <div
                  key={apt.id}
                  onClick={() => onSelectAppointment(apt)}
                  className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 font-serif">{apt.title}</span>
                      {getStatusBadge(apt.status)}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <Calendar className="w-3.5 h-3.5 text-slate-600" />
                        {apt.date}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-600" />
                        {apt.startTime} – {apt.endTime} Uhr
                      </span>
                      <span>•</span>
                      <span className="text-slate-700 font-semibold">{apt.client.name}</span>
                    </div>
                  </div>

                  <button className="self-end sm:self-center px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer">
                    <span>Details</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Col: Founder Profile & Kanzlei Summary (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <UserCheck className="w-4 h-4 text-slate-700" />
              <h4 className="text-sm font-bold text-slate-900 font-serif">Kanzleileitung & Inhaber</h4>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-white flex items-center justify-center font-bold text-xs shrink-0 border border-slate-200 shadow-2xs">
                <img 
                  src="/assets/abdul_sattar.png" 
                  alt="Abdul Sattar" 
                  className="w-full h-full object-cover object-top"
                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                />
              </div>
              <div className="min-w-0">
                <h5 className="text-sm font-bold text-slate-900 truncate font-serif">Abdul Sattar</h5>
                <p className="text-xs text-slate-700 font-semibold">PhD, LL.M., Magister Artium</p>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">Kanzleiinhaber & Berater</p>
              </div>
            </div>

            <div className="pt-2 text-xs text-slate-600 space-y-1.5 border-t border-slate-100">
              <p>● Kanzleisitz: Maximilianstraße 35, München</p>
              <p>● Beratungsfokus: Wirtschaftsberatung, Medienrecht & Politikwissenschaft</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
