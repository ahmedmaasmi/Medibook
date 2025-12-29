'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, isLoading, isAuthenticated, logout } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 bottom-0 w-64 bg-slate-800/50 backdrop-blur-xl border-r border-white/10 p-6 flex flex-col">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 mb-10">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary-500 to-purple-500 flex items-center justify-center">
                        <span className="text-white font-bold text-xl">M</span>
                    </div>
                    <span className="text-white font-bold text-xl">MediBook</span>
                </Link>

                {/* Navigation */}
                <nav className="flex-1 space-y-2">
                    {user?.role === 'client' ? (
                        <>
                            <NavLink href="/dashboard/client" icon="home">Dashboard</NavLink>
                            <NavLink href="/dashboard/client/book" icon="calendar">Book Appointment</NavLink>
                            <NavLink href="/dashboard/client/voice" icon="mic">Voice Booking</NavLink>
                            <NavLink href="/dashboard/client/appointments" icon="list">My Appointments</NavLink>
                        </>
                    ) : (
                        <>
                            <NavLink href="/dashboard/doctor" icon="home">Dashboard</NavLink>
                            <NavLink href="/dashboard/doctor/appointments" icon="list">Appointments</NavLink>
                            <NavLink href="/dashboard/doctor/availability" icon="clock">Availability</NavLink>
                            <NavLink href="/dashboard/doctor/calendar" icon="calendar">Calendar Sync</NavLink>
                        </>
                    )}
                </nav>

                {/* User Info */}
                <div className="pt-6 border-t border-white/10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-400 to-purple-400 flex items-center justify-center">
                            <span className="text-white font-semibold">
                                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                            </span>
                        </div>
                        <div>
                            <div className="text-white font-medium text-sm">
                                {user?.firstName} {user?.lastName}
                            </div>
                            <div className="text-white/50 text-xs capitalize">{user?.role}</div>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            logout();
                            router.push('/');
                        }}
                        className="w-full text-left text-white/60 hover:text-white text-sm flex items-center gap-2 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="ml-64 p-8">
                {children}
            </main>
        </div>
    );
}

function NavLink({ href, icon, children }: { href: string; icon: string; children: React.ReactNode }) {
    const icons: Record<string, JSX.Element> = {
        home: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
        ),
        calendar: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        ),
        mic: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
        ),
        list: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
        ),
        clock: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
    };

    return (
        <Link
            href={href}
            className="flex items-center gap-3 px-4 py-3 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all"
        >
            {icons[icon]}
            {children}
        </Link>
    );
}
