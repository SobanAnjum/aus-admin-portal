import { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Sliders, 
  Plus, 
  Trash2, 
  Save, 
  ChevronLeft, 
  ChevronRight, 
  Zap, 
  Lock, 
  Info,
  CalendarCheck,
  AlertCircle,
  CalendarDays,
  History
} from 'lucide-react';
import { 
  fetchAdminAvailabilities, 
  saveAdminAvailability, 
  batchSaveAdminAvailabilities 
} from '../../lib/supabase.ts';
import { AdminAvailability, DayAvailabilityStatus, CustomTimeSlot } from '../../types.ts';
import { Language, translations } from '../../lib/translations.ts';

interface AdminAvailabilityManagerProps {
  lang?: Language;
}

export default function AdminAvailabilityManager({ lang = 'de' }: AdminAvailabilityManagerProps) {
  const t = translations[lang] || translations.de;

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Current viewed month (0 = Current Month, 1 = Next Month)
  const [monthOffset, setMonthOffset] = useState<number>(0);
  const [availabilities, setAvailabilities] = useState<AdminAvailability[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Selected date inspector
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<DayAvailabilityStatus>('available_all_day');
  const [customSlots, setCustomSlots] = useState<CustomTimeSlot[]>([
    { startTime: '09:00', endTime: '12:00' },
    { startTime: '14:00', endTime: '17:00' }
  ]);
  const [notes, setNotes] = useState('');

  // Month names for labels
  const currentMonthName = new Date(currentYear, currentMonth, 1).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
  const nextMonthName = new Date(currentYear, currentMonth + 1, 1).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });

  // Target view date
  const viewDate = new Date(currentYear, currentMonth + monthOffset, 1);
  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();
  const monthName = viewDate.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });

  // Load availabilities from server/DB
  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminAvailabilities();
      setAvailabilities(data);
    } catch (err) {
      console.error('Failed to load availabilities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatDate = (y: number, m: number, d: number) => {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  };

  // Calendar grid generation
  const getDaysGrid = () => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
    const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; // Monday = 0
    const lastDayOfMonth = new Date(viewYear, viewMonth + 1, 0);
    const totalDays = lastDayOfMonth.getDate();

    const days = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = formatDate(viewYear, viewMonth, d);
      const dObj = new Date(viewYear, viewMonth, d);
      const dow = dObj.getDay(); // 0=Sun, 5=Fri
      const isWorkday = dow === 1 || dow === 2 || dow === 3 || dow === 4 || dow === 6;
      const isPast = dateStr < todayStr;
      const isToday = dateStr === todayStr;

      days.push({
        dayNumber: d,
        dateStr,
        dateObj: dObj,
        isWorkday,
        isPast,
        isToday,
      });
    }
    return days;
  };

  // Select a date to inspect/edit (only allowed for today or future dates)
  const handleSelectDate = (dateStr: string) => {
    if (dateStr < todayStr) return; // Prevent selecting past dates

    setSelectedDate(dateStr);
    const found = availabilities.find(a => a.date === dateStr);
    if (found) {
      setSelectedStatus(found.status);
      setCustomSlots(found.customSlots && found.customSlots.length > 0 ? found.customSlots : [
        { startTime: '09:00', endTime: '12:00' },
        { startTime: '14:00', endTime: '17:00' }
      ]);
      setNotes(found.notes || '');
    } else {
      setSelectedStatus('available_all_day');
      setCustomSlots([
        { startTime: '09:00', endTime: '12:00' },
        { startTime: '14:00', endTime: '17:00' }
      ]);
      setNotes('');
    }
  };

  // Save single date availability
  const handleSaveDate = async () => {
    if (!selectedDate || selectedDate < todayStr) return;
    setSaving(true);
    try {
      const updated = await saveAdminAvailability(
        selectedDate,
        selectedStatus,
        selectedStatus === 'custom_slots' ? customSlots : [],
        notes
      );
      setAvailabilities(prev => {
        const filtered = prev.filter(a => a.date !== selectedDate);
        return [...filtered, updated];
      });
      setSuccessMessage(`Verfügbarkeit für ${selectedDate} erfolgreich gespeichert!`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  // Batch Unlock all valid working days from TODAY onward in viewed month
  const handleBatchUnlockMonth = async () => {
    if (!confirm(`Möchten Sie alle kommenden regulären Beratungstage (Mo-Do & Sa) im ${monthName} ganztägig freischalten?`)) {
      return;
    }
    setSaving(true);
    try {
      // Only unlock dates that are today or in the future
      const days = getDaysGrid().filter(d => d !== null && d.isWorkday && d.dateStr >= todayStr) as any[];
      const dates = days.map(d => d.dateStr);
      if (dates.length === 0) {
        alert('Keine zukünftigen Beratungstage im gewählten Monat vorhanden.');
        setSaving(false);
        return;
      }
      await batchSaveAdminAvailabilities(dates, 'available_all_day');
      await loadData();
      setSuccessMessage(`Alle kommenden Beratungstage im ${monthName} wurden erfolgreich freigeschaltet!`);
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Fehler');
    } finally {
      setSaving(false);
    }
  };

  // Batch Lock all upcoming days in viewed month
  const handleBatchLockMonth = async () => {
    if (!confirm(`Möchten Sie alle kommenden Tage im ${monthName} sperren?`)) {
      return;
    }
    setSaving(true);
    try {
      const days = getDaysGrid().filter(d => d !== null && d.dateStr >= todayStr) as any[];
      const dates = days.map(d => d.dateStr);
      if (dates.length === 0) {
        alert('Keine zukünftigen Tage im gewählten Monat vorhanden.');
        setSaving(false);
        return;
      }
      await batchSaveAdminAvailabilities(dates, 'unavailable');
      await loadData();
      setSuccessMessage(`Alle kommenden Tage im ${monthName} wurden gesperrt.`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Fehler');
    } finally {
      setSaving(false);
    }
  };

  // Add custom slot
  const handleAddSlot = () => {
    setCustomSlots(prev => [...prev, { startTime: '10:00', endTime: '11:00' }]);
  };

  // Remove custom slot
  const handleRemoveSlot = (index: number) => {
    setCustomSlots(prev => prev.filter((_, i) => i !== index));
  };

  // Update slot time
  const handleSlotChange = (index: number, field: 'startTime' | 'endTime', val: string) => {
    setCustomSlots(prev => prev.map((s, i) => i === index ? { ...s, [field]: val } : s));
  };

  const isNextMonth = monthOffset === 1;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* Top Header & Month Switcher */}
      <div className="px-8 py-5 bg-white border-b border-slate-200 flex flex-wrap justify-between items-center gap-4 shrink-0 shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-blue-600" />
            <span>Verfügbarkeits- & Zeitfenster-Steuerung</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Vergangene Tage sind archiviert. Zukünftige Tage ab heute (<strong>{new Date().toLocaleDateString('de-DE')}</strong>) können flexibel freigeschaltet und angepasst werden.
          </p>
        </div>

        {/* 2 Editable Months Switcher */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs">
            <button
              onClick={() => { setMonthOffset(0); setSelectedDate(null); }}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
                monthOffset === 0 
                  ? 'bg-slate-900 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Aktueller Monat ({currentMonthName})</span>
            </button>
            <button
              onClick={() => { setMonthOffset(1); setSelectedDate(null); }}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
                monthOffset === 1 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Folgemonat ({nextMonthName})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden p-6 gap-6">
        {/* Left: Interactive Calendar */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          {/* Calendar Header & Quick Actions */}
          <div className="p-5 border-b border-slate-100 flex flex-wrap justify-between items-center gap-4 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => { setMonthOffset(0); setSelectedDate(null); }}
                  disabled={monthOffset === 0}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  title="Zum aktuellen Monat wechseln"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => { setMonthOffset(1); setSelectedDate(null); }}
                  disabled={monthOffset === 1}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  title="Zum Folgemonat wechseln"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <span className="text-base font-bold text-slate-900 capitalize font-serif-title">
                {monthName}
              </span>

              <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-md ${
                isNextMonth ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
              }`}>
                {isNextMonth ? 'Folgemonat (Bearbeitbar)' : 'Aktueller Monat (Ab heute)'}
              </span>
            </div>

            {/* Quick Batch Actions (Applies to upcoming dates) */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleBatchUnlockMonth}
                disabled={saving}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                title="Schaltet alle kommenden Mo-Do & Sa des Monats frei"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Kommende Tage freischalten</span>
              </button>

              <button
                onClick={handleBatchLockMonth}
                disabled={saving}
                className="px-3 py-1.5 bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-600 border border-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                title="Sperrt alle kommenden Tage des Monats"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Kommende Tage sperren</span>
              </button>
            </div>
          </div>

          {/* Success Banner */}
          {successMessage && (
            <div className="mx-5 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 border-b border-slate-100 text-center text-xs font-bold text-slate-400 py-2.5 bg-slate-50/30">
            <div>Mo</div>
            <div>Di</div>
            <div>Mi</div>
            <div>Do</div>
            <div className="text-slate-300">Fr (Gesperrt)</div>
            <div>Sa</div>
            <div className="text-slate-300">So (Gesperrt)</div>
          </div>

          {/* Days Grid */}
          <div className="flex-1 grid grid-cols-7 gap-1.5 p-4 overflow-y-auto">
            {getDaysGrid().map((day, idx) => {
              if (!day) {
                return <div key={`empty-${idx}`} className="bg-slate-50/20 rounded-xl" />;
              }

              const override = availabilities.find(a => a.date === day.dateStr);
              const isSelected = selectedDate === day.dateStr;

              // State determination
              let statusLabel = 'Nicht freigegeben';
              let statusStyle = 'border-slate-200 bg-slate-50 text-slate-400';
              let icon = <Lock className="w-3 h-3 opacity-60" />;

              // PAST DATES RULE: Grayed out and disabled from editing
              if (day.isPast) {
                statusLabel = 'Vergangen';
                statusStyle = 'border-slate-100 bg-slate-100/40 text-slate-400 cursor-not-allowed opacity-40 select-none';
                icon = <History className="w-3 h-3 text-slate-400" />;
              } else if (!day.isWorkday) {
                statusLabel = 'Ruhetag';
                statusStyle = 'border-slate-100 bg-slate-100/50 text-slate-300 cursor-not-allowed';
                icon = <XCircle className="w-3 h-3" />;
              } else if (override?.status === 'available_all_day') {
                statusLabel = 'Ganztägig (09-18)';
                statusStyle = 'border-emerald-300 bg-emerald-50/80 text-emerald-900';
                icon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
              } else if (override?.status === 'custom_slots') {
                statusLabel = `${override.customSlots?.length || 0} Zeitfenster`;
                statusStyle = 'border-amber-300 bg-amber-50/80 text-amber-900';
                icon = <Clock className="w-3.5 h-3.5 text-amber-600" />;
              } else if (override?.status === 'unavailable') {
                statusLabel = 'Gesperrt';
                statusStyle = 'border-red-200 bg-red-50/60 text-red-700';
                icon = <XCircle className="w-3.5 h-3.5 text-red-500" />;
              } else if (!isNextMonth) {
                // Current month default without override (from today onward)
                statusLabel = 'Regulär offen (09-18)';
                statusStyle = 'border-slate-200 bg-white text-slate-700 hover:border-blue-400';
                icon = <CheckCircle2 className="w-3 h-3 text-slate-400" />;
              }

              return (
                <button
                  key={day.dateStr}
                  disabled={day.isPast || !day.isWorkday}
                  onClick={() => handleSelectDate(day.dateStr)}
                  title={
                    day.isPast 
                      ? 'Vergangenes Datum – nicht mehr editierbar' 
                      : !day.isWorkday 
                      ? 'Freitags & Sonntags geschlossen' 
                      : `Klicken zum Bearbeiten (${day.dateStr})`
                  }
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all relative min-h-[78px] ${statusStyle} ${
                    isSelected ? 'ring-2 ring-blue-600 ring-offset-2 border-blue-600 shadow-sm' : ''
                  } ${!day.isPast && day.isWorkday ? 'cursor-pointer hover:shadow-2xs' : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-xs flex items-center gap-1">
                      {day.dayNumber}
                      {day.isToday && (
                        <span className="text-[9px] bg-blue-600 text-white px-1.5 py-0.2 rounded-full font-bold">
                          Heute
                        </span>
                      )}
                    </span>
                    <span>{icon}</span>
                  </div>

                  <span className="text-[10px] font-medium truncate mt-1">
                    {statusLabel}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="px-5 py-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2 bg-slate-50/40">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-300 opacity-60" />
              <span>Vergangene Tage (Archiviert & Nicht editierbar)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Ganztägig offen</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Zeitfenster</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span>Gesperrt</span>
            </span>
          </div>
        </div>

        {/* Right: Date Inspector & Time Frame Editor */}
        <div className="w-96 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden shrink-0">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              <span>Tages-Konfiguration</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {selectedDate ? (
                <strong className="text-slate-700">
                  {new Date(selectedDate).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                </strong>
              ) : (
                'Wählen Sie einen kommenden Tag ab heute'
              )}
            </p>
          </div>

          <div className="p-5 flex-1 overflow-y-auto space-y-5">
            {!selectedDate ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <CalendarIcon className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-xs">Klicken Sie auf ein Datum ab heute im Kalender, um die Verfügbarkeit oder individuelle Zeitfenster anzupassen.</p>
              </div>
            ) : (
              <>
                {/* Status Radio Options */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Verfügbarkeits-Status
                  </label>

                  <div 
                    onClick={() => setSelectedStatus('available_all_day')}
                    className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                      selectedStatus === 'available_all_day' 
                        ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 font-bold' 
                        : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 className={`w-4 h-4 ${selectedStatus === 'available_all_day' ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <div>
                      <div className="text-xs">Ganztägig verfügbar</div>
                      <div className="text-[11px] font-normal text-slate-500">Reguläre Termine (09:00 – 18:00 Uhr)</div>
                    </div>
                  </div>

                  <div 
                    onClick={() => setSelectedStatus('custom_slots')}
                    className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                      selectedStatus === 'custom_slots' 
                        ? 'border-amber-500 bg-amber-50/70 text-amber-950 font-bold' 
                        : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Clock className={`w-4 h-4 ${selectedStatus === 'custom_slots' ? 'text-amber-600' : 'text-slate-400'}`} />
                    <div>
                      <div className="text-xs">Benutzerdefinierte Zeitfenster</div>
                      <div className="text-[11px] font-normal text-slate-500">Nur bestimmte Uhrzeiten freigeben</div>
                    </div>
                  </div>

                  <div 
                    onClick={() => setSelectedStatus('unavailable')}
                    className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                      selectedStatus === 'unavailable' 
                        ? 'border-red-500 bg-red-50/70 text-red-950 font-bold' 
                        : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <XCircle className={`w-4 h-4 ${selectedStatus === 'unavailable' ? 'text-red-600' : 'text-slate-400'}`} />
                    <div>
                      <div className="text-xs">Tag komplett sperren</div>
                      <div className="text-[11px] font-normal text-slate-500">Keine Buchungen möglich</div>
                    </div>
                  </div>
                </div>

                {/* Custom Time Slots Editor */}
                {selectedStatus === 'custom_slots' && (
                  <div className="space-y-3 pt-2 border-t border-slate-100 animate-in fade-in">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Freigegebene Zeitfenster
                      </label>
                      <button
                        type="button"
                        onClick={handleAddSlot}
                        className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Slot hinzufügen</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {customSlots.map((slot, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                          <input
                            type="time"
                            value={slot.startTime}
                            onChange={(e) => handleSlotChange(index, 'startTime', e.target.value)}
                            className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 focus:outline-none"
                          />
                          <span className="text-xs text-slate-400">bis</span>
                          <input
                            type="time"
                            value={slot.endTime}
                            onChange={(e) => handleSlotChange(index, 'endTime', e.target.value)}
                            className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveSlot(index)}
                            className="p-1 text-slate-400 hover:text-red-600 cursor-pointer ml-auto"
                            title="Löschen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Interne Notiz (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="z.B. Nur Nachmittagstermine wg. Mandantentermin"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-slate-900"
                  />
                </div>
              </>
            )}
          </div>

          {/* Footer with Save Button */}
          {selectedDate && (
            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
              <button
                type="button"
                onClick={handleSaveDate}
                disabled={saving}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-99 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                {saving ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Verfügbarkeit speichern</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
