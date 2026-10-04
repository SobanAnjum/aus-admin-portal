import React, { useState, useEffect } from 'react';
import { Client, Advisor } from '../../types.ts';
import { X, CalendarDays, UserPlus, FileText, Clock, UserCheck, Phone, Mail } from 'lucide-react';
import { Language, translations } from '../../lib/translations.ts';

interface NewAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  advisors: Advisor[];
  onAddClient: (client: { name: string; email: string; phone: string; company?: string; sinceYear: number }) => Promise<Client>;
  onAddAppointment: (appointment: {
    clientId: number;
    advisorId: number | null;
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    notes: string;
  }) => Promise<void>;
  lang: Language;
}

export default function NewAppointmentModal({
  isOpen,
  onClose,
  clients,
  advisors,
  onAddClient,
  onAddAppointment,
  lang
}: NewAppointmentModalProps) {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<'appointment' | 'client'>('appointment');

  // Appointment Form States
  const [selectedClientId, setSelectedClientId] = useState('');
  const [title, setTitle] = useState('Steuerberatung & Steuergestaltung');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:30');
  const [notes, setNotes] = useState('');
  const [selectedAdvisorId, setSelectedAdvisorId] = useState('');
  const [appError, setAppError] = useState('');
  const [appLoading, setAppLoading] = useState(false);

  // Client Form States
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [clientSinceYear, setClientSinceYear] = useState(new Date().getFullYear());
  const [clientError, setClientError] = useState('');
  const [clientLoading, setClientLoading] = useState(false);
  const [clientSuccess, setClientSuccess] = useState('');

  useEffect(() => {
    if (clients.length > 0 && !selectedClientId) {
      setSelectedClientId(String(clients[0].id));
    }
  }, [clients]);

  useEffect(() => {
    if (advisors.length > 0 && !selectedAdvisorId) {
      setSelectedAdvisorId(String(advisors[0].id));
    }
  }, [advisors]);

  if (!isOpen) return null;

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientError('');
    setClientSuccess('');
    if (!clientName.trim() || !clientEmail.trim()) {
      setClientError('Bitte geben Sie Name und E-Mail des Mandanten an.');
      return;
    }

    setClientLoading(true);
    try {
      const newClient = await onAddClient({
        name: clientName,
        email: clientEmail,
        phone: clientPhone,
        company: clientCompany,
        sinceYear: clientSinceYear
      });
      setClientSuccess(`Mandant "${newClient.name}" wurde angelegt.`);
      setSelectedClientId(String(newClient.id));
      setClientName('');
      setClientEmail('');
      setClientPhone('');
      setClientCompany('');
      
      setTimeout(() => {
        setActiveTab('appointment');
        setClientSuccess('');
      }, 1200);
    } catch (err: any) {
      setClientError(err.message || 'Fehler beim Erstellen des Mandanten.');
    } finally {
      setClientLoading(false);
    }
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setAppError('');
    if (!selectedClientId) {
      setAppError('Bitte wählen Sie einen Mandanten aus.');
      return;
    }
    if (!title.trim() || !date || !startTime || !endTime) {
      setAppError('Bitte füllen Sie alle erforderlichen Pflichtfelder aus.');
      return;
    }

    setAppLoading(true);
    try {
      await onAddAppointment({
        clientId: parseInt(selectedClientId),
        advisorId: selectedAdvisorId ? parseInt(selectedAdvisorId) : null,
        title,
        date,
        startTime,
        endTime,
        notes
      });
      
      setNotes('');
      onClose();
    } catch (err: any) {
      setAppError(err.message || 'Fehler beim Anlegen des Termins.');
    } finally {
      setAppLoading(false);
    }
  };

  const services = [
    'Steuerberatung & Steuergestaltung',
    'Wirtschaftsprüfung & Jahresabschlüsse',
    'Unternehmensberatung & Strategie',
    'Investitions- & Finanzanalyse',
    'Unternehmensnachfolge & Erbschaftsteuer',
    'Digitale Finanzbuchhaltung & Payroll',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
              A
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              {activeTab === 'appointment' ? 'Neuen Termin einpflegen' : 'Neuen Mandanten anlegen'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={() => setActiveTab('appointment')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all border-b-2 ${
              activeTab === 'appointment'
                ? 'border-blue-600 text-blue-600 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>Termin anlegen</span>
          </button>
          
          <button
            type="button"
            onClick={() => setActiveTab('client')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all border-b-2 ${
              activeTab === 'client'
                ? 'border-blue-600 text-blue-600 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Mandant erfassen</span>
          </button>
        </div>

        {/* Tab Content: New Appointment */}
        {activeTab === 'appointment' && (
          <form onSubmit={handleCreateAppointment} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
            {appError && (
              <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-xl">
                {appError}
              </div>
            )}

            {/* Client Select */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Mandant *
              </label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-blue-600 focus:bg-white"
              >
                <option value="">-- Mandanten auswählen --</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Service */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Beratungsthema *
              </label>
              <select
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-blue-600 focus:bg-white"
              >
                {services.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Date & Time Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Datum *
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-blue-600 focus:bg-white"
                />
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

            {/* Advisor */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Zuständiger Berater (Optional)
              </label>
              <select
                value={selectedAdvisorId}
                onChange={(e) => setSelectedAdvisorId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-blue-600 focus:bg-white"
              >
                <option value="">-- Nicht zugewiesen / Selbst --</option>
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
                Interne Notizen
              </label>
              <textarea
                rows={2}
                placeholder="Notizen zum Beratungsgespräch..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={appLoading}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs cursor-pointer"
              >
                {appLoading ? 'Wird angelegt...' : 'Termin speichern'}
              </button>
            </div>
          </form>
        )}

        {/* Tab Content: New Client */}
        {activeTab === 'client' && (
          <form onSubmit={handleCreateClient} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
            {clientSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl">
                {clientSuccess}
              </div>
            )}
            {clientError && (
              <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-xl">
                {clientError}
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Name / Ansprechpartner *
              </label>
              <input
                type="text"
                required
                placeholder="z.B. Dr. Hans Schneider"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                E-Mail-Adresse *
              </label>
              <input
                type="email"
                required
                placeholder="hans.schneider@muster.de"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Telefonnummer
              </label>
              <input
                type="tel"
                placeholder="+49 89 123456"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Unternehmen
              </label>
              <input
                type="text"
                placeholder="Muster GmbH"
                value={clientCompany}
                onChange={(e) => setClientCompany(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={clientLoading}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs cursor-pointer"
              >
                {clientLoading ? 'Wird gespeichert...' : 'Mandant anlegen'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
