import React, { useState } from 'react';
import { Client, Appointment } from '../../types.ts';
import { Language, translations } from '../../lib/translations.ts';
import { 
  Users, 
  Search, 
  Plus, 
  Mail, 
  Phone, 
  Building, 
  Calendar, 
  ArrowRight,
  UserPlus,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface ClientsDirectoryProps {
  clients: Client[];
  appointments: Appointment[];
  onAddClient: (newClient: { name: string; email: string; phone: string; company?: string; sinceYear: number }) => Promise<Client>;
  onFilterClientAppointments: (clientName: string) => void;
  lang: Language;
}

export default function ClientsDirectory({
  clients,
  appointments,
  onAddClient,
  onFilterClientAppointments,
  lang
}: ClientsDirectoryProps) {
  const t = translations[lang];
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // New Client Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [sinceYear, setSinceYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    (c.company && c.company.toLowerCase().includes(search.toLowerCase()))
  );

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError('Name und E-Mail sind Pflichtfelder.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await onAddClient({
        name,
        email,
        phone,
        company,
        sinceYear: Number(sinceYear)
      });

      setSuccess(`Mandant "${name}" wurde erfolgreich angelegt.`);
      setName('');
      setEmail('');
      setPhone('');
      setCompany('');
      setShowAddForm(false);
    } catch (err: any) {
      setError(err.message || 'Fehler beim Erstellen des Mandanten.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto space-y-6 bg-slate-50">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>Mandantenverzeichnis ({clients.length})</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Verwalten Sie alle Kanzleimandanten, Kontaktdaten und Terminhistorien.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          <span>{showAddForm ? 'Formular schließen' : 'Mandant hinzufügen'}</span>
        </button>
      </div>

      {/* Add Client Form Collapsible */}
      {showAddForm && (
        <form onSubmit={handleCreateClient} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 max-w-2xl animate-fadeIn text-xs">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
            Neuen Mandanten anlegen
          </h3>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Name / Ansprechpartner *
              </label>
              <input
                type="text"
                required
                placeholder="z.B. Dr. Hans Schneider"
                value={name}
                onChange={(e) => setName(e.target.value)}
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
                placeholder="hans.schneider@firma.de"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Firma / Unternehmen
              </label>
              <input
                type="text"
                placeholder="Schneider Industrie GmbH"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg font-bold"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs cursor-pointer"
            >
              {loading ? 'Speichern...' : 'Mandant speichern'}
            </button>
          </div>
        </form>
      )}

      {/* Search Input Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Nach Name, E-Mail oder Firma suchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-600 shadow-2xs"
        />
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wider font-extrabold text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3.5">Mandant / Ansprechpartner</th>
              <th className="px-6 py-3.5">E-Mail</th>
              <th className="px-6 py-3.5">Telefon</th>
              <th className="px-6 py-3.5">Mandant seit</th>
              <th className="px-6 py-3.5">Termine</th>
              <th className="px-6 py-3.5 text-right">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredClients.map((client) => {
              const clientApts = appointments.filter(a => a.client.id === client.id);
              return (
                <tr key={client.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                        {client.name.substring(0, 2)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{client.name}</p>
                        {client.company && (
                          <p className="text-[11px] text-slate-500">{client.company}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{client.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{client.phone || '—'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-semibold font-mono">
                    {client.sinceYear}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md font-bold text-[11px]">
                      {clientApts.length} {clientApts.length === 1 ? 'Termin' : 'Termine'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => onFilterClientAppointments(client.name)}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Termine anzeigen</span>
                    </button>
                  </td>
                </tr>
              );
            })}

            {filteredClients.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                  Keine Mandanten für diesen Suchbegriff gefunden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
