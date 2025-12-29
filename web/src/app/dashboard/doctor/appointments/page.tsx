'use client';

import { useEffect, useState } from 'react';
import { appointmentsApi, Appointment } from '@/lib/api';
import { format } from 'date-fns';

export default function DoctorAppointmentsPage() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming');

    useEffect(() => {
        fetchAppointments();
    }, [filter]);

    const fetchAppointments = async () => {
        setIsLoading(true);
        try {
            const today = new Date().toISOString().split('T')[0];
            const filters: { fromDate?: string; toDate?: string } = {};

            if (filter === 'upcoming') {
                filters.fromDate = today;
            } else if (filter === 'past') {
                filters.toDate = today;
            }

            const response = await appointmentsApi.getAll(filters);
            setAppointments(response.data.appointments);
        } catch (error) {
            console.error('Failed to fetch appointments:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return 'bg-accent-500/20 text-accent-400';
            case 'pending': return 'bg-yellow-500/20 text-yellow-400';
            case 'cancelled': return 'bg-red-500/20 text-red-400';
            case 'completed': return 'bg-primary-500/20 text-primary-400';
            default: return 'bg-white/10 text-white/60';
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Appointments</h1>
                <p className="text-white/60">Manage your patient appointments</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
                {(['upcoming', 'past', 'all'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setFilter(tab)}
                        className={`px-4 py-2 rounded-xl font-medium transition-all capitalize ${filter === tab
                                ? 'bg-primary-500 text-white'
                                : 'bg-white/10 text-white/70 hover:bg-white/20'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Appointments List */}
            {isLoading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
                </div>
            ) : appointments.length === 0 ? (
                <div className="card-dark text-center py-12">
                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-10 h-10 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">No appointments</h3>
                    <p className="text-white/50">No appointments match your current filter.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {appointments.map((apt) => (
                        <div key={apt.id} className="card-dark">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-accent-400 to-primary-400 flex items-center justify-center text-white text-xl font-semibold">
                                        {apt.client?.firstName?.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-white">
                                            {apt.client?.firstName} {apt.client?.lastName}
                                        </h3>
                                        <p className="text-white/50">{apt.client?.email}</p>
                                        {apt.client?.phone && (
                                            <p className="text-white/40 text-sm">{apt.client.phone}</p>
                                        )}
                                    </div>
                                </div>

                                <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(apt.status)}`}>
                                    {apt.status}
                                </span>
                            </div>

                            {apt.reason && (
                                <div className="mt-4 p-3 bg-white/5 rounded-lg">
                                    <p className="text-white/50 text-sm">Reason:</p>
                                    <p className="text-white">{apt.reason}</p>
                                </div>
                            )}

                            <div className="flex items-center gap-6 mt-4 pt-4 border-t border-white/10 text-sm">
                                <div className="flex items-center gap-2 text-white/60">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    {format(new Date(apt.appointmentDate), 'EEEE, MMMM d, yyyy')}
                                </div>
                                <div className="flex items-center gap-2 text-white/60">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {apt.startTime.slice(0, 5)} - {apt.endTime.slice(0, 5)}
                                </div>
                                <span className="text-xs px-2 py-1 rounded bg-white/10 text-white/60">
                                    via {apt.bookedVia}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
