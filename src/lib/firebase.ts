import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword as fbSignIn,
  createUserWithEmailAndPassword as fbSignUp,
  signOut as fbSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { UserProfile, ChatRoom, ChatMessage, AppointmentDocument, AppointmentStatus } from '../types.ts';
import { getApiUrl } from './api.ts';

// Safe environment variable resolution for Vite
const rawApiKey = (import.meta as any).env?.VITE_FIREBASE_API_KEY;
const isPlaceholder = !rawApiKey || rawApiKey.includes('Dummy') || rawApiKey.includes('YOUR_FIREBASE');

const firebaseConfig = {
  apiKey: isPlaceholder ? "AIzaSyDemoDummyKeyForLocalDevOnly12345" : rawApiKey,
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || "aus-webapp.firebaseapp.com",
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || "aus-webapp",
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || "aus-webapp.firebasestorage.app",
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "267958421532",
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || "1:267958421532:web:8faa4d76485f44c6c977d9",
  measurementId: (import.meta as any).env?.VITE_FIREBASE_MEASUREMENT_ID || "G-XH2WCEPBLD",
};

export const isLiveFirebaseConfigured = !isPlaceholder;
export const isLiveSupabaseConfigured = isLiveFirebaseConfigured;

import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';

// Initialize Firebase App safely
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const firestore = isLiveFirebaseConfigured ? getFirestore(app) : null;

// Helper: Normalize room IDs deterministically between customer and admin
export const normalizeRoomId = (roomType: 'general_ticket' | 'appointment_chat', targetId: string | number): string => {
  if (roomType === 'appointment_chat') {
    return `apt-room-${targetId}`;
  }
  const clean = String(targetId).toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  return `general-${clean}`;
};

// ==================== AUTHENTICATION ====================

export const checkUserExistsByEmail = async (email: string): Promise<boolean> => {
  if (!email || !email.includes('@')) return false;
  try {
    const res = await fetch(getApiUrl('/api/auth/check-email'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim() }),
    });
    if (res.ok) {
      const data = await res.json();
      return Boolean(data.exists);
    }
  } catch (_) {}
  return false;
};

export const checkUserExistsByPhone = async (phone: string): Promise<boolean> => {
  if (!phone) return false;
  try {
    const res = await fetch(getApiUrl('/api/auth/check-phone'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phone.trim() }),
    });
    if (res.ok) {
      const data = await res.json();
      return Boolean(data.exists);
    }
  } catch (_) {}
  return false;
};

export const signInWithEmailPassword = async (
  email: string, 
  password: string
): Promise<{ session: any; profile: UserProfile | null; error: any }> => {
  if (isLiveFirebaseConfigured) {
    try {
      const userCredential = await fbSignIn(auth, email.trim(), password);
      const token = await userCredential.user.getIdToken();
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('firebase_token', token);
        localStorage.setItem('idToken', token);
      }
    } catch (fbErr: any) {
      console.warn('Firebase admin client sign in note:', fbErr.message);
    }
  }

  try {
    const res = await fetch(getApiUrl('/api/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password }),
    });

    if (res.ok) {
      const data = await res.json();
      if (typeof localStorage !== 'undefined') {
        const token = data.session?.access_token || 'admin-token';
        localStorage.setItem('firebase_token', token);
        localStorage.setItem('idToken', token);
        if (data.profile) {
          localStorage.setItem('aus_demo_profile', JSON.stringify(data.profile));
        }
      }
      return { session: data.session, profile: data.profile, error: null };
    }

    const errData = await res.json();
    throw new Error(errData.error || 'Anmeldung fehlgeschlagen.');
  } catch (err: any) {
    return { session: null, profile: null, error: err };
  }
};
export const signInWithEmail = signInWithEmailPassword;

export const signUpWithEmailPassword = async (profileData: {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  homeAddress: string;
  companyName?: string;
  password: string;
}): Promise<{ session: any; profile: UserProfile | null; error: any }> => {
  try {
    const res = await fetch(getApiUrl('/api/auth/register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData),
    });

    if (res.ok) {
      const data = await res.json();
      return { session: data.session, profile: data.profile, error: null };
    }

    const errData = await res.json();
    throw new Error(errData.error || 'Registrierung fehlgeschlagen.');
  } catch (err: any) {
    return { session: null, profile: null, error: err };
  }
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('firebase_token') : null;
    const res = await fetch(getApiUrl(`/api/users/profile`), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (_) {}
  return null;
};

export const upsertUserProfile = async (profile: any) => {
  try {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('firebase_token') : null;
    const res = await fetch(getApiUrl('/api/users/profile'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(profile),
    });
    if (res.ok) {
      const data = await res.json();
      return { data, error: null };
    }
  } catch (_) {}
  return { data: profile, error: null };
};

export const signInWithGoogle = async () => {
  if (isLiveFirebaseConfigured) {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const token = await result.user.getIdToken();
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('firebase_token', token);
        localStorage.setItem('idToken', token);
      }
      return { data: { user: result.user }, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  }
  return { data: { url: null }, error: null };
};

export const signOut = async () => {
  if (isLiveFirebaseConfigured) {
    try {
      await fbSignOut(auth);
    } catch (_) {}
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('firebase_token');
    localStorage.removeItem('idToken');
    localStorage.removeItem('supabase_token');
    localStorage.removeItem('aus_demo_profile');
  }
};

// ==================== ADMIN AVAILABILITY ====================

export const fetchAdminAvailabilities = async (): Promise<any[]> => {
  try {
    const res = await fetch(getApiUrl('/api/admin/availability'));
    if (res.ok) {
      return await res.json();
    }
  } catch (_) {}
  return [];
};

export const saveAdminAvailability = async (
  date: string,
  status: 'available_all_day' | 'custom_slots' | 'unavailable',
  customSlots?: { startTime: string; endTime: string }[],
  notes?: string
) => {
  if (isLiveFirebaseConfigured && firestore) {
    try {
      await setDoc(doc(firestore, 'admin_availability', date), { 
        date, 
        status, 
        customSlots: customSlots || [], 
        notes: notes || '', 
        updatedAt: new Date().toISOString() 
      }, { merge: true });
    } catch (_) {}
  }

  try {
    const res = await fetch(getApiUrl('/api/admin/availability'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, status, customSlots, notes }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (_) {}
  return { date, status, customSlots, notes };
};

export const batchSaveAdminAvailabilities = async (dates: string[], status: 'available_all_day' | 'unavailable') => {
  if (isLiveFirebaseConfigured && firestore) {
    try {
      for (const d of dates) {
        await setDoc(doc(firestore, 'admin_availability', d), { 
          date: d, 
          status, 
          updatedAt: new Date().toISOString() 
        }, { merge: true });
      }
    } catch (_) {}
  }

  try {
    const res = await fetch(getApiUrl('/api/admin/availability/batch'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dates, status }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (_) {}
  return dates.map(d => ({ date: d, status }));
};

// ==================== APPOINTMENTS & DOCUMENTS ====================

export const fetchAppointmentsFromBackend = async (userEmail?: string): Promise<any[]> => {
  if (isLiveFirebaseConfigured && firestore) {
    try {
      const snap = await getDocs(collection(firestore, 'appointments'));
      if (!snap.empty) {
        let list = snap.docs.map(d => d.data());
        if (userEmail) {
          list = list.filter((a: any) => a.client?.email?.toLowerCase() === userEmail.toLowerCase().trim());
        }
        if (list.length > 0) return list;
      }
    } catch (_) {}
  }

  try {
    const url = userEmail 
      ? getApiUrl(`/api/appointments?search=${encodeURIComponent(userEmail)}`)
      : getApiUrl('/api/appointments');
    const token = typeof localStorage !== 'undefined' ? (localStorage.getItem('firebase_token') || localStorage.getItem('idToken')) : null;
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(url, { headers });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (_) {}
  return [];
};

export const fetchAppointmentsFromSupabase = fetchAppointmentsFromBackend;

export const uploadAppointmentMedia = async ({
  appointmentId,
  chatRoomId,
  uploaderId,
  uploaderName,
  uploaderRole = 'admin',
  file,
  label,
  documentDate,
}: {
  appointmentId?: number | null;
  chatRoomId?: string;
  uploaderId: string;
  uploaderName?: string;
  uploaderRole?: 'customer' | 'admin' | 'advisor';
  file: File;
  label: string;
  documentDate?: string;
}): Promise<{ doc: AppointmentDocument | null; error: any }> => {
  const roomId = chatRoomId || (appointmentId ? `apt-room-${appointmentId}` : `general-${uploaderId}`);

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('label', label || file.name);
    formData.append('uploaderId', uploaderId);
    if (uploaderName) formData.append('uploaderName', uploaderName);
    formData.append('uploaderRole', uploaderRole);
    if (documentDate) formData.append('documentDate', documentDate);
    if (appointmentId) formData.append('appointmentId', String(appointmentId));

    const token = typeof localStorage !== 'undefined' 
      ? localStorage.getItem('firebase_token') || 'admin-token'
      : 'admin-token';
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      'x-user-id': uploaderId,
      'x-user-name': uploaderName || '',
      'x-user-role': uploaderRole,
    };

    const res = await fetch(getApiUrl(`/api/chat/rooms/${roomId}/upload`), {
      method: 'POST',
      headers,
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      return { doc: data.doc, error: null };
    }

    const errData = await res.json().catch(() => ({ error: 'Upload fehlgeschlagen' }));
    throw new Error(errData.error || `HTTP ${res.status}`);
  } catch (err: any) {
    console.error('Failed to upload document:', err);
    return { doc: null, error: err };
  }
};

export const fetchAppointmentDocuments = async (appointmentId?: number | null, chatRoomId?: string): Promise<AppointmentDocument[]> => {
  const roomId = chatRoomId || (appointmentId ? `apt-room-${appointmentId}` : '');
  
  if (roomId) {
    try {
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('firebase_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(getApiUrl(`/api/chat/rooms/${roomId}/documents`), { headers });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) return data;
      }
    } catch (_) {}
  }

  if (appointmentId) {
    try {
      const res = await fetch(getApiUrl(`/api/appointments/${appointmentId}/documents`));
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) return data;
      }
    } catch (_) {}
  }

  return [];
};

// ==================== REALTIME CHAT & WEBSOCKET SYSTEM ====================

export const getOrCreateGeneralTicketRoom = async (
  customerId: string,
  customerName?: string,
  customerEmail?: string
): Promise<ChatRoom> => {
  const cleanId = customerId.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  const normalizedId = `general-${cleanId}`;

  try {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('firebase_token') : null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token || 'admin-token'}`;

    const res = await fetch(getApiUrl('/api/chat/rooms/get-or-create'), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        roomType: 'general_ticket',
        customerId,
        customerName,
        customerEmail,
      }),
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (_) {}

  return {
    id: normalizedId,
    roomType: 'general_ticket',
    customerId,
    title: `Support-Ticket: ${customerName || 'Mandant'}`,
    createdAt: new Date().toISOString(),
  };
};

export const getOrCreateAppointmentChatRoom = async (
  customerId: string,
  appointmentId: number,
  appointmentTitle: string,
  customerEmail?: string
): Promise<ChatRoom> => {
  const roomId = `apt-room-${appointmentId}`;

  try {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('firebase_token') : null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token || 'admin-token'}`;

    const res = await fetch(getApiUrl('/api/chat/rooms/get-or-create'), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        roomType: 'appointment_chat',
        customerId,
        appointmentId,
        appointmentTitle,
        customerEmail,
      }),
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (_) {}

  return {
    id: roomId,
    roomType: 'appointment_chat',
    customerId,
    appointmentId,
    title: `Termin #${appointmentId}: ${appointmentTitle}`,
    createdAt: new Date().toISOString(),
  };
};

export const fetchChatMessages = async (roomId: string): Promise<ChatMessage[]> => {
  try {
    const token = typeof localStorage !== 'undefined' ? (localStorage.getItem('firebase_token') || 'admin-token') : 'admin-token';
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(getApiUrl(`/api/chat/rooms/${roomId}/messages`), { headers });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        return data
          .map((m: any) => ({
            ...m,
            status: m.status || 'delivered',
          }))
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      }
    }
  } catch (_) {}
  return [];
};

export const sendChatMessage = async ({
  roomId,
  senderId,
  senderName,
  senderRole = 'admin',
  message,
  isHighAlert = false,
  attachmentId,
  clientEmail,
  clientName,
}: {
  roomId: string;
  senderId?: string;
  senderName?: string;
  senderRole?: 'customer' | 'admin' | 'advisor';
  message: string;
  isHighAlert?: boolean;
  attachmentId?: number | string;
  clientEmail?: string;
  clientName?: string;
}): Promise<ChatMessage> => {
  try {
    const token = typeof localStorage !== 'undefined' 
      ? localStorage.getItem('firebase_token') || 'admin-token'
      : 'admin-token';
    const headers: Record<string, string> = { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'x-user-id': senderId || 'admin',
      'x-user-name': senderName || 'Dr. Abdul Sattar',
      'x-user-role': senderRole,
    };

    const res = await fetch(getApiUrl(`/api/chat/rooms/${roomId}/messages`), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message,
        isHighAlert,
        attachmentId,
        senderId,
        senderName,
        senderRole,
        clientEmail,
        clientName,
      }),
    });

    if (res.ok) {
      const msg = await res.json();
      if (isLiveFirebaseConfigured && firestore) {
        try {
          setDoc(doc(firestore, 'chat_rooms', roomId, 'messages', String(msg.id)), msg).catch(() => {});
          setDoc(doc(firestore, 'chat_rooms', roomId), {
            id: roomId,
            lastMessage: message,
            updatedAt: msg.createdAt,
          }, { merge: true }).catch(() => {});
        } catch (_) {}
      }
      return {
        ...msg,
        status: 'delivered',
      };
    }
  } catch (_) {}

  return {
    id: Date.now(),
    roomId,
    senderId: senderId || 'admin',
    senderName: senderName || 'Dr. Abdul Sattar',
    senderRole,
    message,
    isHighAlert,
    attachmentId,
    createdAt: new Date().toISOString(),
    status: 'delivered',
  };
};

/**
 * Robust Realtime WebSocket Room Subscription with SSE Fallback
 */
export const subscribeToRoomMessages = (
  roomId: string,
  onNewMessage: (msg: ChatMessage) => void,
  onNewDocument?: (doc: AppointmentDocument) => void
) => {
  let ws: WebSocket | null = null;
  let sse: EventSource | null = null;
  let isSubscribed = true;
  let reconnectTimer: any = null;

  const connectWs = () => {
    if (!isSubscribed) return;

    try {
      const apiUrl = getApiUrl('');
      let wsUrl: string;
      if (apiUrl && apiUrl.startsWith('http')) {
        wsUrl = apiUrl.replace(/^http/, 'ws') + '/ws';
      } else if (typeof window !== 'undefined') {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.port === '3000' || window.location.port === '3001'
          ? `${window.location.hostname}:5000`
          : window.location.host;
        wsUrl = `${protocol}//${host}/ws`;
      } else {
        wsUrl = 'ws://localhost:5000/ws';
      }

      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'join_room',
            roomId,
          }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'new_message' && payload.data && payload.roomId === roomId) {
            onNewMessage({
              ...payload.data,
              status: 'delivered',
            });
          } else if (payload.type === 'new_document' && payload.data && (payload.roomId === roomId || payload.data.chatRoomId === roomId)) {
            if (onNewDocument) onNewDocument(payload.data);
          }
        } catch (_) {}
      };

      ws.onerror = () => {
        if (!sse) startSseFallback();
      };

      ws.onclose = () => {
        if (isSubscribed) {
          reconnectTimer = setTimeout(connectWs, 3000);
        }
      };
    } catch (_) {
      startSseFallback();
    }
  };

  const startSseFallback = () => {
    if (sse || !isSubscribed) return;
    try {
      const sseUrl = getApiUrl(`/api/chat/rooms/${roomId}/events`);
      sse = new EventSource(sseUrl);

      sse.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload.type === 'new_message' && payload.data) {
            onNewMessage({
              ...payload.data,
              status: 'delivered',
            });
          } else if (payload.type === 'new_document' && payload.data && onNewDocument) {
            onNewDocument(payload.data);
          }
        } catch (_) {}
      };
    } catch (_) {}
  };

  connectWs();

  return {
    unsubscribe: () => {
      isSubscribed = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) {
        try {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'leave_room', roomId }));
          }
          ws.close();
        } catch (_) {}
      }
      if (sse) {
        try {
          sse.close();
        } catch (_) {}
      }
    },
  };
};

// ==================== SUPABASE COMPATIBILITY LAYER ====================
export const supabase = {
  auth: {
    getSession: async () => {
      const user = auth.currentUser;
      if (user) {
        return { data: { session: { user: { id: user.uid, email: user.email } } }, error: null };
      }
      const cached = typeof localStorage !== 'undefined' ? localStorage.getItem('aus_demo_profile') : null;
      if (cached) {
        try {
          const profile = JSON.parse(cached);
          if (profile?.id || profile?.email) {
            return { data: { session: { user: { id: profile.id || profile.uid || 'demo-user', email: profile.email } } }, error: null };
          }
        } catch (_) {}
      }
      return { data: { session: null }, error: null };
    },
    onAuthStateChange: (callback: (event: string, session: any) => void) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          callback('SIGNED_IN', { user: { id: user.uid, email: user.email } });
        } else {
          callback('SIGNED_OUT', null);
        }
      });
      return {
        data: {
          subscription: {
            unsubscribe,
          },
        },
      };
    },
    signInWithPassword: ({ email, password }: any) => signInWithEmailPassword(email, password),
    signUp: (args: any) => signUpWithEmailPassword(args),
    signOut,
  },
};
