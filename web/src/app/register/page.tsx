'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi, RegisterData } from '@/lib/api';
import Cookies from 'js-cookie';

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        phone: '',
        role: 'client' as 'client' | 'doctor',
        specialization: '',
        licenseNumber: '',
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setIsLoading(true);

        try {
            const registerData: RegisterData = {
                email: formData.email,
                password: formData.password,
                firstName: formData.firstName,
                lastName: formData.lastName,
                phone: formData.phone,
                role: formData.role,
            };

            if (formData.role === 'doctor') {
                registerData.doctorInfo = {
                    specialization: formData.specialization,
                    licenseNumber: formData.licenseNumber,
                };
            }

            const response = await authApi.register(registerData);
            Cookies.set('token', response.data.token, { expires: 7 });

            router.push(formData.role === 'doctor' ? '/dashboard/doctor' : '/dashboard/client');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-primary-900 to-slate-900 flex items-center justify-center px-6 py-12">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center">
                            <span className="text-white font-bold text-2xl">M</span>
                        </div>
                        <span className="text-white font-bold text-2xl">MediBook</span>
                    </Link>
                </div>

                {/* Register Card */}
                <div className="card-dark">
                    <h1 className="text-2xl font-bold text-white text-center mb-2">Create Account</h1>
                    <p className="text-white/60 text-center mb-8">Join MediBook today</p>

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Role Selection */}
                        <div>
                            <label className="block text-white/80 text-sm font-medium mb-2">I am a</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role: 'client' })}
                                    className={`p-4 rounded-xl border transition-all ${formData.role === 'client'
                                            ? 'border-primary-500 bg-primary-500/20 text-primary-400'
                                            : 'border-slate-700 text-white/60 hover:border-slate-600'
                                        }`}
                                >
                                    <svg className="w-6 h-6 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    Patient
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role: 'doctor' })}
                                    className={`p-4 rounded-xl border transition-all ${formData.role === 'doctor'
                                            ? 'border-primary-500 bg-primary-500/20 text-primary-400'
                                            : 'border-slate-700 text-white/60 hover:border-slate-600'
                                        }`}
                                >
                                    <svg className="w-6 h-6 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                    Doctor
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="firstName" className="block text-white/80 text-sm font-medium mb-2">
                                    First Name
                                </label>
                                <input
                                    id="firstName"
                                    name="firstName"
                                    type="text"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    className="input-field-dark"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="lastName" className="block text-white/80 text-sm font-medium mb-2">
                                    Last Name
                                </label>
                                <input
                                    id="lastName"
                                    name="lastName"
                                    type="text"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    className="input-field-dark"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-white/80 text-sm font-medium mb-2">
                                Email Address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="input-field-dark"
                                placeholder="you@example.com"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="phone" className="block text-white/80 text-sm font-medium mb-2">
                                Phone (Optional)
                            </label>
                            <input
                                id="phone"
                                name="phone"
                                type="tel"
                                value={formData.phone}
                                onChange={handleChange}
                                className="input-field-dark"
                                placeholder="+1 234 567 8900"
                            />
                        </div>

                        {/* Doctor-specific fields */}
                        {formData.role === 'doctor' && (
                            <>
                                <div>
                                    <label htmlFor="specialization" className="block text-white/80 text-sm font-medium mb-2">
                                        Specialization
                                    </label>
                                    <input
                                        id="specialization"
                                        name="specialization"
                                        type="text"
                                        value={formData.specialization}
                                        onChange={handleChange}
                                        className="input-field-dark"
                                        placeholder="e.g., Cardiology"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="licenseNumber" className="block text-white/80 text-sm font-medium mb-2">
                                        License Number
                                    </label>
                                    <input
                                        id="licenseNumber"
                                        name="licenseNumber"
                                        type="text"
                                        value={formData.licenseNumber}
                                        onChange={handleChange}
                                        className="input-field-dark"
                                        placeholder="Medical license number"
                                        required
                                    />
                                </div>
                            </>
                        )}

                        <div>
                            <label htmlFor="password" className="block text-white/80 text-sm font-medium mb-2">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="input-field-dark"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-white/80 text-sm font-medium mb-2">
                                Confirm Password
                            </label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className="input-field-dark"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Creating account...
                                </span>
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-white/60">
                            Already have an account?{' '}
                            <Link href="/login" className="text-primary-400 hover:text-primary-300 font-medium">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
