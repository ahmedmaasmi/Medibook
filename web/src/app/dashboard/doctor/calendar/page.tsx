'use client';

import { useEffect, useState } from 'react';
import { calendarApi } from '@/lib/api';

export default function DoctorCalendarPage() {
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isConnecting, setIsConnecting] = useState(false);

    useEffect(() => {
        checkStatus();
    }, []);

    const checkStatus = async () => {
        try {
            const response = await calendarApi.getStatus();
            setIsConnected(response.data.connected);
        } catch (error) {
            console.error('Failed to check calendar status:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConnect = async () => {
        setIsConnecting(true);
        try {
            const response = await calendarApi.getAuthUrl();
            window.location.href = response.data.authUrl;
        } catch (error) {
            console.error('Failed to get auth URL:', error);
            setIsConnecting(false);
        }
    };

    const handleDisconnect = async () => {
        if (!confirm('Are you sure you want to disconnect Google Calendar?')) return;

        try {
            await calendarApi.disconnect();
            setIsConnected(false);
        } catch (error) {
            console.error('Failed to disconnect:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Google Calendar Sync</h1>
                <p className="text-white/60">Sync your appointments with Google Calendar</p>
            </div>

            {/* Connection Status */}
            <div className="card-dark">
                <div className="flex items-center gap-6">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${isConnected ? 'bg-accent-500/20' : 'bg-white/10'
                        }`}>
                        <svg className={`w-8 h-8 ${isConnected ? 'text-accent-400' : 'text-white/50'}`} viewBox="0 0 24 24">
                            <path fill="currentColor" d="M19.5 22h-15A2.5 2.5 0 0 1 2 19.5v-15A2.5 2.5 0 0 1 4.5 2h15A2.5 2.5 0 0 1 22 4.5v15a2.5 2.5 0 0 1-2.5 2.5zM9 18.75l8.25-8.25-1.5-1.5L9 15.75l-3.75-3.75-1.5 1.5L9 18.75z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h3 className={`text-lg font-semibold ${isConnected ? 'text-accent-400' : 'text-white'}`}>
                            {isConnected ? 'Connected' : 'Not Connected'}
                        </h3>
                        <p className="text-white/50 text-sm">
                            {isConnected
                                ? 'Your appointments are syncing with Google Calendar'
                                : 'Connect to sync appointments automatically'}
                        </p>
                    </div>
                    {isConnected ? (
                        <button
                            onClick={handleDisconnect}
                            className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
                        >
                            Disconnect
                        </button>
                    ) : (
                        <button
                            onClick={handleConnect}
                            disabled={isConnecting}
                            className="btn-primary disabled:opacity-50"
                        >
                            {isConnecting ? 'Connecting...' : 'Connect'}
                        </button>
                    )}
                </div>
            </div>

            {/* Benefits */}
            <div className="card-dark">
                <h3 className="text-lg font-semibold text-white mb-4">What you get</h3>
                <div className="space-y-4">
                    {[
                        {
                            icon: '🔄',
                            title: 'Two-way Sync',
                            description: 'Appointments appear in your Google Calendar automatically',
                        },
                        {
                            icon: '🔔',
                            title: 'Reminders',
                            description: 'Get notified before appointments via Google Calendar',
                        },
                        {
                            icon: '📧',
                            title: 'Email Invites',
                            description: 'Patients receive calendar invites for their appointments',
                        },
                        {
                            icon: '🚫',
                            title: 'Conflict Prevention',
                            description: 'Avoid double bookings with calendar integration',
                        },
                    ].map((benefit, i) => (
                        <div key={i} className="flex items-start gap-4 p-3 bg-white/5 rounded-xl">
                            <span className="text-2xl">{benefit.icon}</span>
                            <div>
                                <h4 className="text-white font-medium">{benefit.title}</h4>
                                <p className="text-white/50 text-sm">{benefit.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Info */}
            <div className="p-4 bg-blue-500/20 border border-blue-500/30 rounded-xl">
                <div className="flex gap-3">
                    <svg className="w-6 h-6 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm text-white/70">
                        <p className="font-medium text-white mb-1">Privacy Note</p>
                        <p>We only access your calendar to create and manage appointment events. We never read or modify your other calendar data.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
