'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, isLoading, isAuthenticated, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Only redirect after loading is complete
        if (!isLoading) {
            if (!isAuthenticated) {
                router.push('/login');
            } else if (user?.role !== 'admin') {
                // Redirect non-admins to their appropriate dashboard
                if (user?.role === 'doctor') {
                    router.push('/dashboard/doctor');
                } else if (user?.role === 'client') {
                    router.push('/dashboard/client');
                } else {
                    router.push('/login');
                }
            }
        }
    }, [isLoading, isAuthenticated, user, router]);

    if (isLoading || !user || user.role !== 'admin') {
        return (
             <div className="min-h-screen bg-[#13111C] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0F172A] flex text-white font-sans selection:bg-blue-500/30">
            {/* Sidebar */}
            <aside className="w-64 bg-[#1E293B] flex flex-col border-r border-white/5 relative z-20">
                {/* Logo */}
                <div className="h-16 flex items-center px-6 border-b border-white/5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mr-3 shadow-lg shadow-blue-500/20">
                         <span className="font-bold text-white text-lg">A</span>
                    </div>
                    <span className="font-bold text-lg tracking-tight">AdminPanel</span>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1">
                    <NavItem href="/admin" icon="dashboard" label="Dashboard" active={pathname === '/admin'} />
                    <NavItem href="/admin/users" icon="users" label="Users" active={pathname?.startsWith('/admin/users')} />
                    <NavItem href="/admin/doctors" icon="doctor" label="Doctors" active={pathname?.startsWith('/admin/doctors')} />
                    <NavItem href="/admin/appointments" icon="calendar" label="Appointments" active={pathname?.startsWith('/admin/appointments')} />
                </nav>

                {/* Bottom Card */}
                <div className="p-4">
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-4 relative overflow-hidden">
                        <div className="relative z-10">
                            <h4 className="font-semibold text-sm mb-1">System Status</h4>
                            <p className="text-xs text-blue-100 mb-3">All systems operational</p>
                        </div>
                         <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                    </div>
                </div>

                 {/* User Profile */}
                <div className="p-4 border-t border-white/5">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-sm font-medium">
                            {user.firstName[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user.firstName} {user.lastName}</p>
                            <p className="text-xs text-slate-400 truncate">{user.email}</p>
                        </div>
                        <button onClick={() => logout()} className="text-slate-400 hover:text-white">
                            <Icon name="logout" className="w-5 h-5" />
                        </button>
                     </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 bg-[#0F172A] relative overflow-hidden">
                 {/* Top Navbar */}
                <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#1E293B]/50 backdrop-blur-xl sticky top-0 z-10">
                    <div className="w-96">
                         <div className="relative">
                            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Search..." 
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-slate-200 placeholder-slate-500"
                            />
                         </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="w-8 h-8 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                            <Icon name="bell" className="w-4 h-4" />
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-6 relative z-0">
                      {/* Background decorations */}
                     <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-900/10 to-transparent pointer-events-none -z-10"></div>
                    {children}
                </div>
            </main>
        </div>
    );
}

function NavItem({ href, icon, label, active }: { href: string; icon: string; label: string; active?: boolean }) {
    return (
        <Link 
            href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${
                active 
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
        >
            <Icon name={icon} className={`w-5 h-5 ${active ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
            {label}
        </Link>
    );
}

function Icon({ name, className }: { name: string; className?: string }) {
     const icons: Record<string, JSX.Element> = {
        dashboard: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />,
        users: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />,
        doctor: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />,
        calendar: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
        logout: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />,
        search: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />,
        bell: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    };

    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {icons[name]}
        </svg>
    );
}
