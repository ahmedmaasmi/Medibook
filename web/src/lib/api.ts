import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface RequestOptions {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
}

class ApiClient {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    private getAuthHeaders(): Record<string, string> {
        const token = Cookies.get('token');
        return token ? { Authorization: `Bearer ${token}` } : {};
    }

    async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
        const { method = 'GET', body, headers = {} } = options;

        const config: RequestInit = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...this.getAuthHeaders(),
                ...headers,
            },
        };

        if (body) {
            config.body = JSON.stringify(body);
        }

        const response = await fetch(`${this.baseUrl}${endpoint}`, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'An error occurred');
        }

        return data;
    }

    get<T>(endpoint: string) {
        return this.request<T>(endpoint);
    }

    post<T>(endpoint: string, body: unknown) {
        return this.request<T>(endpoint, { method: 'POST', body });
    }

    put<T>(endpoint: string, body: unknown) {
        return this.request<T>(endpoint, { method: 'PUT', body });
    }

    patch<T>(endpoint: string, body: unknown) {
        return this.request<T>(endpoint, { method: 'PATCH', body });
    }

    delete<T>(endpoint: string) {
        return this.request<T>(endpoint, { method: 'DELETE' });
    }

    async stream(endpoint: string, body: unknown, onToken: (token: string) => void, onComplete?: (data: any) => void) {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...this.getAuthHeaders(),
            },
            body: JSON.stringify({ ...body as object, stream: true }),
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
        api.get<{ success: boolean; data: { doctors: Doctor[] } }>('/doctors'),

    getById: (id: string) =>
        api.get<{ success: boolean; data: { doctor: Doctor } }>(`/doctors/${id}`),

    getAvailability: (id: string) =>
        api.get<{ success: boolean; data: { availabilities: Availability[] } }>(`/doctors/${id}/availability`),

    updateProfile: (data: Partial<DoctorProfile>) =>
        api.put<{ success: boolean; data: { doctor: DoctorProfile } }>('/doctors/profile', data),

    setAvailability: (data: AvailabilityInput) =>
        api.post<{ success: boolean; data: { availability: Availability } }>('/doctors/availability', data),
};

// Appointments API
export const appointmentsApi = {
    getSlots: (doctorId: string, date: string) =>
        api.get<{ success: boolean; data: { slots: TimeSlot[] } }>(`/appointments/slots/${doctorId}?date=${date}`),

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

    streamMessage: (message: string, onToken: (token: string) => void, onComplete?: (data: any) => void) =>
        api.stream('/chat/message', { message }, onToken, onComplete),
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

// Types
export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: 'client' | 'doctor';
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
}

export interface Intent {
    intent: string;
    doctorName?: string;
    date?: string;
    time?: string;
    reason?: string;
}

export default api;
