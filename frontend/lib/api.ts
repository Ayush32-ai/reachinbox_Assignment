// IMPORTANT:
// - Set NEXT_PUBLIC_API_URL to something like: http://localhost:4000
// - Backend routes are under /api/*, so we keep that in the path (not in BASE_URL)
// Backend default port is 4000 (see backend/src/config.ts). Use NEXT_PUBLIC_API_URL
// to override in your environment when necessary.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface Email {
  id: string;
  subject: string;
  body: string;
  recipient: string;
  scheduledFor?: string;
  sentAt?: string;
  status: 'pending' | 'sent' | 'failed';
}

export interface ScheduleEmailRequest {
  subject: string;
  body: string;
  recipients: string[];
  startTime: string | Date;
  delaySeconds: number;
  hourlyLimit: number;
  senderEmail: string;
  senderName?: string;
}

export interface ScheduleEmailResponse {
  ok: boolean;
  batchId: string;
  totalRecipients: number;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    // Try to get token from localStorage (for Google OAuth)
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        localStorage.removeItem('auth_token');
      }
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    let response: Response;
    try {
      response = await fetch(url, {
        ...options,
        headers,
      });
    } catch (err: any) {
      // Network-level failures (server down, CORS, DNS, etc.) show up here
      const message = err?.message || 'Network error while connecting to API';
      throw new Error(`Failed to fetch ${url}: ${message}`);
    }

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  async getScheduledEmails(): Promise<{ items: Email[] }> {
    return this.request<{ items: Email[] }>('/api/emails/scheduled');
  }

  async getSentEmails(): Promise<{ items: Email[] }> {
    return this.request<{ items: Email[] }>('/api/emails/sent');
  }

  async scheduleEmail(data: ScheduleEmailRequest): Promise<ScheduleEmailResponse> {
    // Convert delay to seconds if provided in minutes
    const delaySeconds = data.delaySeconds * 60 || 1800; // Default 30 minutes
    
    return this.request<ScheduleEmailResponse>('/api/emails/schedule', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        delaySeconds,
        startTime: typeof data.startTime === 'string' ? data.startTime : data.startTime.toISOString(),
      }),
    });
  }

  async uploadRecipientsList(file: File, scheduleData: Omit<ScheduleEmailRequest, 'recipients'>): Promise<ScheduleEmailResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('subject', scheduleData.subject);
    formData.append('body', scheduleData.body);
    formData.append('startTime', typeof scheduleData.startTime === 'string' ? scheduleData.startTime : scheduleData.startTime.toISOString());
    formData.append('delaySeconds', String((scheduleData.delaySeconds || 30) * 60));
    formData.append('hourlyLimit', String(scheduleData.hourlyLimit || 30));
    formData.append('senderEmail', scheduleData.senderEmail);
    if (scheduleData.senderName) {
      formData.append('senderName', scheduleData.senderName);
    }

    const url = `${this.baseUrl}/api/emails/schedule`;
    const headers: Record<string, string> = {};

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }


    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async parseRecipientsFromFile(file: File): Promise<{ items: string[] }> {
    const formData = new FormData();
    formData.append('file', file);

    const url = `${this.baseUrl}/api/emails/parse`;
    const headers: Record<string, string> = {};

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

