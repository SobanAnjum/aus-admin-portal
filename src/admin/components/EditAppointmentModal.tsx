import React, { useState, useEffect } from 'react';
import { Appointment, Advisor, AppointmentStatus } from '../../types.ts';
import { 
  X, 
  Calendar, 
  Clock, 
  UserCheck, 
  FileText, 
  Trash2, 
  Save, 
  AlertTriangle,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Language, translations } from '../../lib/translations.ts';

interface EditAppointmentModalProps {
  isOpen: boolean;
  appointment: Appointment | null;
  advisors: Advisor[];
  onClose: () => void;
  onUpdateAppointment: (id: number, updates: Partial<{
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    status: AppointmentStatus;
    notes: string;
    advisorId: number | null;
  }>) => Promise<void>;
  onDeleteAppointment: (id: number) => Promise<void>;
  lang: Language;
}

export default function EditAppointmentModal({
  isOpen,
  appointment,
  advisors,
  onClose,
  onUpdateAppointment,
  onDeleteAppointment,
  lang
}: EditAppointmentModalProps) {
  const t = translations[lang];

  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [status, setStatus] = useState<AppointmentStatus>('Bestätigt');
  const [notes, setNotes] = useState('');
  const [advisorId, setAdvisorId] = useState<string>('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (appointment) {
      setTitle(appointment.title);
      setDate(appointment.date);
      setStartTime(appointment.startTime);
      setEndTime(appointment.endTime);
      setStatus(appointment.status);
      setNotes(appointment.notes || '');
      setAdvisorId(appointment.advisor ? String(appointment.advisor.id) : '');
      setConfirmDelete(false);
      setError('');
    }
  }, [appointment]);

  if (!isOpen || !appointment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date || !startTime || !endTime) {
      setError('Bitte füllen Sie alle erforderlichen Pflichtfelder aus.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onUpdateAppointment(appointment.id, {
        title,
        date,
        startTime,
        endTime,
        status,
        notes,
        advisorId: advisorId ? parseInt(advisorId) : null,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Fehler beim Aktualisieren des Termins.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setLoading(true);
    try {
      await onDeleteAppointment(appointment.id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Fehler beim Löschen des Termins.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
          <div>
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
              Termin-Verwaltung
            </span>
            <h3 className="text-base font-bold text-white mt-0.5">
              Termin bearbeiten & verschieben
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Client summary box */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mandant</span>
              <strong className="text-slate-900 text-sm">{appointment.client.name}</strong>
              <span className="text-slate-500 block text-[11px] mt-0.5">{appointment.client.email}</span>
            </div>
            {appointment.bookingRef && (
              <span className="px-2 py-1 bg-white border border-slate-200 text-slate-600 font-mono text-[10px] font-bold rounded-md">
                {appointment.bookingRef}
              </span>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Beratungsthema / Leistung *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
            />
          </div>

          {/* Status Selection */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Status des Termins *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Bestätigt', 'Verschoben', 'Storniert'] as AppointmentStatus[]).map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                    status === s
                      ? s === 'Bestätigt'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-2 ring-emerald-600/20'
                        : s === 'Verschoben'
                        ? 'bg-amber-50 text-amber-700 border-amber-300 ring-2 ring-amber-600/20'
                        : 'bg-red-50 text-red-700 border-red-300 ring-2 ring-red-600/20'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Reschedule Date & Times */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Datum *
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Startzeit *
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Endzeit *
              </label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>
          </div>

          {/* Advisor Assignment */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Zuständiger Berater
            </label>
            <select
              value={advisorId}
              onChange={(e) => setAdvisorId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-blue-600 focus:bg-white"
            >
              <option value="">-- Nicht zugewiesen / Kanzleiteam --</option>
              {advisors.map((adv) => (
                <option key={adv.id} value={adv.id}>
                  {adv.name} ({adv.title || adv.role})
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Interne Notizen & Gesprächsverlauf
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notizen zum Sachstand oder Grund für Terminänderung..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-blue-600 focus:bg-white"
            />
          </div>

          {/* Danger zone / Delete button */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={handleDelete}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                confirmDelete
                  ? 'bg-red-600 text-white animate-pulse'
                  : 'text-red-600 hover:bg-red-50'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{confirmDelete ? 'Wirklich endgültig löschen?' : 'Termin löschen'}</span>
            </button>
            {confirmDelete && (
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-medium underline"
              >
                Abbrechen
              </button>
            )}
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg transition-all cursor-pointer"
          >
            Abbrechen
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
          >
            {loading ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>Änderungen speichern</span>
          </button>
        </div>
      </div>
    </div>
  );
}
