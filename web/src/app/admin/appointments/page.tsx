'use client';

import { useEffect, useState } from 'react';
import { adminApi, Appointment, Pagination } from '@/lib/api';

export default function AppointmentsPage() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);

    useEffect(() => {
        loadAppointments(page);
    }, [page]);

    const loadAppointments = async (p: number) => {
        setLoading(true);
        try {
            const res = await adminApi.getAppointments(p);
            setAppointments(res.data.appointments);
            setPagination(res.data.pagination);
        } catch (error) {
            console.error('Failed to load appointments:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white">Appointments</h1>
                <div className="flex gap-2">
                     <select className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500">
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                    <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors">
                        Filter
                    </button>
                </div>
            </div>

            <div className="bg-[#1E293B]/50 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase font-medium">
                            <tr>
                                <th className="px-6 py-4">Patient</th>
                                <th className="px-6 py-4">Doctor</th>
                                <th className="px-6 py-4">Date & Time</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">Loading appointments...</td>
                                </tr>
                            ) : appointments.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No appointments found</td>
                                </tr>
                            ) : (
                                appointments.map(apt => (
                                    <tr key={apt.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-white">
                                                {apt.client ? `${apt.client.firstName} ${apt.client.lastName}` : 'Unknown'}
                                            </div>
                                            <div className="text-xs text-slate-400">{apt.client?.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-white">
                                                {apt.doctor ? `Dr. ${apt.doctor.user.firstName} ${apt.doctor.user.lastName}` : 'Unknown'}
                                            </div>
                                            <div className="text-xs text-indigo-400">{apt.doctor?.specialization}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-white">{new Date(apt.appointmentDate).toLocaleDateString()}</div>
                                            <div className="text-xs text-slate-400">{apt.startTime} - {apt.endTime}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                             <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                apt.status === 'confirmed' ? 'bg-green-500/10 text-green-400' :
                                                apt.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' :
                                                apt.status === 'cancelled' ? 'bg-red-500/10 text-red-400' :
                                                'bg-slate-500/10 text-slate-400'
                                            }`}>
                                                {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-slate-400 hover:text-white transition-colors">
                                                Details
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-white/5">
                        <span className="text-sm text-slate-400">
                            Showing page {pagination.page} of {pagination.pages}
                        </span>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={pagination.page === 1}
                                className="px-3 py-1 bg-slate-800 text-white rounded-lg text-sm disabled:opacity-50 hover:bg-slate-700"
                            >
                                Previous
                            </button>
                            <button 
                                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                                disabled={pagination.page === pagination.pages}
                                className="px-3 py-1 bg-slate-800 text-white rounded-lg text-sm disabled:opacity-50 hover:bg-slate-700"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
