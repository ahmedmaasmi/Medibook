'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { appointmentsApi, doctorsApi, Appointment, Doctor } from '@/lib/api';
import { format } from 'date-fns';

export default function ClientDashboard() {
    const { user } = useAuth();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [apptRes, docRes] = await Promise.all([
                    appointmentsApi.getAll({ fromDate: new Date().toISOString().split('T')[0] }),
                    doctorsApi.getAll(),
                ]);
                setAppointments(apptRes.data.appointments.slice(0, 3));
                setDoctors(docRes.data.doctors.slice(0, 4));
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
                        Welcome back, {user?.firstName}! 👋
                    </h1>
                    <p className="text-white/60">Manage your healthcare appointments easily</p>
                </div>
                <Link href="/dashboard/client/voice" className="btn-primary flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    Voice Booking
                </Link>
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-3 gap-6">
                <Link href="/dashboard/client/book" className="card-dark hover:border-primary-500/50 group">
                    <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center mb-4 group-hover:bg-primary-500/30 transition-colors">
                        <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                    </div>
                    <h3 className="text-white font-semibold mb-1">Book Appointment</h3>
                    <p className="text-white/50 text-sm">Schedule a new appointment with a doctor</p>
                </Link>

                <Link href="/dashboard/client/voice" className="card-dark hover:border-purple-500/50 group">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4 group-hover:bg-purple-500/30 transition-colors">
                        <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                    </div>
                    <h3 className="text-white font-semibold mb-1">AI Voice Assistant</h3>
                    <p className="text-white/50 text-sm">Book using natural voice commands</p>
                </Link>

                <Link href="/dashboard/client/appointments" className="card-dark hover:border-accent-500/50 group">
                    <div className="w-12 h-12 rounded-xl bg-accent-500/20 flex items-center justify-center mb-4 group-hover:bg-accent-500/30 transition-colors">
                        <svg className="w-6 h-6 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    </div>
                    <h3 className="text-white font-semibold mb-1">My Appointments</h3>
                    <p className="text-white/50 text-sm">View and manage your appointments</p>
                </Link>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Upcoming Appointments */}
                <div className="card-dark">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-semibold text-white">Upcoming Appointments</h2>
                        <Link href="/dashboard/client/appointments" className="text-primary-400 text-sm hover:text-primary-300">
                            View all
                        </Link>
                    </div>

                    {appointments.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <p className="text-white/50">No upcoming appointments</p>
                            <Link href="/dashboard/client/book" className="text-primary-400 text-sm mt-2 inline-block">
                                Book your first appointment
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {appointments.map((apt) => (
                                <div key={apt.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary-400 to-purple-400 flex items-center justify-center text-white font-semibold">
                                        {apt.doctor?.user?.firstName?.charAt(0) || 'D'}
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-white font-medium">
                                            Dr. {apt.doctor?.user?.firstName} {apt.doctor?.user?.lastName}
                                        </div>
                                        <div className="text-white/50 text-sm">
                                            {apt.doctor?.specialization}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-primary-400 font-medium">
                                            {format(new Date(apt.appointmentDate), 'MMM d')}
                                        </div>
                                        <div className="text-white/50 text-sm">
                                            {apt.startTime.slice(0, 5)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Available Doctors */}
                <div className="card-dark">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-semibold text-white">Available Doctors</h2>
                        <Link href="/dashboard/client/book" className="text-primary-400 text-sm hover:text-primary-300">
                            See all
                        </Link>
                    </div>

                    {doctors.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-white/50">No doctors available</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {doctors.map((doc) => (
                                <Link
                                    key={doc.id}
                                    href={`/dashboard/client/book?doctor=${doc.id}`}
                                    className="flex items-center gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                                >
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-accent-400 to-primary-400 flex items-center justify-center text-white font-semibold">
                                        {doc.user?.firstName?.charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-white font-medium">
                                            Dr. {doc.user?.firstName} {doc.user?.lastName}
                                        </div>
                                        <div className="text-white/50 text-sm">{doc.specialization}</div>
                                    </div>
                                    <svg className="w-5 h-5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
