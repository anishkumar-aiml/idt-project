import {
  User,
  Complaint,
  ComplaintHistoryItem,
  Department,
  PublicStats,
  AdminStats,
  PublicTrackingData,
  PublicTimelineItem,
  DatabaseHealth,
} from '../types';

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('smart_civic_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Request failed with HTTP status ${res.status}`);
  }
  return data;
}

export const api = {
  // Authentication
  auth: {
    async register(payload: { name: string; email: string; mobile: string; password: string }): Promise<{
      success: boolean;
      token: string;
      user: User;
      message: string;
    }> {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return handleResponse(res);
    },

    async login(payload: { email: string; password: string }): Promise<{
      success: boolean;
      token: string;
      user: User;
      message: string;
    }> {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return handleResponse(res);
    },

    async getMe(): Promise<{ success: boolean; user: User }> {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { ...getAuthHeader() },
      });
      return handleResponse(res);
    },

    async logout(): Promise<{ success: boolean }> {
      const res = await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: { ...getAuthHeader() },
      });
      return handleResponse(res);
    },
  },

  // Complaints
  complaints: {
    async submitComplaint(formData: FormData): Promise<{
      success: boolean;
      message: string;
      complaint: Complaint;
    }> {
      const res = await fetch(`${API_BASE}/complaints`, {
        method: 'POST',
        headers: {
          ...getAuthHeader(),
          // Note: browser sets multipart/form-data boundary automatically
        },
        body: formData,
      });
      return handleResponse(res);
    },

    async getMyComplaints(params?: {
      status?: string;
      category?: string;
      search?: string;
      tab?: 'all' | 'pending' | 'resolved';
    }): Promise<{ success: boolean; count: number; complaints: Complaint[] }> {
      const query = new URLSearchParams();
      if (params?.status) query.set('status', params.status);
      if (params?.category) query.set('category', params.category);
      if (params?.search) query.set('search', params.search);
      if (params?.tab) query.set('tab', params.tab);

      const res = await fetch(`${API_BASE}/complaints/my?${query.toString()}`, {
        headers: { ...getAuthHeader() },
      });
      return handleResponse(res);
    },

    async getComplaint(idOrCode: string | number): Promise<{
      success: boolean;
      complaint: Complaint;
      history: ComplaintHistoryItem[];
    }> {
      const res = await fetch(`${API_BASE}/complaints/${idOrCode}`, {
        headers: { ...getAuthHeader() },
      });
      return handleResponse(res);
    },

    async addNote(complaintId: number, note: string): Promise<{ success: boolean; message: string }> {
      const res = await fetch(`${API_BASE}/complaints/${complaintId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({ note }),
      });
      return handleResponse(res);
    },
  },

  // Public
  public: {
    async getStats(): Promise<{ success: boolean; stats: PublicStats }> {
      const res = await fetch(`${API_BASE}/public/stats`);
      return handleResponse(res);
    },

    async trackComplaint(code: string): Promise<{
      success: boolean;
      complaint: PublicTrackingData;
      timeline: PublicTimelineItem[];
      message?: string;
    }> {
      const res = await fetch(`${API_BASE}/public/track/${encodeURIComponent(code)}`);
      return handleResponse(res);
    },

    async getHealth(): Promise<{
      status: string;
      system: string;
      owner: string;
      uptimeSeconds: number;
      database: DatabaseHealth;
    }> {
      const res = await fetch(`${API_BASE}/public/health`);
      return handleResponse(res);
    },
  },

  // Administrator
  admin: {
    async getComplaints(params?: {
      status?: string;
      category?: string;
      priority?: string;
      departmentId?: string;
      search?: string;
    }): Promise<{ success: boolean; count: number; complaints: Complaint[] }> {
      const query = new URLSearchParams();
      if (params?.status) query.set('status', params.status);
      if (params?.category) query.set('category', params.category);
      if (params?.priority) query.set('priority', params.priority);
      if (params?.departmentId) query.set('departmentId', params.departmentId);
      if (params?.search) query.set('search', params.search);

      const res = await fetch(`${API_BASE}/admin/complaints?${query.toString()}`, {
        headers: { ...getAuthHeader() },
      });
      return handleResponse(res);
    },

    async getStats(): Promise<{ success: boolean; stats: AdminStats }> {
      const res = await fetch(`${API_BASE}/admin/stats`, {
        headers: { ...getAuthHeader() },
      });
      return handleResponse(res);
    },

    async updateStatus(
      complaintId: number,
      payload: {
        status?: string;
        departmentId?: number | string;
        assignedTo?: string;
        remarks?: string;
        resolutionNotes?: string;
      }
    ): Promise<{ success: boolean; message: string }> {
      const res = await fetch(`${API_BASE}/admin/complaints/${complaintId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(payload),
      });
      return handleResponse(res);
    },

    async getDepartments(): Promise<{ success: boolean; departments: Department[] }> {
      const res = await fetch(`${API_BASE}/admin/departments`, {
        headers: { ...getAuthHeader() },
      });
      return handleResponse(res);
    },

    async createDepartment(payload: {
      name: string;
      code: string;
      contactEmail?: string;
      headOfficer?: string;
    }): Promise<{ success: boolean; message: string; departmentId: number }> {
      const res = await fetch(`${API_BASE}/admin/departments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(payload),
      });
      return handleResponse(res);
    },

    getExportCsvUrl(): string {
      const token = localStorage.getItem('smart_civic_token') || '';
      return `${API_BASE}/admin/export-csv?token=${encodeURIComponent(token)}`;
    },

    async downloadCsv(): Promise<void> {
      const res = await fetch(`${API_BASE}/admin/export-csv`, {
        headers: { ...getAuthHeader() },
      });
      if (!res.ok) throw new Error('Failed to download CSV report');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `smart_civic_complaints_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    },
  },
};
