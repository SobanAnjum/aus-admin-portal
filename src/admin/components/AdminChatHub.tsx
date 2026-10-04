import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Search, 
  Send, 
  AlertTriangle, 
  Ticket, 
  Calendar, 
  User, 
  CheckCircle2, 
  X, 
  ShieldAlert,
  CalendarDays,
  Mail,
  Phone,
  Shield,
  CheckCheck,
  Check,
  Clock,
  AlertCircle
} from 'lucide-react';
import { 
  Client, 
  Appointment, 
  ChatRoom, 
  ChatMessage, 
  UserProfile 
} from '../../types.ts';
import { 
  getOrCreateGeneralTicketRoom, 
  getOrCreateAppointmentChatRoom, 
  fetchChatMessages, 
  sendChatMessage, 
  subscribeToRoomMessages 
} from '../../lib/supabase.ts';
import { sendHighAlertMessageEmail } from '../../lib/emailService.ts';
import { Language, translations } from '../../lib/translations.ts';
import { getApiUrl } from '../../lib/api.ts';

// WhatsApp-style Date Separator Formatter
const formatMessageDateHeader = (dateStr: string): string => {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return 'Heute';

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();
    if (isYesterday) return 'Gestern';

    return d.toLocaleDateString('de-DE', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  } catch {
    return 'Heute';
  }
};

// WhatsApp-style Delivery Status Indicator
const MessageStatusTick = ({ status }: { status?: 'sending' | 'sent' | 'delivered' | 'error' }) => {
  if (status === 'sending') {
    return <Clock className="w-3 h-3 text-slate-400 inline-block animate-spin" />;
  }
  if (status === 'error') {
    return <AlertCircle className="w-3 h-3 text-red-400 inline-block" title="Fehler beim Senden" />;
  }
  if (status === 'sent') {
    return <Check className="w-3.5 h-3.5 text-slate-400 inline-block" />;
  }
  return <CheckCheck className="w-3.5 h-3.5 text-cyan-400 inline-block" title="Zugestellt" />;
};

interface AdminChatHubProps {
  clients: Client[];
  appointments: Appointment[];
  currentUser: any;
  lang?: Language;
  initialAppointment?: Appointment | null;
}

export default function AdminChatHub({
  clients,
  appointments,
  currentUser,
  lang = 'de',
  initialAppointment,
}: AdminChatHubProps) {
  const t = translations[lang] || translations.de;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientRooms, setClientRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isHighAlert, setIsHighAlert] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [inChatSearch, setInChatSearch] = useState('');
  const [showInChatSearch, setShowInChatSearch] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Select first client by default or match initialAppointment
  useEffect(() => {
    if (initialAppointment) {
      const matchClient = clients.find((c) => c.email === initialAppointment.client.email || c.id === initialAppointment.client.id);
      if (matchClient) {
        setSelectedClient(matchClient);
        return;
      }
    }
    if (!selectedClient && clients.length > 0) {
      setSelectedClient(clients[0]);
    }
  }, [clients, initialAppointment]);

  // When selected client changes, build their chat rooms (1 general + 1 per appointment)
  // Strictly isolated by passing selectedClient.email to avoid cross-inbox leakage!
  useEffect(() => {
    if (!selectedClient) return;

    const loadRooms = async () => {
      const custId = selectedClient.userId || `client-${selectedClient.id}`;
      const general = await getOrCreateGeneralTicketRoom(custId, selectedClient.name, selectedClient.email);

      const clientApts = appointments.filter(
        (a) => a.client?.email === selectedClient.email || a.client?.id === selectedClient.id
      );

      const aptRooms: ChatRoom[] = [];
      for (const apt of clientApts) {
        const room = await getOrCreateAppointmentChatRoom(custId, apt.id, apt.title, selectedClient.email);
        aptRooms.push(room);
      }

      const all = [general, ...aptRooms];
      setClientRooms(all);

      if (initialAppointment) {
        const target = aptRooms.find((r) => r.appointmentId === initialAppointment.id);
        setSelectedRoom(target || all[0]);
      } else {
        setSelectedRoom(all[0]);
      }
    };

    loadRooms();
  }, [selectedClient, appointments, initialAppointment]);

  // When selected room changes, fetch messages
  useEffect(() => {
    if (!selectedRoom) return;
    setLoadingMessages(true);

    fetchChatMessages(selectedRoom.id).then((msgs) => {
      setMessages(msgs);
      setLoadingMessages(false);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    // Real-Time subscription for messages
    const sub = subscribeToRoomMessages(
      selectedRoom.id,
      (newMsg) => {
        setMessages((prev) => {
          if (prev.some((m) => String(m.id) === String(newMsg.id))) return prev;
          return [...prev, { ...newMsg, status: 'delivered' }];
        });
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    );

    // Periodic polling fallback for active chat room
    const intervalId = setInterval(() => {
      fetchChatMessages(selectedRoom.id).then((freshMsgs) => {
        if (Array.isArray(freshMsgs) && freshMsgs.length > 0) {
          setMessages((prev) => {
            const pendingOptimistic = prev.filter(
              (m) => String(m.id).startsWith('opt-') && !freshMsgs.some((fm) => fm.message === m.message)
            );
            const confirmedPrev = prev.filter((m) => !String(m.id).startsWith('opt-'));
            if (freshMsgs.length !== confirmedPrev.length || freshMsgs.some((m, i) => confirmedPrev[i]?.id !== m.id)) {
              return [...freshMsgs, ...pendingOptimistic];
            }
            return prev;
          });
        }
      }).catch(() => {});
    }, 3000);

    return () => {
      sub.unsubscribe();
      clearInterval(intervalId);
    };
  }, [selectedRoom]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !selectedRoom || !selectedClient) return;

    const text = inputText.trim();
    const alertFlag = isHighAlert;
    setInputText('');
    setIsHighAlert(false);

    // 1. INSTANT APPEARANCE (Optimistic UI - WhatsApp style)
    const tempId = 'opt-' + Date.now();
    const optimisticMsg: ChatMessage = {
      id: tempId,
      roomId: selectedRoom.id,
      senderId: currentUser?.uid || '5259a431-8178-4602-aa2b-f7b03100df77',
      senderName: 'Dr. Abdul Sattar',
      senderRole: 'admin',
      message: text,
      isHighAlert: alertFlag,
      createdAt: new Date().toISOString(),
      status: 'sending',
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 30);

    // 2. DISPATCH TO BACKEND WITH STRICT SENDER & RECIPIENT ATTRIBUTION
    try {
      const sent = await sendChatMessage({
        roomId: selectedRoom.id,
        senderId: currentUser?.uid || '5259a431-8178-4602-aa2b-f7b03100df77',
        senderName: 'Dr. Abdul Sattar',
        senderRole: 'admin',
        message: text,
        isHighAlert: alertFlag,
        clientEmail: selectedClient.email,
        clientName: selectedClient.name,
      });

      // 3. FLIP OPTIMISTIC STATUS TO DELIVERED (Double Checkmark)
      setMessages((prev) => {
        const alreadyReceived = prev.some((m) => String(m.id) === String(sent.id));
        if (alreadyReceived) {
          return prev.filter((m) => m.id !== tempId);
        }
        return prev.map((m) => (m.id === tempId ? { ...sent, status: 'delivered' as const } : m));
      });
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);

      // If High Alert is checked, trigger transactional priority email to customer
      if (alertFlag && selectedClient.email) {
        sendHighAlertMessageEmail({
          customerEmail: selectedClient.email,
          customerName: selectedClient.name,
          appointmentTitle: selectedRoom.title || 'Beratungstermin',
          messageContent: text,
          advisorName: currentUser?.name || 'Abdul Sattar',
        });
      }
    } catch (err) {
      console.error('Failed to send admin message:', err);
      setMessages((prev) => prev.map((m) => m.id === tempId ? { ...m, status: 'error' as const } : m));
    }
  };

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.company && c.company.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex-1 flex h-[calc(100vh-64px)] overflow-hidden bg-slate-100 font-sans">
      {/* COLUMN 1: Customer Directory & Search */}
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2 font-serif">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            <span>Mandanten-Chat & Tickets</span>
          </h3>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Mandant suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-900 transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredClients.map((client) => {
            const isSelected = selectedClient?.id === client.id;
            return (
              <div
                key={client.id}
                onClick={() => setSelectedClient(client)}
                className={`p-3 rounded-xl cursor-pointer transition-all border ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-slate-800 border-transparent hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs font-serif ${
                      isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {client.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold truncate">{client.name}</p>
                    <p className={`text-[10px] truncate ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>
                      {client.company || client.email}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* COLUMN 2: Client Sub-Rooms (Ticket & Appointments) */}
      <div className="w-72 bg-slate-50 border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-200 bg-white">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Räume für Mandant
          </span>
          <h4 className="text-xs font-bold text-slate-900 truncate font-serif">
            {selectedClient?.name || 'Mandant wählen'}
          </h4>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {clientRooms.map((room) => {
            const isSelected = selectedRoom?.id === room.id;
            const isGeneral = room.roomType === 'general_ticket';

            return (
              <div
                key={room.id}
                onClick={() => setSelectedRoom(room)}
                className={`p-3 rounded-xl cursor-pointer transition-all border ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {isGeneral ? (
                    <Ticket className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-blue-600'}`} />
                  ) : (
                    <Calendar className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-emerald-600'}`} />
                  )}
                  <span className="text-xs font-bold truncate">
                    {isGeneral ? 'Support-Ticket (General)' : room.title || 'Termin-Chat'}
                  </span>
                </div>
                <p className={`text-[10px] truncate ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                  {isGeneral ? 'Allgemeine Anfragen' : `Termin #${room.appointmentId}`}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* COLUMN 3: Active Chat Stream / Dedicated Media Gallery */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden">
        {/* Header with Tab Switcher & In-Chat Search */}
        <div className="px-6 py-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-800 text-sm font-serif">
              {selectedClient?.name ? selectedClient.name[0].toUpperCase() : 'M'}
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 font-serif">
                <span>{selectedRoom?.title || 'Chatraum'}</span>
                <span className="text-xs font-normal text-slate-500 font-sans">
                  • {selectedClient?.name}
                </span>
              </h4>
              <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                <span>{selectedClient?.email}</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-400">
                  {selectedRoom?.roomType === 'general_ticket'
                    ? 'Support-Ticket'
                    : `Termin #${selectedRoom?.appointmentId}`}
                </span>
              </p>
            </div>
          </div>

          {/* View Tab Switcher: [💬 Chat] [🖼️ Galerie & Akten] + Search */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Search Toggle */}
            <button
              onClick={() => setShowInChatSearch(!showInChatSearch)}
              title="Nachrichten durchsuchen"
              className={`p-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                showInChatSearch || inChatSearch
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* In-Chat Search Bar Dropdown */}
        {showInChatSearch && (
          <div className="px-6 py-2 bg-slate-100/90 border-b border-slate-200 flex items-center gap-3 animate-in slide-in-from-top-1 duration-150">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              autoFocus
              placeholder="In dieser Unterhaltung suchen..."
              value={inChatSearch}
              onChange={(e) => setInChatSearch(e.target.value)}
              className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1 text-xs text-slate-900 outline-none focus:border-blue-500"
            />
            {inChatSearch && (
              <span className="text-[11px] text-slate-500 font-medium shrink-0">
                {messages.filter((m) => m.message.toLowerCase().includes(inChatSearch.toLowerCase())).length} Treffer
              </span>
            )}
            <button
              onClick={() => {
                setInChatSearch('');
                setShowInChatSearch(false);
              }}
              className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Chat Stream Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* WhatsApp Styled Message Stream */}
          <div 
            className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-1 bg-[#efeae2]/30"
              style={{
                backgroundImage: `radial-gradient(#cbd5e1 0.75px, transparent 0.75px)`,
                backgroundSize: '24px 24px',
              }}
            >
              {loadingMessages ? (
                <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-2">
                  <span className="inline-block w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                  <p className="font-medium text-slate-600">Nachrichten werden synchronisiert...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="py-20 text-center text-slate-400 text-xs space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/80 border border-slate-200/80 shadow-xs flex items-center justify-center mx-auto text-slate-400">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <p className="font-bold text-slate-700 text-sm">Noch keine Nachrichten in diesem Raum</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Nachrichten erscheinen hier sofort in Echtzeit mit Zustellstatus und Mandantenzuordnung.
                  </p>
                </div>
              ) : (
                (() => {
                  const filteredList = inChatSearch.trim()
                    ? messages.filter((m) => m.message.toLowerCase().includes(inChatSearch.toLowerCase()))
                    : messages;

                  if (filteredList.length === 0) {
                    return (
                      <div className="py-12 text-center text-xs text-slate-500">
                        Keine Treffer für "{inChatSearch}" gefunden.
                      </div>
                    );
                  }

                  return filteredList.map((msg, idx) => {
                    const isStaff = msg.senderRole === 'admin' || msg.senderRole === 'advisor';
                    const isAlert = msg.isHighAlert;

                    // Group by Date for WhatsApp Centered Date Badges
                    const prevMsg = idx > 0 ? filteredList[idx - 1] : null;
                    const prevDate = prevMsg ? new Date(prevMsg.createdAt).toDateString() : null;
                    const curDate = new Date(msg.createdAt).toDateString();
                    const showDateHeader = idx === 0 || prevDate !== curDate;

                    return (
                      <React.Fragment key={msg.id}>
                        {showDateHeader && (
                          <div className="flex justify-center my-3 sticky top-1 z-10 select-none">
                            <span className="px-3.5 py-1 bg-white/95 backdrop-blur-md shadow-xs border border-slate-200/90 rounded-full text-[11px] font-semibold text-slate-600 tracking-wide">
                              {formatMessageDateHeader(msg.createdAt)}
                            </span>
                          </div>
                        )}

                        <div className={`flex flex-col mb-1.5 ${isStaff ? 'items-end' : 'items-start'}`}>
                          <div
                            className={`relative max-w-[85%] sm:max-w-md md:max-w-lg px-3.5 py-2 rounded-2xl text-xs leading-relaxed shadow-xs transition-all ${
                              isAlert
                                ? 'bg-red-50 text-red-950 border-2 border-red-500 rounded-tr-xs'
                                : isStaff
                                ? 'bg-slate-900 text-white rounded-tr-xs border border-slate-800'
                                : 'bg-white text-slate-900 border border-slate-200/80 rounded-tl-xs'
                            }`}
                          >
                            {/* Mandant Header on Incoming Messages */}
                            {!isStaff && (
                              <div className="flex items-center gap-1.5 pb-1 mb-1 border-b border-slate-100">
                                <span className="text-[11px] font-bold text-slate-900">
                                  {msg.senderName || selectedClient?.name || 'Mandant'}
                                </span>
                                <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 text-[9px] font-bold border border-amber-200">
                                  Mandant
                                </span>
                              </div>
                            )}

                            {isAlert && (
                              <div className="flex items-center gap-1 text-red-600 font-bold text-[10px] uppercase tracking-wider mb-1 bg-red-100/70 px-2 py-0.5 rounded-md">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                <span>High Alert gesendet (E-Mail benachrichtigt)</span>
                              </div>
                            )}

                            {/* Text Body */}
                            <p className="whitespace-pre-wrap break-words text-[13px] leading-snug">{msg.message}</p>

                            {/* WhatsApp Meta Footer: Timestamp + Delivery Ticks */}
                            <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] select-none ${
                              isStaff ? 'text-slate-300' : 'text-slate-400'
                            }`}>
                              <span>
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {isStaff && (
                                <MessageStatusTick status={msg.status || 'delivered'} />
                              )}
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  });
                })()
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* WhatsApp-Style Input Bar & Quick Actions */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 bg-white space-y-2">
              <div className="flex items-center justify-between px-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isHighAlert}
                    onChange={(e) => setIsHighAlert(e.target.checked)}
                    className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500 cursor-pointer"
                  />
                  <span className={`text-xs font-bold flex items-center gap-1 transition-colors ${
                    isHighAlert ? 'text-red-600' : 'text-slate-600 hover:text-slate-900'
                  }`}>
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>High Alert Nachricht (Sendet sofort E-Mail an {selectedClient?.email})</span>
                  </span>
                </label>
                <span className="text-[10px] text-slate-400 hidden sm:inline">
                  Enter = Senden • Shift+Enter = Neue Zeile
                </span>
              </div>

              <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-1.5 focus-within:bg-white focus-within:border-slate-900 transition-all">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  placeholder={`Nachricht an ${selectedClient?.name || 'Mandanten'} schreiben...`}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="flex-1 bg-transparent py-1.5 px-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none resize-none max-h-32 leading-relaxed"
                />

                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className={`p-2.5 rounded-xl text-white font-bold text-xs flex items-center justify-center shadow-xs transition-all cursor-pointer shrink-0 disabled:opacity-30 disabled:cursor-not-allowed ${
                    isHighAlert 
                      ? 'bg-red-600 hover:bg-red-700 active:scale-95' 
                      : 'bg-slate-900 hover:bg-slate-800 active:scale-95'
                  }`}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
  );
}
