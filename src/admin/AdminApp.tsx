import { useState, useEffect } from 'react';
import { supabase, signOut as supabaseSignOut } from '../lib/supabase.ts';
import { Appointment, Client, Advisor, AppointmentStatus } from '../types.ts';
import { Language, translations } from '../lib/translations.ts';
import { getApiUrl } from '../lib/api.ts';

// Admin Components
import AdminSidebar from './components/AdminSidebar.tsx';
import AdminHeader from './components/AdminHeader.tsx';
import DashboardOverview from './components/DashboardOverview.tsx';
import AppointmentsWorkspace from './components/AppointmentsWorkspace.tsx';
import AdminChatHub from './components/AdminChatHub.tsx';
import AdminAvailabilityManager from './components/AdminAvailabilityManager.tsx';
import ClientsDirectory from './components/ClientsDirectory.tsx';
import SettingsView from './components/SettingsView.tsx';
import HelpCenterView from './components/HelpCenterView.tsx';
import NewAppointmentModal from './components/NewAppointmentModal.tsx';
import LoginScreen from './components/LoginScreen.tsx';

interface AdminAppProps {
  lang: Language;
  onChangeLanguage: (lang: Language) => void;
}

export default function AdminApp({
  lang,
  onChangeLanguage,
}: AdminAppProps) {
  const t = translations[lang];

  // Auth State
  const [currentUser, setCurrentUser] = useState<any | null>(() => {
    try {
      const saved = localStorage.getItem('aus_admin_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return Boolean(localStorage.getItem('idToken') && localStorage.getItem('aus_admin_user'));
  });

  // Navigation State
  const [activeTab, setActiveTab] = useState<string>('Übersicht');

  // Data State
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // Filters & Modal States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Alle');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);

  // Sync Supabase auth state and token
  useEffect(() => {
    const existingToken = localStorage.getItem('idToken');
    if (existingToken) {
      (window as any).firebaseToken = existingToken;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsAuthenticated(true);
        const token = (session as any)?.access_token || localStorage.getItem('idToken') || 'admin-token';
        (window as any).firebaseToken = token;
        localStorage.setItem('idToken', token);

        fetch(getApiUrl('/api/users/me'), {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then(res => res.json())
          .then(profile => {
            setCurrentUser(profile);
            localStorage.setItem('aus_admin_user', JSON.stringify(profile));
          })
          .catch(err => console.warn('User profile fetch fallback:', err));
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setIsAuthenticated(true);
        const token = (session as any)?.access_token || localStorage.getItem('idToken') || 'admin-token';
        (window as any).firebaseToken = token;
        localStorage.setItem('idToken', token);

        try {
          const res = await fetch(getApiUrl('/api/users/me'), {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const profile = await res.json();
            setCurrentUser(profile);
            localStorage.setItem('aus_admin_user', JSON.stringify(profile));
          }
        } catch (err) {
          console.warn('Profile sync:', err);
        }
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setCurrentUser(null);
        localStorage.removeItem('idToken');
        localStorage.removeItem('aus_admin_user');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch Calendar Data, Clients and Advisors
  const fetchData = async () => {
    setDataLoading(true);
    try {
      const token = (window as any).firebaseToken || 'demo-token';

      // Fetch Clients
      const clientsRes = await fetch(getApiUrl('/api/clients'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (clientsRes.ok) {
        const clientsData = await clientsRes.json();
        setClients(clientsData);
      }

      // Fetch Advisors
      const advisorsRes = await fetch(getApiUrl('/api/users'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (advisorsRes.ok) {
        const advisorsData = await advisorsRes.json();
        setAdvisors(advisorsData);
      }

      // Fetch Appointments with search & status query
      const queryParams = new URLSearchParams();
      if (searchQuery) queryParams.set('search', searchQuery);
      if (statusFilter && statusFilter !== 'Alle') queryParams.set('status', statusFilter);

      const appointmentsRes = await fetch(getApiUrl(`/api/appointments?${queryParams.toString()}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (appointmentsRes.ok) {
        const aptsData = await appointmentsRes.json();
        setAppointments(aptsData);

        if (aptsData.length > 0) {
          const stillExists = aptsData.find((a: Appointment) => a.id === selectedAppointment?.id);
          setSelectedAppointment(stillExists || aptsData[0]);
        } else {
          setSelectedAppointment(null);
        }
      }
    } catch (err) {
      console.error('Failed to load system data:', err);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      fetchData();
    }
  }, [isAuthenticated, currentUser, searchQuery, statusFilter]);

  const handleSignOut = async () => {
    try {
      await supabaseSignOut();
    } catch (e) {
      // ignore
    }
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem('idToken');
    localStorage.removeItem('aus_admin_user');
    (window as any).firebaseToken = null;
    setAppointments([]);
    setClients([]);
    setAdvisors([]);
    setSelectedAppointment(null);
  };

  // Add a Client
  const handleAddClient = async (newClient: { name: string; email: string; phone: string; company?: string; sinceYear: number }) => {
    const token = (window as any).firebaseToken || 'demo-token';
    const res = await fetch(getApiUrl('/api/clients'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(newClient),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Fehler beim Anlegen des Mandanten.');
    }

    const created = await res.json();
    setClients((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
    return created;
  };

  // Add an Appointment
  const handleAddAppointment = async (newApt: {
    clientId: number;
    advisorId: number | null;
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    notes: string;
    taskReason?: string;
  }) => {
    const token = (window as any).firebaseToken || 'demo-token';
    const res = await fetch(getApiUrl('/api/appointments'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(newApt),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Fehler beim Buchen des Termins.');
    }

    const created = await res.json();
    setAppointments((prev) => [created, ...prev]);
    setSelectedAppointment(created);
    setActiveTab('Termine');
  };

  // Quick Status Update
  const handleUpdateStatus = async (id: number, status: AppointmentStatus) => {
    try {
      const token = (window as any).firebaseToken || 'demo-token';
      const res = await fetch(getApiUrl(`/api/appointments/${id}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        const updated = await res.json();
        setAppointments((prev) => prev.map((a) => (a.id === id ? updated : a)));
        setSelectedAppointment(updated);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  // Full Edit / Reschedule Appointment
  const handleUpdateAppointment = async (id: number, updates: any) => {
    const token = (window as any).firebaseToken || 'demo-token';
    const res = await fetch(getApiUrl(`/api/appointments/${id}`), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Fehler beim Aktualisieren des Termins.');
    }

    const updated = await res.json();
    setAppointments((prev) => prev.map((a) => (a.id === id ? updated : a)));
    setSelectedAppointment(updated);
  };

  // Delete Appointment
  const handleDeleteAppointment = async (id: number) => {
    const token = (window as any).firebaseToken || 'demo-token';
    const res = await fetch(getApiUrl(`/api/appointments/${id}`), {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Fehler beim Löschen des Termins.');
    }

    setAppointments((prev) => prev.filter((a) => a.id !== id));
    if (selectedAppointment?.id === id) {
      setSelectedAppointment(null);
    }
  };

  // Attach Document
  const handleAttachDocument = async (appointmentId: number, fileName: string) => {
    const token = (window as any).firebaseToken || 'demo-token';
    const res = await fetch(getApiUrl(`/api/appointments/${appointmentId}/documents`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ fileName }),
    });

    if (!res.ok) {
      throw new Error('Fehler beim Anhängen des Dokuments.');
    }
  };

  // Filter client appointments from directory
  const handleFilterClientAppointments = (clientName: string) => {
    setSearchQuery(clientName);
    setActiveTab('Termine');
  };

  // Shortcut from appointment details to Chat Hub
  const handleOpenChatForAppointment = (apt: Appointment) => {
    setSelectedAppointment(apt);
    setActiveTab('Chat & Tickets');
  };

  if (!isAuthenticated || !currentUser) {
    return (
      <LoginScreen
        onLoginSuccess={(user, token) => {
          localStorage.setItem('idToken', token);
          localStorage.setItem('aus_admin_user', JSON.stringify(user));
          (window as any).firebaseToken = token;
          setCurrentUser(user);
          setIsAuthenticated(true);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
      {/* SIDEBAR */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onNewTermin={() => setIsNewModalOpen(true)}
        onSignOut={handleSignOut}
        lang={lang}
        onChangeLanguage={onChangeLanguage}
      />

      {/* MAIN CONTENT AREA */}
      <div className={`${lang === 'ur' ? 'mr-64 ml-0' : 'ml-64'} flex-1 flex flex-col transition-all duration-300 min-h-screen`}>
        {/* HEADER */}
        <AdminHeader
          activeTab={activeTab}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          currentUser={currentUser}
          dataLoading={dataLoading}
          lang={lang}
        />

        {/* VIEWPORTS */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeTab === 'Übersicht' && (
            <DashboardOverview
              appointments={appointments}
              clients={clients}
              advisors={advisors}
              onSelectAppointment={(apt) => {
                setSelectedAppointment(apt);
                setActiveTab('Termine');
              }}
              onNavigateToCalendar={() => setActiveTab('Termine')}
              onOpenNewModal={() => setIsNewModalOpen(true)}
              lang={lang}
            />
          )}

          {activeTab === 'Termine' && (
            <AppointmentsWorkspace
              appointments={appointments}
              selectedAppointment={selectedAppointment}
              advisors={advisors}
              onSelectAppointment={setSelectedAppointment}
              onUpdateStatus={handleUpdateStatus}
              onUpdateAppointment={handleUpdateAppointment}
              onDeleteAppointment={handleDeleteAppointment}
              onAttachDocument={handleAttachDocument}
              onOpenNewModal={() => setIsNewModalOpen(true)}
              onOpenChatForAppointment={handleOpenChatForAppointment}
              onRefreshData={fetchData}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              lang={lang}
            />
          )}

          {activeTab === 'Verfügbarkeit' && (
            <AdminAvailabilityManager lang={lang} />
          )}

          {activeTab === 'Chat & Tickets' && (
            <AdminChatHub
              clients={clients}
              appointments={appointments}
              currentUser={currentUser}
              initialAppointment={selectedAppointment}
              lang={lang}
            />
          )}

          {activeTab === 'Mandanten' && (
            <ClientsDirectory
              clients={clients}
              appointments={appointments}
              onAddClient={handleAddClient}
              onFilterClientAppointments={handleFilterClientAppointments}
              lang={lang}
            />
          )}

          {activeTab === 'Einstellungen' && (
            <SettingsView
              currentUser={currentUser}
              lang={lang}
              onChangeLanguage={onChangeLanguage}
            />
          )}

          {activeTab === 'Help' && (
            <HelpCenterView lang={lang} />
          )}
        </div>
      </div>

      {/* NEW APPOINTMENT MODAL */}
      <NewAppointmentModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        clients={clients}
        advisors={advisors}
        onAddClient={handleAddClient}
        onAddAppointment={handleAddAppointment}
        lang={lang}
      />
    </div>
  );
}
