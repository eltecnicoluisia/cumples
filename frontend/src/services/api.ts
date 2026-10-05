import {
  Person,
  TreeGraphData,
  UpcomingEventsResponse,
  DemographicsResponse,
  User,
  UserAdminItem,
  AdminPlatformStats,
  TreeItem,
} from '../types';

const API_BASE = (typeof window !== 'undefined' && window.location.hostname.includes('github.io'))
  ? 'https://cumples.informaticosvenezuela.com/api'
  : (import.meta.env.VITE_API_BASE || '/api');

export function getAuthToken(): string | null {
  return sessionStorage.getItem('geneatrack_token') || localStorage.getItem('geneatrack_token');
}

export function setAuthToken(token: string, remember: boolean = false): void {
  sessionStorage.setItem('geneatrack_token', token);
  if (remember) {
    localStorage.setItem('geneatrack_token', token);
  }
}

export function clearAuthToken(): void {
  sessionStorage.removeItem('geneatrack_token');
  localStorage.removeItem('geneatrack_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `Error HTTP ${response.status}`;
    try {
      const data = await response.json();
      errorMsg = data.error || data.message || errorMsg;
    } catch {
      // Ignorar si no es JSON
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export const api = {
  // Auth
  login: (data: { username: string; password: string }) =>
    request<{ message: string; token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  register: (data: { phone: string; password: string; username?: string; email?: string; fullName?: string }) =>
    request<{ message: string; token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getCurrentUser: () => request<{ user: User }>('/auth/me'),

  checkUserExists: (identifier: string) =>
    request<{ exists: boolean; user?: { username: string; fullName?: string; phone?: string } }>('/auth/check-user', {
      method: 'POST',
      body: JSON.stringify({ identifier }),
    }),

  // Trees (Multi-Árboles)
  getTrees: () => request<{ trees: TreeItem[] }>('/trees'),
  createTree: (data: { name: string; description?: string }) =>
    request<{ message: string; tree: TreeItem }>('/trees', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteTree: (id: string) =>
    request<{ message: string }>(`/trees/${id}`, {
      method: 'DELETE',
    }),

  // Persons
  getPersons: () => request<{ persons: Person[] }>('/persons'),

  getPersonById: (id: string) => request<{ person: Person }>(`/persons/${id}`),

  getTreeGraph: () => request<TreeGraphData>('/persons/tree-graph'),

  createPerson: (data: Partial<Person>) =>
    request<{ message: string; person: Person }>('/persons', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updatePerson: (id: string, data: Partial<Person>) =>
    request<{ message: string; person: Person }>(`/persons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deletePerson: (id: string) =>
    request<{ message: string }>(`/persons/${id}`, {
      method: 'DELETE',
    }),

  // Upload Avatar
  uploadAvatar: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('avatar', file);
    return request<{ url: string }>('/upload/avatar', {
      method: 'POST',
      body: formData,
    });
  },

  // Relations
  addParentChildRelation: (data: { parentId: string; childId: string; type?: string }) =>
    request<{ message: string; relation: any }>('/relations/parent-child', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteParentChildRelation: (id: string) =>
    request<{ message: string }>(`/relations/parent-child/${id}`, {
      method: 'DELETE',
    }),

  addSpouseRelation: (data: {
    person1Id: string;
    person2Id: string;
    type?: string;
    marriageDate?: string | null;
    notes?: string | null;
  }) =>
    request<{ message: string; spouse: any }>('/relations/spouse', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteSpouseRelation: (id: string) =>
    request<{ message: string }>(`/relations/spouse/${id}`, {
      method: 'DELETE',
    }),

  // Events & Stats
  getUpcomingEvents: () => request<UpcomingEventsResponse>('/events/upcoming'),

  getDemographics: () => request<DemographicsResponse>('/stats/demographics'),

  // Backups
  exportJSONUrl: () => `${API_BASE}/backup/export/json`,
  exportGEDCOMUrl: () => `${API_BASE}/backup/export/gedcom`,

  importJSONBackup: (data: any) =>
    request<{ message: string; count: number }>('/backup/import/json', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Super Admin SaaS
  getAdminUsers: () => request<{ users: UserAdminItem[] }>('/admin/users'),

  createAdminUser: (data: any) =>
    request<{ message: string; user: UserAdminItem }>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateAdminUser: (id: string, data: any) =>
    request<{ message: string; user: UserAdminItem }>(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  resetAdminUserPassword: (id: string, password: string) =>
    request<{ message: string }>(`/admin/users/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),

  deleteAdminUser: (id: string) =>
    request<{ message: string }>(`/admin/users/${id}`, {
      method: 'DELETE',
    }),

  getAdminStats: () => request<AdminPlatformStats>('/admin/stats'),
};

