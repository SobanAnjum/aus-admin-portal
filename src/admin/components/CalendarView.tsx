import { useMemo } from 'react';
import { Appointment, ViewMode } from '../../types.ts';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, User, Building } from 'lucide-react';
import { Language, translations } from '../../lib/translations.ts';

interface CalendarViewProps {
  appointments: Appointment[];
  selectedAppointment: Appointment | null;
  onSelectAppointment: (appointment: Appointment) => void;
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  lang: Language;
}

export default function CalendarView({
  appointments,
  selectedAppointment,
  onSelectAppointment,
  currentDate,
  setCurrentDate,
  viewMode,
  setViewMode,
  lang
}: CalendarViewProps) {
  const t = translations[lang] || translations.de;

  const monthNames = lang === 'ur' 
    ? ['جنوری', 'فروری', 'مارچ', 'اپریل', 'مئی', 'جون', 'جولائی', 'اگست', 'ستمبر', 'اکتوبر', 'نومبر', 'دسمبر']
    : lang === 'en'
    ? ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    : ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

  const dayNames = lang === 'ur'
    ? ['پیر', 'منگل', 'بدھ', 'جمعرات', 'جمعہ', 'ہفتہ', 'اتوار']
    : lang === 'en'
    ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    : ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  // Helper to format date to YYYY-MM-DD
  const formatDateString = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Calculate the dates for the current week starting on Monday
  const weekDays = useMemo(() => {
    const start = new Date(currentDate);
    const day = start.getDay();
    // Monday is index 0 in week
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(start);
      nextDay.setDate(start.getDate() + i);
      days.push(nextDay);
    }
    return days;
  }, [currentDate]);

  // Check if a date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const handlePrev = () => {
    const nextDate = new Date(currentDate);
    if (viewMode === 'Woche') {
      nextDate.setDate(currentDate.getDate() - 7);
    } else {
      nextDate.setMonth(currentDate.getMonth() - 1);
    }
    setCurrentDate(nextDate);
  };

  const handleNext = () => {
    const nextDate = new Date(currentDate);
    if (viewMode === 'Woche') {
      nextDate.setDate(currentDate.getDate() + 7);
    } else {
      nextDate.setMonth(currentDate.getMonth() + 1);
    }
    setCurrentDate(nextDate);
  };

  const handleJumpToday = () => {
    setCurrentDate(new Date());
  };

  const getStatusBorder = (status: string) => {
    switch (status) {
      case 'Bestätigt': return 'border-l-4 border-l-emerald-500 bg-emerald-50/40 hover:bg-emerald-50';
      case 'Verschoben': return 'border-l-4 border-l-amber-500 bg-amber-50/40 hover:bg-amber-50';
      case 'Storniert': return 'border-l-4 border-l-red-500 bg-red-50/40 hover:bg-red-50 opacity-70';
      default: return 'border-l-4 border-l-blue-500 bg-blue-50/40';
    }
  };

  const getStatusPill = (status: string) => {
    switch (status) {
      case 'Bestätigt': return <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded">{t.status_bestaetigt}</span>;
      case 'Verschoben': return <span className="text-[9px] font-bold text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded">{t.status_verschoben}</span>;
      case 'Storniert': return <span className="text-[9px] font-bold text-red-700 bg-red-100/80 px-1.5 py-0.5 rounded">{t.status_storniert}</span>;
      default: return null;
    }
  };

  // Calendar month days
  const monthCalendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDayOfWeek = (firstDay.getDay() + 6) % 7;
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();

    const days = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    for (let d = 1; d <= totalDays; d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  }, [currentDate]);

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Calendar Header / Navigation */}
      <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap justify-between items-center gap-4 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
            <CalendarIcon className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              {viewMode === 'Woche' ? `${t.cal_week} (Mo - So)` : t.cal_month}
            </p>
          </div>
        </div>

        {/* View Switcher & Navigator */}
        <div className="flex items-center gap-3">
          {/* Week / Month Toggle */}
          <div className="bg-slate-200/80 p-1 rounded-xl flex items-center gap-1">
            <button
              onClick={() => setViewMode('Woche')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'Woche'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.cal_week}
            </button>
            <button
              onClick={() => setViewMode('Monat')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'Monat'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.cal_month}
            </button>
          </div>

          {/* Today Button */}
          <button
            onClick={handleJumpToday}
            className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            {t.cal_today}
          </button>

          {/* Navigation Arrows */}
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* VIEW: WEEK VIEW */}
      {viewMode === 'Woche' && (
        <div className="grid grid-cols-7 flex-1 divide-x divide-slate-100 min-h-[550px] bg-slate-50/30">
          {weekDays.map((day, idx) => {
            const dayStr = formatDateString(day);
            const isCurrentToday = isToday(day);
            const isDaySelected = selectedAppointment?.date === dayStr;
            const dayAppointments = appointments.filter(a => a.date === dayStr);

            return (
              <div key={idx} className={`flex flex-col h-full min-w-[130px] transition-colors ${
                isDaySelected ? 'bg-blue-50/20 ring-1 ring-blue-500/20' : ''
              }`}>
                {/* Day Header */}
                <div className={`p-3 text-center border-b transition-colors ${
                  isDaySelected 
                    ? 'bg-blue-100/70 border-blue-300 ring-1 ring-blue-500/30' 
                    : isCurrentToday 
                    ? 'bg-blue-50/60 border-slate-100' 
                    : 'bg-white border-slate-100'
                }`}>
                  <div className="flex items-center justify-center gap-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                      isDaySelected ? 'text-blue-700' : 'text-slate-400'
                    }`}>
                      {dayNames[idx]}
                    </span>
                    {isDaySelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block" />
                    )}
                  </div>
                  <span className={`text-base font-extrabold block mt-0.5 ${
                    isDaySelected ? 'text-blue-700 underline decoration-2 decoration-blue-500 underline-offset-2' : isCurrentToday ? 'text-blue-600' : 'text-slate-800'
                  }`}>
                    {day.getDate()}
                  </span>
                </div>

                {/* Day Appointment List */}
                <div className="p-2 space-y-2 flex-1 overflow-y-auto max-h-[500px]">
                  {dayAppointments.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-300 text-[10px] italic py-8">
                      Keine Termine
                    </div>
                  ) : (
                    dayAppointments.map((apt) => {
                      const isSelected = selectedAppointment?.id === apt.id;
                      return (
                        <div
                          key={apt.id}
                          onClick={() => onSelectAppointment(apt)}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer text-xs ${
                            isSelected
                              ? 'border-blue-600 bg-white ring-2 ring-blue-600/20 shadow-md scale-[1.02]'
                              : `border-slate-200 ${getStatusBorder(apt.status)} shadow-2xs`
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="font-bold text-slate-900 truncate text-[11px]">
                              {apt.title}
                            </span>
                            {getStatusPill(apt.status)}
                          </div>

                          <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium mb-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{apt.startTime} – {apt.endTime}</span>
                          </div>

                          <div className="flex items-center gap-1 text-[10px] text-slate-700 font-semibold truncate">
                            <User className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{apt.client.name}</span>
                          </div>

                          {apt.advisor && (
                            <div className="mt-1 text-[9px] text-slate-400 truncate">
                              Berater: {apt.advisor.name.split(' ')[0]}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW: MONTH VIEW */}
      {viewMode === 'Monat' && (
        <div className="flex-1 p-4 bg-slate-50/20 flex flex-col">
          {/* Weekday Names */}
          <div className="grid grid-cols-7 gap-2 text-center mb-2">
            {dayNames.map((d, i) => (
              <span key={i} className="text-[11px] font-bold text-slate-400 uppercase py-1">
                {d}
              </span>
            ))}
          </div>

          {/* Month Day Cells */}
          <div className="grid grid-cols-7 gap-2 flex-1 auto-rows-fr">
            {monthCalendarDays.map((d, i) => {
              if (!d) {
                return <div key={`empty-${i}`} className="bg-slate-50/40 rounded-xl border border-dashed border-slate-200" />;
              }

              const dStr = formatDateString(d);
              const isCurrentToday = isToday(d);
              const isDaySelected = selectedAppointment?.date === dStr;
              const dayAppointments = appointments.filter(a => a.date === dStr);

              return (
                <div
                  key={dStr}
                  onClick={() => {
                    if (dayAppointments.length > 0) {
                      onSelectAppointment(dayAppointments[0]);
                    }
                  }}
                  className={`p-2 rounded-xl border transition-all flex flex-col min-h-[90px] ${
                    isDaySelected
                      ? 'border-2 border-blue-600 bg-blue-50/70 shadow-sm ring-2 ring-blue-500/20'
                      : isCurrentToday
                      ? 'bg-blue-50/40 border-blue-300'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-bold ${
                        isDaySelected ? 'text-blue-700 font-extrabold' : isCurrentToday ? 'text-blue-600' : 'text-slate-800'
                      }`}>
                        {d.getDate()}
                      </span>
                      {isDaySelected && (
                        <span className="text-[8px] font-extrabold bg-blue-600 text-white px-1 py-0.2 rounded uppercase">
                          Aktiv
                        </span>
                      )}
                    </div>
                    {dayAppointments.length > 0 && (
                      <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center">
                        {dayAppointments.length}
                      </span>
                    )}
                  </div>

                  {/* Tiny appointment bars */}
                  <div className="space-y-1 flex-1 overflow-y-auto">
                    {dayAppointments.slice(0, 2).map((apt) => (
                      <div
                        key={apt.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectAppointment(apt);
                        }}
                        className={`text-[9px] px-1.5 py-0.5 rounded truncate font-medium cursor-pointer ${
                          selectedAppointment?.id === apt.id
                            ? 'bg-blue-600 text-white font-bold'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {apt.startTime} {apt.title}
                      </div>
                    ))}
                    {dayAppointments.length > 2 && (
                      <span className="text-[9px] text-slate-400 font-semibold block text-center">
                        +{dayAppointments.length - 2} weitere
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
