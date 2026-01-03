'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';

export default function Home() {
    const { isAuthenticated, user } = useAuth();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-primary-900 to-slate-900">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 glass-dark">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center">
                            <span className="text-white font-bold text-xl">M</span>
                        </div>
                        <span className="text-white font-bold text-xl">MediBook</span>
                    </div>

                    <div className="flex items-center gap-4">
                        {isAuthenticated ? (
                            <Link
                                href={user?.role === 'doctor' ? '/dashboard/doctor' : '/dashboard/client'}
                                className="btn-primary"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link href="/login" className="text-white/80 hover:text-white transition-colors">
                                    Sign In
                                </Link>
                                <Link href="/register" className="btn-primary">
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-8">
                            <h1 className="text-5xl lg:text-7xl font-bold text-white leading-tight">
                                Book Your
                                <span className="gradient-text block">Doctor Visit</span>
                                with AI Voice
                            </h1>
                            <p className="text-xl text-white/70 max-w-lg">
                                Schedule appointments effortlessly using our AI-powered voice assistant.
                                Just speak, and we'll handle the rest.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <Link href="/register" className="btn-primary text-lg">
                                    Start Booking
                                </Link>
                                <Link href="/login" className="btn-secondary text-lg">
                                    Learn More
                                </Link>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-6 pt-8">
                                <div>
                                    <div className="text-3xl font-bold text-white">500+</div>
                                    <div className="text-white/60">Doctors</div>
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-white">10k+</div>
                                    <div className="text-white/60">Patients</div>
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-white">98%</div>
                                    <div className="text-white/60">Satisfaction</div>
                                </div>
                            </div>
                        </div>

                        {/* Hero Visual */}
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-accent-500/20 rounded-3xl blur-3xl"></div>
                            <div className="relative bg-slate-800/50 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
                                <div className="space-y-6">
                                    {/* Voice Assistant Demo */}
                                    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl">
                                        <div className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center animate-pulse">
                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-white font-medium">AI Voice Assistant</div>
                                            <div className="text-white/60 text-sm">"Book an appointment with Dr. Smith tomorrow at 3pm"</div>
                                        </div>
                                    </div>

                                    {/* Appointment Cards */}
                                    <div className="space-y-3">
                                        {[
                                            { name: 'Dr. Sarah Johnson', specialty: 'Cardiologist', time: '10:00 AM' },
                                            { name: 'Dr. Michael Chen', specialty: 'Dermatologist', time: '2:30 PM' },
                                            { name: 'Dr. Emily Davis', specialty: 'Neurologist', time: '4:00 PM' },
                                        ].map((doc, i) => (
                                            <div key={i} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-400 to-accent-400 flex items-center justify-center text-white font-semibold">
                                                    {doc.name.charAt(4)}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-white font-medium text-sm">{doc.name}</div>
                                                    <div className="text-white/50 text-xs">{doc.specialty}</div>
                                                </div>
                                                <div className="text-primary-400 text-sm">{doc.time}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-white mb-4">Why Choose MediBook?</h2>
                        <p className="text-white/60 max-w-2xl mx-auto">
                            Experience the future of healthcare scheduling with our intelligent platform
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: (
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                    </svg>
                                ),
                                title: 'Voice Booking',
                                description: 'Simply speak to book appointments. Our AI understands natural language.',
                            },
                            {
                                icon: (
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                ),
                                title: 'Smart Scheduling',
                                description: 'Automatic conflict detection and real-time availability updates.',
                            },
                            {
                                icon: (
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                ),
                                title: 'Secure & Private',
                                description: 'Your health data is protected with enterprise-grade security.',
                            },
                        ].map((feature, i) => (
                            <div key={i} className="card-dark text-center">
                                <div className="w-16 h-16 rounded-2xl bg-primary-500/20 flex items-center justify-center mx-auto mb-6 text-primary-400">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                                <p className="text-white/60">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 border-t border-white/10">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center">
                            <span className="text-white font-bold">M</span>
                        </div>
                        <span className="text-white font-semibold">MediBook</span>
                    </div>
                    <p className="text-white/50 text-sm">
                        © 2024 MediBook. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}
