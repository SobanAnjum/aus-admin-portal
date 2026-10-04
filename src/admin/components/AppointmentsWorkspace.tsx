import { useState, useEffect } from 'react';
import CalendarView from './CalendarView.tsx';
import AppointmentDetails from './AppointmentDetails.tsx';
import EditAppointmentModal from './EditAppointmentModal.tsx';
import { Appointment, Advisor, AppointmentStatus, ViewMode } from '../../types.ts';
import { Language, translations } from '../../lib/translations.ts';
import { Search, Filter, Plus, CalendarDays, RefreshCw } from 'lucide-react';

interface AppointmentsWorkspaceProps {
  appointments: Appointment[];
  selectedAppointment: Appointment | null;
  advisors: Advisor[];
  onSelectAppointment: (appointment: Appointment | null) => void;
  onUpdateStatus: (id: number, status: AppointmentStatus) => Promise<void>;
  onUpdateAppointment: (id: number, updates: any) => Promise<void>;
  onDeleteAppointment: (id: number) => Promise<void>;
  onAttachDocument: (id: number, fileName: string) => Promise<void>;
  onOpenNewModal: () => void;
  onOpenChatForAppointment?: (appointment: Appointment) => void;
  onRefreshData: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  lang: Language;
}

export default function AppointmentsWorkspace({
  appointments,
  selectedAppointment,
  advisors,
  onSelectAppointment,
  onUpdateStatus,
  onUpdateAppointment,
  onDeleteAppointment,
  onAttachDocument,
  onOpenNewModal,
  onOpenChatForAppointment,
  onRefreshData,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  lang,
}: AppointmentsWorkspaceProps) {
  const t = translations[lang];

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('Woche');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [appointmentToEdit, setAppointmentToEdit] = useState<Appointment | null>(null);

  // Jump calendar to selected appointment date whenever selectedAppointment changes
  useEffect(() => {
    if (selectedAppointment && selectedAppointment.date) {
      const parts = selectedAppointment.date.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
          setCurrentDate(new Date(y, m, d));
        }
      }
    }
  }, [selectedAppointment]);

  const handleOpenEditModal = (apt: Appointment) => {
    setAppointmentToEdit(apt);
    setIsEditModalOpen(true);
  };

  const statusOptions = [
    { id: 'Alle', label: 'Alle' },
    { id: 'Scheduled', label: 'Geplant' },
    { id: 'In Progress', label: 'In Bearbeitung' },
    { id: 'Query Completed', label: 'Abgeschlossen' },
    { id: 'Rescheduled', label: 'Verschoben' },
    { id: 'Canceled', label: 'Storniert' },
    { id: 'Not Attended', label: 'Nicht wahrgen.' },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
      {/* Workspace Control Bar */}
      <div className="px-8 py-4 bg-white border-b border-slate-200 flex flex-wrap justify-between items-center gap-4 shrink-0 shadow-2xs">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-blue-600" />
              <span>Termin-Management & Kalender</span>
            </h2>
            <p className="text-xs text-slate-400">
              {appointments.length} Termine im System
            </p>
          </div>
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto">
            {statusOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setStatusFilter(opt.id)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === opt.id || (opt.id === 'Scheduled' && statusFilter === 'Bestätigt')
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Refresh button */}
          <button
            onClick={onRefreshData}
            className="p-2 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-xs"
            title="Aktualisieren"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* New Appointment Button */}
          <button
            onClick={onOpenNewModal}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Neuer Termin</span>
          </button>
        </div>
      </div>

      {/* Main Canvas: Calendar + Side Inspector */}
      <div className="flex-1 flex overflow-hidden">
        {/* Calendar View Area */}
        <div className="flex-1 p-6 overflow-y-auto">
          <CalendarView
            appointments={appointments}
            selectedAppointment={selectedAppointment}
            onSelectAppointment={(apt) => onSelectAppointment(apt)}
            currentDate={currentDate}
            setCurrentDate={setCurrentDate}
            viewMode={viewMode}
            setViewMode={setViewMode}
            lang={lang}
          />
        </div>

        {/* Side Details Inspector */}
        <AppointmentDetails
          appointment={selectedAppointment}
          onClose={() => onSelectAppointment(null)}
          onUpdateStatus={onUpdateStatus}
          onAttachDocument={onAttachDocument}
          onOpenEditModal={handleOpenEditModal}
          onOpenChatForAppointment={onOpenChatForAppointment}
          lang={lang}
        />
      </div>

      {/* Edit Appointment Modal */}
      <EditAppointmentModal
        isOpen={isEditModalOpen}
        appointment={appointmentToEdit}
        advisors={advisors}
        onClose={() => {
          setIsEditModalOpen(false);
          setAppointmentToEdit(null);
        }}
        onUpdateAppointment={onUpdateAppointment}
        onDeleteAppointment={onDeleteAppointment}
        lang={lang}
      />
    </div>
  );
}
