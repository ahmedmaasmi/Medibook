'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { appointmentsApi, calendarApi, Appointment } from '@/lib/api';
import { format } from 'date-fns';

export default function DoctorDashboard() {
    const { user, doctorProfile } = useAuth();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [calendarConnected, setCalendarConnected] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const today = new Date().toISOString().split('T')[0];
                const [allAppts, calStatus] = await Promise.all([
                    appointmentsApi.getAll({ fromDate: today }),
                    calendarApi.getStatus().catch(() => ({ data: { connected: false } })),
                ]);

                setAppointments(allAppts.data.appointments);
                setTodayAppointments(
                    allAppts.data.appointments.filter((a: Appointment) => a.appointmentDate === today)
                );
                setCalendarConnected(calStatus.data.connected);
            } catch (error) {
                console.error('Failed to fetch data:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Welcome, Dr. {user?.lastName}! 👋
                    </h1>
                    <p className="text-white/60">
                        {doctorProfile?.specialization} • Manage your appointments and availability
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid md:grid-cols-4 gap-6">
                <div className="card-dark">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center">
                            <span className="text-2xl">📅</span>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-white">{todayAppointments.length}</div>
                            <div className="text-white/50 text-sm">Today's Appointments</div>
                        </div>
                    </div>
                </div>

                <div className="card-dark">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-accent-500/20 flex items-center justify-center">
                            <span className="text-2xl">📊</span>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-white">{appointments.length}</div>
                            <div className="text-white/50 text-sm">Upcoming</div>
                        </div>
                    </div>
                </div>

                <div className="card-dark">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center">
                            <span className="text-2xl">⭐</span>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-white">{doctorProfile?.yearsOfExperience || 0}</div>
                            <div className="text-white/50 text-sm">Years Experience</div>
                        </div>
                    </div>
                </div>

                <div className="card-dark">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${calendarConnected ? 'bg-accent-500/20' : 'bg-yellow-500/20'
                            }`}>
                            <span className="text-2xl">📆</span>
                        </div>
                        <div>
                            <div className={`text-lg font-bold ${calendarConnected ? 'text-accent-400' : 'text-yellow-400'}`}>
                                {calendarConnected ? 'Connected' : 'Not Connected'}
                            </div>
                            <div className="text-white/50 text-sm">Google Calendar</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Today's Schedule */}
            <div className="card-dark">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-white">Today's Schedule</h2>
                    <span className="text-white/50">{format(new Date(), 'EEEE, MMMM d')}</span>
                </div>

                {todayAppointments.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <p className="text-white/50">No appointments scheduled for today</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {todayAppointments.map((apt) => (
                            <div key={apt.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                                <div className="text-primary-400 font-mono text-lg w-20">
                                    {apt.startTime.slice(0, 5)}
                                </div>
                                <div className="w-1 h-12 bg-primary-500 rounded-full"></div>
                                <div className="flex-1">
                                    <div className="text-white font-medium">
                                        {apt.client?.firstName} {apt.client?.lastName}
                                    </div>
                                    <div className="text-white/50 text-sm">
                                        {apt.reason || 'General consultation'}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-white/50 text-sm">{apt.client?.email}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 gap-6">
                <a href="/dashboard/doctor/availability" className="card-dark hover:border-primary-500/50 group">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center group-hover:bg-primary-500/30 transition-colors">
                            <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-white font-semibold">Manage Availability</h3>
                            <p className="text-white/50 text-sm">Set your working hours</p>
                        </div>
                    </div>
                </a>

                <a href="/dashboard/doctor/calendar" className="card-dark hover:border-accent-500/50 group">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-accent-500/20 flex items-center justify-center group-hover:bg-accent-500/30 transition-colors">
                            <svg className="w-6 h-6 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-white font-semibold">Google Calendar Sync</h3>
                            <p className="text-white/50 text-sm">Sync appointments with your calendar</p>
                        </div>
                    </div>
                </a>
            </div>
        </div>
    );
}
