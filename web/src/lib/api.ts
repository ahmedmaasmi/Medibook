import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface RequestOptions {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
}

class ApiClient {
    private baseUrl: string;
    private token: string | null = null;
    private cache = new Map<string, { data: any; expiry: number }>();
    private inFlight = new Map<string, Promise<any>>();

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    setToken(token: string | null) {
        this.token = token;
        // Clear cache when token changes to avoid cross-user data leak
        this.cache.clear();
        this.inFlight.clear();
    }

    private getAuthHeaders(): Record<string, string> {
        const token = this.token || Cookies.get('token');
        return token ? { Authorization: `Bearer ${token}` } : {};
    }

    async request<T>(endpoint: string, options: RequestOptions & { signal?: AbortSignal; cacheKey?: string; ttl?: number } = {}): Promise<T> {
        const { method = 'GET', body, headers = {}, signal, cacheKey, ttl } = options;

        // Only cache GET requests
        const isCacheable = method === 'GET' && (cacheKey || ttl);
        const fullCacheKey = isCacheable ? `${method}:${endpoint}:${this.token || Cookies.get('token') || 'anon'}` : null;

        if (fullCacheKey) {
            const cached = this.cache.get(fullCacheKey);
            if (cached && cached.expiry > Date.now()) {
                return cached.data as T;
            }

            // Dedupe in-flight requests
            const existingPromise = this.inFlight.get(fullCacheKey);
            if (existingPromise) {
                return existingPromise as Promise<T>;
            }
        }

        const config: RequestInit = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...this.getAuthHeaders(),
                ...headers,
            },
            credentials: 'include',
            signal,
        };

        if (body) {
            config.body = JSON.stringify(body);
        }

        const fetchPromise = (async () => {
            try {
                const response = await fetch(`${this.baseUrl}${endpoint}`, config);
                const data = await response.json();

                if (!response.ok) {
                    const error = new Error(data.message || 'An error occurred') as Error & { status?: number };
                    error.status = response.status;
                    throw error;
                }

                if (fullCacheKey && ttl) {
                    this.cache.set(fullCacheKey, {
                        data,
                        expiry: Date.now() + ttl,
                    });
                }

                return data;
            } finally {
                if (fullCacheKey) {
                    this.inFlight.delete(fullCacheKey);
                }
            }
        })();

        if (fullCacheKey) {
            this.inFlight.set(fullCacheKey, fetchPromise);
        }

        return fetchPromise;
    }

    get<T>(endpoint: string, options: { signal?: AbortSignal; ttl?: number } = {}) {
        return this.request<T>(endpoint, options);
    }

    post<T>(endpoint: string, body: unknown, options: { signal?: AbortSignal } = {}) {
        return this.request<T>(endpoint, { method: 'POST', body, ...options });
    }

    put<T>(endpoint: string, body: unknown, options: { signal?: AbortSignal } = {}) {
        return this.request<T>(endpoint, { method: 'PUT', body, ...options });
    }

    patch<T>(endpoint: string, body: unknown, options: { signal?: AbortSignal } = {}) {
        return this.request<T>(endpoint, { method: 'PATCH', body, ...options });
    }

    delete<T>(endpoint: string, options: { signal?: AbortSignal } = {}) {
        return this.request<T>(endpoint, { method: 'DELETE', ...options });
    }

    async stream(endpoint: string, body: unknown, onToken: (token: string) => void, onComplete?: (data: any) => void, signal?: AbortSignal) {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...this.getAuthHeaders(),
            },
            body: JSON.stringify({ ...body as object, stream: true }),
            credentials: 'include',
            signal,
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'An error occurred');
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) throw new Error('Response body is not readable');

        let partialData = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = (partialData + chunk).split('\n');
            partialData = lines.pop() || '';

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const dataStr = line.slice(6);
                    if (dataStr === '[DONE]') break;
                    try {
                        const data = JSON.parse(dataStr);
                        if (data.token) {
                            onToken(data.token);
                        }
                        if (data.final && onComplete) {
                            onComplete(data);
                        }
                    } catch (e) {
                        console.error('Error parsing stream data:', e);
                    }
                }
            }
        }
    }
}

export const api = new ApiClient(API_URL);

// Auth API functions
export const authApi = {
    login: (email: string, password: string) =>
        api.post<{ success: boolean; data: { user: User; token: string } }>('/auth/login', { email, password }),

    register: (data: RegisterData) =>
        api.post<{ success: boolean; data: { user: User; token: string } }>('/auth/register', data),

    getProfile: () =>
        api.get<{ success: boolean; data: { user: User; doctorProfile?: DoctorProfile } }>('/auth/me'),

    verify: () =>
        api.get<{ success: boolean; data: { user: User } }>('/auth/verify'),
};

// Doctors API
export const doctorsApi = {
    getAll: () =>
        api.get<{ success: boolean; data: { doctors: Doctor[] } }>('/doctors', { ttl: 5 * 60 * 1000 }), // 5 min cache

    getById: (id: string) =>
        api.get<{ success: boolean; data: { doctor: Doctor } }>(`/doctors/${id}`, { ttl: 60 * 1000 }), // 1 min cache

    getAvailability: (id: string) =>
        api.get<{ success: boolean; data: { availabilities: Availability[] } }>(`/doctors/${id}/availability`, { ttl: 30 * 1000 }), // 30 sec cache

    updateProfile: (data: Partial<DoctorProfile>) =>
        api.put<{ success: boolean; data: { doctor: DoctorProfile } }>('/doctors/profile', data),

    setAvailability: (data: AvailabilityInput) =>
        api.post<{ success: boolean; data: { availability: Availability } }>('/doctors/availability', data),
};

// Appointments API
export const appointmentsApi = {
    getSlots: (doctorId: string, date: string, signal?: AbortSignal) =>
        api.get<{ success: boolean; data: { slots: TimeSlot[] } }>(`/appointments/slots/${doctorId}?date=${date}`, { signal, ttl: 30 * 1000 }), // 30 sec cache

    book: (data: BookingData) =>
        api.post<{ success: boolean; data: { appointment: Appointment } }>('/appointments', data),

    getAll: (filters?: AppointmentFilters) => {
        const params = new URLSearchParams();
        if (filters?.status) params.append('status', filters.status);
        if (filters?.fromDate) params.append('fromDate', filters.fromDate);
        if (filters?.toDate) params.append('toDate', filters.toDate);
        return api.get<{ success: boolean; data: { appointments: Appointment[] } }>(`/appointments?${params}`);
    },

    cancel: (id: string) =>
        api.patch<{ success: boolean; data: { appointment: Appointment } }>(`/appointments/${id}/cancel`, {}),

    reschedule: (id: string, data: RescheduleData) =>
        api.patch<{ success: boolean; data: { appointment: Appointment } }>(`/appointments/${id}/reschedule`, data),
};

// Voice API
export const voiceApi = {
    process: (transcript: string) =>
        api.post<{ success: boolean; data: VoiceResponse }>('/voice/process', { transcript }),

    streamProcess: (transcript: string, onToken: (token: string) => void, onComplete?: (data: any) => void) =>
        api.stream('/voice/process', { transcript }, onToken, onComplete),

    extractIntent: (transcript: string) =>
        api.post<{ success: boolean; data: { intent: Intent } }>('/voice/extract-intent', { transcript }),
};

// Chat API
export const chatApi = {
    message: (message: string) =>
        api.post<{ success: boolean; data: ChatResponse }>('/chat/message', { message }),

    streamMessage: (message: string, onToken: (token: string) => void, onComplete?: (data: any) => void, signal?: AbortSignal) =>
        api.stream('/chat/message', { message }, onToken, onComplete, signal),
};

// Calendar API
export const calendarApi = {
    getAuthUrl: () =>
        api.get<{ success: boolean; data: { authUrl: string } }>('/calendar/auth-url'),

    getStatus: () =>
        api.get<{ success: boolean; data: { connected: boolean } }>('/calendar/status'),

    disconnect: () =>
        api.post<{ success: boolean }>('/calendar/disconnect', {}),
};

// Admin API
export const adminApi = {
    getStats: () =>
        api.get<{ success: boolean; data: AdminStats }>('/admin/stats'),

    getUsers: (page = 1, limit = 10) =>
        api.get<{ success: boolean; data: { users: User[], pagination: Pagination } }>(`/admin/users?page=${page}&limit=${limit}`),

    updateUser: (id: string, data: { role?: string, isActive?: boolean }) =>
        api.patch<{ success: boolean; data: { user: User } }>(`/admin/users/${id}`, data),

    getAppointments: (page = 1, limit = 10) =>
        api.get<{ success: boolean; data: { appointments: Appointment[], pagination: Pagination } }>(`/admin/appointments?page=${page}&limit=${limit}`),
};

// Types
export interface AdminStats {
    totalUsers: number;
    totalDoctors: number;
    totalAppointments: number;
    pendingAppointments: number;
}

export interface Pagination {
    total: number;
    page: number;
    pages: number;
}

export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: 'client' | 'doctor' | 'admin';
    isActive: boolean;
    createdAt: string;
}

export interface DoctorProfile {
    id: string;
    userId: string;
    specialization: string;
    licenseNumber: string;
    bio?: string;
    consultationFee?: number;
    yearsOfExperience?: number;
    googleCalendarConnected: boolean;
}

export interface Doctor {
    id: string;
    specialization: string;
    bio?: string;
    consultationFee?: number;
    yearsOfExperience?: number;
    user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
}

export interface Availability {
    id: string;
    doctorId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    slotDuration: number;
    isActive: boolean;
}

export interface AvailabilityInput {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    slotDuration?: number;
}

export interface TimeSlot {
    startTime: string;
    endTime: string;
    available: boolean;
}

export interface Appointment {
    id: string;
    clientId: string;
    doctorId: string;
    appointmentDate: string;
    startTime: string;
    endTime: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    reason?: string;
    notes?: string;
    bookedVia: 'web' | 'mobile' | 'voice';
    doctor?: Doctor;
    client?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        phone?: string;
    };
}

export interface RegisterData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: 'client' | 'doctor';
    doctorInfo?: {
        specialization: string;
        licenseNumber: string;
        bio?: string;
    };
}

export interface BookingData {
    doctorId: string;
    appointmentDate: string;
    startTime: string;
    endTime: string;
    reason?: string;
}

export interface RescheduleData {
    appointmentDate: string;
    startTime: string;
    endTime: string;
}

export interface AppointmentFilters {
    status?: string;
    fromDate?: string;
    toDate?: string;
}

export interface VoiceResponse {
    success: boolean;
    intent: string;
    message: string;
    data?: unknown;
}

export interface ChatResponse {
    success: boolean;
    bot_message: string;
    suggested_specialty: string | null;
    doctors: Doctor[];
    intent: string;
    data?: {
        slots?: TimeSlot[];
        doctor?: Doctor;
    };
}

export interface Intent {
    intent: string;
    doctorName?: string;
    date?: string;
    time?: string;
    reason?: string;
}

export default api;
