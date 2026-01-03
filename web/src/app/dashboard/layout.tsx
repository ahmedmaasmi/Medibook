'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useChat } from '@/lib/chat';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, isLoading, isAuthenticated, logout } = useAuth();
    const { chats, activeChatId, setActiveChat, createNewChat, deleteChat } = useChat();
    const router = useRouter();
    const pathname = usePathname();
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#13111C] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-[#13111C] flex text-white font-sans selection:bg-primary-500/30">
            {/* Sidebar */}
            <aside className="w-[280px] bg-[#1C1A26] flex flex-col p-4 border-r border-white/5 relative z-20">
                {/* Logo */}
                <div className="flex items-center gap-3 px-2 mb-8">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/20">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <span className="font-semibold text-xl tracking-tight">blop</span>
                    <button className="ml-auto text-white/40 hover:text-white transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                        </svg>
                    </button>
                </div>

                {/* New Chat Button */}
                <button 
                    onClick={() => {
                        createNewChat();
                        if (user?.role === 'client') router.push('/dashboard/client');
                        else router.push('/dashboard/doctor');
                    }}
                    className="flex items-center gap-3 w-full bg-[#2A2735] hover:bg-[#322F40] transition-all text-white/90 px-4 py-3 rounded-xl mb-8 group border border-white/5"
                >
                    <div className="w-5 h-5 rounded-full border border-white/30 flex items-center justify-center group-hover:border-white/60">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </div>
                    <span className="font-medium text-sm">New Chat</span>
                </button>

                {/* Features Section */}
                <div className="mb-8">
                    <h3 className="text-xs font-medium text-white/40 mb-3 px-2 uppercase tracking-wider">Features</h3>
                    <nav className="space-y-1">
                        {user?.role === 'client' ? (
                            <>
                                <NavLink href="/dashboard/client" icon="chat" active={pathname === '/dashboard/client'}>Chat</NavLink>
                                <NavLink href="/dashboard/client/appointments" icon="archived" active={pathname?.includes('appointments')}>Appointments</NavLink>
                                <NavLink href="/dashboard/client/book" icon="library" active={pathname?.includes('book')}>Book Now</NavLink>
                            </>
                        ) : (
                            <>
                                <NavLink href="/dashboard/doctor" icon="home" active={pathname === '/dashboard/doctor'}>Dashboard</NavLink>
                                <NavLink href="/dashboard/doctor/appointments" icon="list" active={pathname?.includes('appointments')}>Appointments</NavLink>
                                <NavLink href="/dashboard/doctor/availability" icon="clock" active={pathname?.includes('availability')}>Availability</NavLink>
                            </>
                        )}
                    </nav>
                </div>

                {/* Recent Chats Section */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <h3 className="text-xs font-medium text-white/40 mb-3 px-2 uppercase tracking-wider">Recent Chats</h3>
                    <nav className="space-y-1">
                        {chats.length > 0 ? (
                            chats.map(chat => (
                                <div key={chat.id} className="group relative">
                                    <button 
                                        onClick={() => {
                                            setActiveChat(chat.id);
                                            if (user?.role === 'client') router.push('/dashboard/client');
                                            else router.push('/dashboard/doctor');
                                        }}
                                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm font-medium ${
                                            activeChatId === chat.id 
                                            ? 'bg-primary-500/10 text-white' 
                                            : 'text-white/60 hover:text-white hover:bg-white/5'
                                        }`}
                                    >
                                        <Icon name="chat" className={`w-4 h-4 ${activeChatId === chat.id ? 'text-primary-400' : 'text-white/40 group-hover:text-white/60'}`} />
                                        <span className="truncate flex-1 text-left">{chat.title}</span>
                                    </button>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteChat(chat.id);
                                        }}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-white/0 group-hover:text-white/40 hover:text-red-400 transition-all"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="px-3 py-2 text-xs text-white/20 italic">No recent chats</div>
                        )}
                    </nav>
                </div>

                 {/* User Profile (Mini) */}
                 <div className="mt-4 relative">
                    {showProfileMenu && (
                        <div className="absolute bottom-full left-0 w-full mb-2 bg-[#23202E] border border-white/5 rounded-xl shadow-2xl py-2 z-30 animate-in fade-in slide-in-from-bottom-2">
                            <button 
                                onClick={() => {
                                    alert('Profile settings coming soon!');
                                    setShowProfileMenu(false);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Profile Settings
                            </button>
                            <button 
                                onClick={() => logout()}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                Sign Out
                            </button>
                        </div>
                    )}
                    <div 
                        className="flex items-center gap-3 px-2 pt-4 border-t border-white/5 cursor-pointer hover:bg-white/5 p-2 rounded-xl transition-colors" 
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                    >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-primary-400 flex items-center justify-center text-xs font-bold text-white">
                            {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white truncate">{user?.firstName} {user?.lastName}</div>
                            <div className="text-xs text-white/40 truncate capitalize">{user?.role}</div>
                        </div>
                    </div>
                 </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col relative overflow-hidden">
                {/* Top Background Gradient */}
                <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary-900/10 to-transparent pointer-events-none"></div>
                
                {children}
            </main>
        </div>
    );
}

function NavLink({ href, icon, children, active }: { href: string; icon: string; children: React.ReactNode; active?: boolean }) {
    return (
        <Link
            href={href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm font-medium group ${
                active 
                ? 'bg-primary-500/10 text-white' 
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
        >
            <Icon name={icon} className={`w-4 h-4 ${active ? 'text-primary-400' : 'text-white/40 group-hover:text-white/60'}`} />
            {children}
        </Link>
    );
}

function NavItem({ icon, label }: { icon: string; label: string }) {
    return (
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 group">
            <Icon name={icon} className="w-4 h-4 text-white/40 group-hover:text-white/60" />
            <span>{label}</span>
        </button>
    );
}

function Icon({ name, className }: { name: string; className?: string }) {
    const icons: Record<string, JSX.Element> = {
        chat: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />,
        archived: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />,
        library: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />,
        home: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
        list: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />,
        clock: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
        folder: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />,
        image: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />,
        presentation: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />,
        chart: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    };

    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {icons[name] || icons['home']}
        </svg>
    );
}
