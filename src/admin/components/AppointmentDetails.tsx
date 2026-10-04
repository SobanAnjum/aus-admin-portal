import React, { useState, useEffect } from 'react';
import { Appointment, AppointmentDocument, AppointmentStatus } from '../../types.ts';
import { Language, translations } from '../../lib/translations.ts';
import { getApiUrl } from '../../lib/api.ts';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  Download, 
  FileText, 
  Calendar, 
  Clock, 
  AlertCircle, 
  Edit3, 
  CheckCircle2, 
  AlertTriangle, 
  Building, 
  UserCheck,
  Tag,
  CalendarDays,
  MessageSquare,
  Save,
  Check
} from 'lucide-react';

interface AppointmentDetailsProps {
  appointment: Appointment | null;
  onClose: () => void;
  onUpdateStatus: (id: number, status: AppointmentStatus) => void;
  onAttachDocument: (id: number, fileName: string) => Promise<void>;
  onOpenEditModal: (appointment: Appointment) => void;
  onOpenChatForAppointment?: (appointment: Appointment) => void;
  onUpdateTaskReason?: (id: number, taskReason: string) => Promise<void>;
  lang: Language;
}

export default function AppointmentDetails({
  appointment,
  onClose,
  onUpdateStatus,
  onAttachDocument,
  onOpenEditModal,
  onOpenChatForAppointment,
  onUpdateTaskReason,
  lang,
}: AppointmentDetailsProps) {
  const t = translations[lang];
  const [documents, setDocuments] = useState<AppointmentDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // Editable Task/Reason
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [taskReasonText, setTaskReasonText] = useState('');
  const [savingTask, setSavingTask] = useState(false);

  useEffect(() => {
    if (!appointment) return;
    setTaskReasonText(appointment.taskReason || 'Erstberatung');
    setIsEditingTask(false);

    const fetchDocs = async () => {
      setLoadingDocs(true);
      try {
        const res = await fetch(getApiUrl(`/api/appointments/${appointment.id}/documents`), {
          headers: {
            Authorization: `Bearer ${(window as any).firebaseToken || 'demo-token'}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setDocuments(data);
        }
      } catch (err) {
        console.error('Error fetching documents:', err);
      } finally {
        setLoadingDocs(false);
      }
    };

    fetchDocs();
  }, [appointment]);

  if (!appointment) {
    return (
      <aside className="w-96 bg-white border-l border-slate-200 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center text-slate-300 mb-4 shadow-inner">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Kein Termin ausgewählt</h3>
        <p className="text-xs text-slate-400 mt-2 max-w-xs leading-relaxed">
          Wählen Sie einen Termin im Kalender aus, um Details, Mandantendaten, Dokumente und Verwaltungsoptionen anzuzeigen.
        </p>
      </aside>
    );
  }

  const handleSaveTaskReason = async () => {
    if (!taskReasonText.trim()) return;
    setSavingTask(true);
    try {
      if (onUpdateTaskReason) {
        await onUpdateTaskReason(appointment.id, taskReasonText.trim());
      } else {
        await fetch(getApiUrl(`/api/appointments/${appointment.id}`), {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${(window as any).firebaseToken || 'demo-token'}`,
          },
          body: JSON.stringify({ taskReason: taskReasonText.trim() }),
        });
      }
      setIsEditingTask(false);
    } catch (err) {
      console.error('Failed to save task reason:', err);
    } finally {
      setSavingTask(false);
    }
  };

  const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case 'Scheduled':
      case 'Bestätigt':
        return (
          <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Geplant / Bestätigt
          </span>
        );
      case 'In Progress':
        return (
          <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full border border-blue-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            In Bearbeitung
          </span>
        );
      case 'Query Completed':
        return (
          <span className="bg-purple-50 text-purple-700 text-xs font-bold px-2.5 py-1 rounded-full border border-purple-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            Anfrage abgeschlossen
          </span>
        );
      case 'Rescheduled':
      case 'Verschoben':
        return (
          <span className="bg-amber-50 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Verschoben
          </span>
        );
      case 'Canceled':
      case 'Storniert':
        return (
          <span className="bg-red-50 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full border border-red-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            Storniert
          </span>
        );
      case 'Not Attended':
        return (
          <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-full border border-slate-300 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
            Nicht wahrgenommen
          </span>
        );
      default:
        return (
          <span className="bg-slate-50 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-full border border-slate-200">
            {status}
          </span>
        );
    }
  };

  const isAttended = appointment.status !== 'Not Attended' && appointment.status !== 'Canceled';

  return (
    <aside className={`w-96 bg-white ${lang === 'ur' ? 'border-r' : 'border-l'} border-slate-200 flex flex-col p-6 z-20 shadow-xs`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-5 pb-3 border-b border-slate-100">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Termin-Inspektor
          </span>
          <h3 className="text-sm font-bold text-slate-900 mt-0.5">{t.details_title || 'Termin-Details'}</h3>
        </div>
        <button 
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-800 transition-colors cursor-pointer rounded-lg hover:bg-slate-100"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4 flex-1 overflow-y-auto pr-1">
        {/* Action Button: Edit or Open Chat */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onOpenEditModal(appointment)}
            className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Verschieben</span>
          </button>

          {onOpenChatForAppointment && (
            <button
              onClick={() => onOpenChatForAppointment(appointment)}
              className="py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Termin-Chat</span>
            </button>
          )}
        </div>

        {/* Client Card */}
        <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center gap-3 mb-2.5">
            <div className="w-9 h-9 bg-slate-900 text-slate-100 rounded-xl flex items-center justify-center font-bold text-xs uppercase shrink-0">
              {appointment.client.name.substring(0, 2)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate" title={appointment.client.name}>
                {appointment.client.name}
              </p>
              <span className="text-[10px] text-slate-400 font-semibold uppercase">
                {appointment.isGuest ? 'Gastbuchung' : `Mandant seit ${appointment.client.sinceYear || 2024}`}
              </span>
            </div>
          </div>
          
          <div className="space-y-1.5 pt-2.5 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate font-medium">{appointment.client.email}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-medium">{appointment.client.phone || 'Keine Telefonnummer'}</span>
            </div>
            {appointment.client.company && (
              <div className="flex items-center gap-2 text-slate-600">
                <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-medium truncate">{appointment.client.company}</span>
              </div>
            )}
          </div>
        </div>

        {/* Task / Reason (Admin Editable) */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[9px] flex items-center gap-1">
              <Tag className="w-3 h-3 text-blue-600" />
              <span>Aufgabe / Anliegen</span>
            </span>
            {!isEditingTask ? (
              <button
                onClick={() => setIsEditingTask(true)}
                className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
              >
                Bearbeiten
              </button>
            ) : (
              <button
                onClick={handleSaveTaskReason}
                disabled={savingTask}
                className="text-[10px] font-bold text-emerald-700 hover:underline cursor-pointer flex items-center gap-0.5"
              >
                <Save className="w-3 h-3" />
                <span>Speichern</span>
              </button>
            )}
          </div>

          {isEditingTask ? (
            <textarea
              rows={2}
              value={taskReasonText}
              onChange={(e) => setTaskReasonText(e.target.value)}
              className="w-full p-2 text-xs bg-white border border-slate-300 rounded-lg outline-none focus:border-slate-900"
            />
          ) : (
            <p className="font-bold text-slate-900 text-xs">
              {appointment.taskReason || 'Erstberatung'}
            </p>
          )}
        </div>

        {/* Appointment Metadata */}
        <div className="space-y-2.5 bg-white p-4 border border-slate-200 rounded-xl shadow-xs text-xs">
          <div className="flex justify-between items-center">
            <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Leistung</span>
            <span className="font-bold text-slate-800 text-right">{appointment.title}</span>
          </div>

          {appointment.bookingRef && (
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Buchungs-Ref</span>
              <span className="font-mono font-bold text-blue-600">{appointment.bookingRef}</span>
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Datum</span>
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>{appointment.date}</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Uhrzeit</span>
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>{appointment.startTime} - {appointment.endTime} Uhr</span>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-slate-100">
            <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Aktueller Status</span>
            {getStatusBadge(appointment.status)}
          </div>
        </div>

        {/* Labeled Documents Shelf */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Dokumente & Belege ({documents.length})
            </p>
          </div>
          
          {loadingDocs ? (
            <div className="text-center py-3 text-xs text-slate-400">
              Lädt Dokumente...
            </div>
          ) : (
            <div className="space-y-1.5">
              {documents.map((doc) => (
                <div 
                  key={doc.id}
                  className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {doc.label || doc.fileName}
                        </span>
                        {doc.documentDate && (
                          <span className="text-[9px] font-mono bg-blue-50 text-blue-700 px-1 py-0.2 rounded border border-blue-200">
                            {doc.documentDate}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{doc.fileName} • {doc.fileSize}</p>
                    </div>
                  </div>
                  <a
                    href={doc.fileUrl || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-slate-400 hover:text-slate-800 rounded-md hover:bg-slate-100 cursor-pointer"
                    title="Herunterladen"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
              {documents.length === 0 && (
                <div className="text-center py-3 text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
                  Keine Dokumente für diesen Termin vorhanden.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Admin Status Lifecycle Selector */}
      <div className="mt-4 pt-3 border-t border-slate-200 space-y-2">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
          Status setzen:
        </label>

        <div className="grid grid-cols-2 gap-1.5 text-xs">
          <button
            onClick={() => onUpdateStatus(appointment.id, 'Scheduled')}
            className={`py-1.5 px-2 rounded-lg font-bold transition-all cursor-pointer ${
              appointment.status === 'Scheduled' || appointment.status === 'Bestätigt'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-emerald-50'
            }`}
          >
            Geplant
          </button>

          <button
            onClick={() => onUpdateStatus(appointment.id, 'In Progress')}
            className={`py-1.5 px-2 rounded-lg font-bold transition-all cursor-pointer ${
              appointment.status === 'In Progress'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-blue-50'
            }`}
          >
            In Bearbeitung
          </button>

          <button
            onClick={() => onUpdateStatus(appointment.id, 'Query Completed')}
            className={`py-1.5 px-2 rounded-lg font-bold transition-all cursor-pointer ${
              appointment.status === 'Query Completed'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-purple-50'
            }`}
          >
            Abgeschlossen
          </button>

          <button
            onClick={() => onUpdateStatus(appointment.id, 'Not Attended')}
            className={`py-1.5 px-2 rounded-lg font-bold transition-all cursor-pointer ${
              appointment.status === 'Not Attended'
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Nicht wahrgen.
          </button>
        </div>

        <div className="flex gap-1.5 pt-1">
          <button
            onClick={() => onUpdateStatus(appointment.id, 'Rescheduled')}
            className="flex-1 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs rounded-lg border border-amber-200 cursor-pointer"
          >
            Verschoben
          </button>
          <button
            onClick={() => onUpdateStatus(appointment.id, 'Canceled')}
            className="flex-1 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-lg border border-red-200 cursor-pointer"
          >
            Stornieren
          </button>
        </div>
      </div>
    </aside>
  );
}
