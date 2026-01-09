'use client';

import { useEffect, useState } from 'react';
import { adminApi, AdminStats, Appointment } from '@/lib/api';
import Link from 'next/link';

export default function AdminDashboard() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [recentAppointments, setRecentAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [statsRes, appointmentsRes] = await Promise.all([
                adminApi.getStats(),
                adminApi.getAppointments(1, 5)
            ]);
            setStats(statsRes.data);
            setRecentAppointments(appointmentsRes.data.appointments);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="text-white">Loading...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-white mb-6">Dashboard Overview</h1>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Total Users" 
                    value={stats?.totalUsers || 0} 
                    icon="users"
                    gradient="from-blue-500 to-blue-600"
                    trend="+12% this month"
                />
                <StatCard 
                    title="Total Doctors" 
                    value={stats?.totalDoctors || 0} 
                    icon="doctor"
                    gradient="from-indigo-500 to-indigo-600"
                    trend="+2 new"
                />
                <StatCard 
                    title="Appointments" 
                    value={stats?.totalAppointments || 0} 
                    icon="calendar"
                    gradient="from-violet-500 to-purple-600"
                    trend="+5% vs last week"
                />
                <StatCard 
                    title="Pending" 
                    value={stats?.pendingAppointments || 0} 
                    icon="clock"
                    gradient="from-fuchsia-500 to-pink-600"
                    trend="Action required"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Chart */}
                <div className="lg:col-span-2 bg-[#1E293B]/50 backdrop-blur-md border border-white/5 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold text-lg text-white">Revenue Analytics</h3>
                        <select className="bg-slate-800 border border-slate-700 text-sm rounded-lg px-3 py-1 text-slate-300 outline-none">
                            <option>This Year</option>
                            <option>Last Year</option>
                        </select>
                    </div>
                    <div className="h-64 w-full">
                         {/* Simple SVG Line Chart */}
                         <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible">
                            {/* Grid lines */}
                            <line x1="0" y1="30" x2="100" y2="30" stroke="rgba(255,255,255,0.1)" strokeWidth="0.1" />
                            <line x1="0" y1="20" x2="100" y2="20" stroke="rgba(255,255,255,0.1)" strokeWidth="0.1" />
                            <line x1="0" y1="10" x2="100" y2="10" stroke="rgba(255,255,255,0.1)" strokeWidth="0.1" />
                            
                            {/* Chart Line */}
                            <path 
                                d="M0,35 Q10,25 20,28 T40,20 T60,15 T80,10 T100,5" 
                                fill="none" 
                                stroke="url(#gradient)" 
                                strokeWidth="1"
                                strokeLinecap="round"
                            />
                            {/* Area under curve */}
                            <path 
                                d="M0,35 Q10,25 20,28 T40,20 T60,15 T80,10 T100,5 V40 H0 Z" 
                                fill="url(#gradientArea)" 
                                opacity="0.2"
                            />
                            
                            <defs>
                                <linearGradient id="gradient" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#3B82F6" />
                                    <stop offset="100%" stopColor="#8B5CF6" />
                                </linearGradient>
                                <linearGradient id="gradientArea" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#3B82F6" />
                                    <stop offset="100%" stopColor="transparent" />
                                </linearGradient>
                            </defs>
                         </svg>
                    </div>
                </div>

                {/* Right Panel */}
                <div className="space-y-6">
                    <div className="bg-[#1E293B]/50 backdrop-blur-md border border-white/5 rounded-2xl p-6">
                        <h3 className="font-semibold text-lg text-white mb-4">Quick Actions</h3>
                        <div className="space-y-3">
                            <button className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 transition-colors group">
                                <span className="text-sm text-slate-300 group-hover:text-white">Add New Doctor</span>
                                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                                    <span className="text-lg">+</span>
                                </div>
                            </button>
                             <button className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 transition-colors group">
                                <span className="text-sm text-slate-300 group-hover:text-white">Manage Roles</span>
                                <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400">
                                    <span className="text-lg">⚙</span>
                                </div>
                            </button>
                        </div>
                    </div>
                    
                     <div className="bg-[#1E293B]/50 backdrop-blur-md border border-white/5 rounded-2xl p-6">
                        <h3 className="font-semibold text-lg text-white mb-4">System Health</h3>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-xs text-slate-400 mb-1">
                                    <span>Server Load</span>
                                    <span>24%</span>
                                </div>
                                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full w-[24%] bg-green-500 rounded-full"></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs text-slate-400 mb-1">
                                    <span>Database</span>
                                    <span>45%</span>
                                </div>
                                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full w-[45%] bg-blue-500 rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Appointments */}
            <div className="bg-[#1E293B]/50 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <h3 className="font-semibold text-lg text-white">Recent Appointments</h3>
                    <Link 
                        href="/admin/appointments" 
                        className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    >
                        View All
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase font-medium">
                            <tr>
                                <th className="px-6 py-4">Patient</th>
                                <th className="px-6 py-4">Doctor</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {recentAppointments.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">No appointments found</td>
                                </tr>
                            ) : (
                                recentAppointments.map(apt => (
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
                                            <div className="text-xs text-slate-400">{apt.startTime}</div>
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
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, gradient, trend }: any) {
    return (
        <div className="bg-[#1E293B]/50 backdrop-blur-md border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${gradient} opacity-10 rounded-bl-full group-hover:opacity-20 transition-opacity`}></div>
            
            <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg`}>
                    <Icon name={icon} className="w-6 h-6" />
                </div>
                <span className="text-xs font-medium text-green-400 bg-green-400/10 px-2 py-1 rounded-full">{trend}</span>
            </div>
            
            <h3 className="text-slate-400 text-sm font-medium mb-1">{title}</h3>
            <p className="text-3xl font-bold text-white">{value}</p>
        </div>
    );
}

function Icon({ name, className }: { name: string; className?: string }) {
     const icons: Record<string, JSX.Element> = {
        users: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />,
        doctor: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />,
        calendar: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
        clock: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    };
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">{icons[name]}</svg>;
}
