// Asynchronous database client utilities for MongoDB & Cloudinary integrations

export interface Citizen {
  id: string;
  name: string;
  mobileNumber: string;
  registeredAt: string;
}

export interface Complaint {
  id: string;
  citizenId: string;
  citizenName: string;
  title: string;
  description: string;
  category: string;
  latitude: number;
  longitude: number;
  status: 'open' | 'assigned' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  photoUrls: string[];
  voiceNoteUrl?: string;
  createdAt: string;
  updatedAt: string;
  timeline: TimelineEntry[];
  notes?: string;
  assignee?: string;
}

export interface TimelineEntry {
  timestamp: string;
  status: string;
  note: string;
  adminName?: string;
}

export interface LocalNotification {
  id: string;
  complaintId: string;
  message: string;
  type: 'status-update' | 'assignment' | 'completion';
  read: boolean;
  createdAt: string;
}

const DB_KEYS = {
  CURRENT_CITIZEN: 'fix-my-street-current-citizen',
  CURRENT_ADMIN: 'fix-my-street-current-admin',
};

// Get dynamic API URL depending on the runtime context
export function getApiUrl(path: string): string {
  if (typeof window === 'undefined') {
    // Server-side (Next.js API routes calling each other) — use relative path
    return path;
  }

  // Detect if running inside the native mobile app wrapper (Capacitor)
  const isCapacitor = !!(window as any).Capacitor;
  const isCapacitorProtocol = window.location.protocol.startsWith('capacitor');
  const isAndroidWebView = window.location.hostname === 'localhost' && window.location.port !== '3000';
  const isMobile = isCapacitor || isCapacitorProtocol || isAndroidWebView;

  if (isMobile) {
    // Inside Capacitor app wrapper: always call the absolute production API URL
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://www.puthuyugavijayam.in').replace(/\/$/, '');
    return `${baseUrl}${path}`;
  }

  // In all standard web browsers (hosted website OR local development):
  // Always use relative paths to avoid any CORS or redirect blocks!
  return path;
}

// Initialize database (No-op since backend is live MongoDB)
export function initializeDB() {
  console.log('Database initialized on live MongoDB database server.');
}

// Citizen Management (Live API Calls)
export async function registerCitizen(name: string, mobileNumber: string, password: string): Promise<Citizen> {
  const res = await fetch(getApiUrl('/api/auth/citizen/register'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, mobileNumber, password }),
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Registration failed');
  }
  
  return res.json();
}

export async function getCitizens(): Promise<Citizen[]> {
  const res = await fetch(getApiUrl('/api/citizens'), { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch citizens');
  return res.json();
}

export async function getCitizenByMobile(mobileNumber: string, password?: string): Promise<Citizen | null> {
  try {
    const res = await fetch(getApiUrl('/api/auth/citizen/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobileNumber, password }),
    });
    
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function getCitizenById(id: string): Promise<Citizen | null> {
  const citizens = await getCitizens();
  return citizens.find(c => c.id === id) || null;
}

export async function deleteCitizen(id: string): Promise<void> {
  const res = await fetch(getApiUrl(`/api/citizens?id=${id}`), {
    method: 'DELETE',
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Failed to delete user');
  }
}

// Complaint Management (Live API Calls)
export async function createComplaint(citizenId: string, data: Partial<Complaint>): Promise<Complaint> {
  const res = await fetch(getApiUrl('/api/complaints'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ citizenId, ...data }),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Failed to file report');
  }

  return res.json();
}

export async function getComplaints(): Promise<Complaint[]> {
  const res = await fetch(getApiUrl('/api/complaints'), { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch complaints');
  return res.json();
}

export async function getComplaintById(id: string): Promise<Complaint | null> {
  const complaints = await getComplaints();
  return complaints.find(c => c.id === id) || null;
}

export async function getComplaintsByCitizen(citizenId: string): Promise<Complaint[]> {
  const res = await fetch(getApiUrl(`/api/complaints?citizenId=${citizenId}`), { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch citizen complaints');
  return res.json();
}

export async function updateComplaintStatus(
  id: string,
  status: Complaint['status'],
  adminName: string,
  note: string,
  assignee?: string
): Promise<Complaint> {
  const res = await fetch(getApiUrl(`/api/complaints/${id}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, adminName, note, assignee }),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Failed to update complaint status');
  }

  return res.json();
}

export async function deleteComplaint(id: string): Promise<void> {
  const res = await fetch(getApiUrl(`/api/complaints/${id}`), {
    method: 'DELETE',
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Failed to delete complaint');
  }
}


// Notification Management (Live API Calls)
export async function createNotification(
  complaintId: string,
  message: string,
  type: LocalNotification['type']
): Promise<LocalNotification> {
  const res = await fetch(getApiUrl('/api/notifications'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ complaintId, message, type }),
  });

  if (!res.ok) throw new Error('Failed to create notification');
  return res.json();
}

export async function getNotifications(): Promise<LocalNotification[]> {
  const res = await fetch(getApiUrl('/api/notifications'), { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch notifications');
  return res.json();
}

export async function getNotificationsByCitizen(citizenId: string): Promise<LocalNotification[]> {
  const res = await fetch(getApiUrl(`/api/notifications?citizenId=${citizenId}`), { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch notifications for citizen');
  return res.json();
}

export async function markNotificationAsRead(notificationId: string): Promise<LocalNotification> {
  const res = await fetch(getApiUrl(`/api/notifications?id=${notificationId}`), {
    method: 'PATCH',
  });

  if (!res.ok) throw new Error('Failed to mark notification as read');
  return res.json();
}

export async function getUnreadNotificationCount(citizenId: string): Promise<number> {
  const notifs = await getNotificationsByCitizen(citizenId);
  return notifs.filter(n => !n.read).length;
}

// Session Management (Kept client-side for ultra-fast UX)
export function setCurrentCitizen(citizen: Citizen) {
  localStorage.setItem(DB_KEYS.CURRENT_CITIZEN, JSON.stringify(citizen));
}

export function getCurrentCitizen(): Citizen | null {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(DB_KEYS.CURRENT_CITIZEN);
  return data ? JSON.parse(data) : null;
}

export function clearCurrentCitizen() {
  localStorage.removeItem(DB_KEYS.CURRENT_CITIZEN);
}

export function setCurrentAdmin(isLoggedIn: boolean) {
  if (isLoggedIn) {
    localStorage.setItem(DB_KEYS.CURRENT_ADMIN, JSON.stringify({ loggedIn: true }));
  } else {
    localStorage.removeItem(DB_KEYS.CURRENT_ADMIN);
  }
}

export function isAdminLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  const data = localStorage.getItem(DB_KEYS.CURRENT_ADMIN);
  return data ? JSON.parse(data).loggedIn : false;
}

export function clearAdminSession() {
  localStorage.removeItem(DB_KEYS.CURRENT_ADMIN);
}
