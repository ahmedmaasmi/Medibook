'use client';

import { useEffect, useState } from 'react';
import { doctorsApi, Doctor } from '@/lib/api';

export default function DoctorsPage() {
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDoctors();
    }, []);

    const loadDoctors = async () => {
        try {
            const res = await doctorsApi.getAll();
            setDoctors(res.data.doctors);
        } catch (error) {
            console.error('Failed to load doctors:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white">Doctor Management</h1>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                    Add Doctor
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="text-slate-500">Loading doctors...</div>
                ) : doctors.length === 0 ? (
                    <div className="text-slate-500">No doctors found</div>
                ) : (
                    doctors.map(doctor => (
                        <div key={doctor.id} className="bg-[#1E293B]/50 backdrop-blur-md border border-white/5 rounded-2xl p-6 hover:bg-white/5 transition-all group">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-lg font-bold">
                                    {doctor.user.firstName[0]}
                                </div>
                                <div className="px-2 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium">
                                    Active
                                </div>
                            </div>
                            
                            <h3 className="text-lg font-bold text-white mb-1">Dr. {doctor.user.firstName} {doctor.user.lastName}</h3>
                            <p className="text-sm text-indigo-400 mb-4">{doctor.specialization}</p>
                            
                            <div className="space-y-2 mb-6">
                                <div className="flex items-center text-sm text-slate-400">
                                    <span className="w-4 h-4 mr-2">📧</span>
                                    {doctor.user.email}
                                </div>
                                <div className="flex items-center text-sm text-slate-400">
                                    <span className="w-4 h-4 mr-2">💰</span>
                                    ${doctor.consultationFee}/hr
                                </div>
                                <div className="flex items-center text-sm text-slate-400">
                                    <span className="w-4 h-4 mr-2">🎓</span>
                                    {doctor.yearsOfExperience} Years Exp.
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button className="flex-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors">
                                    Edit Profile
                                </button>
                                <button className="flex-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors">
                                    Schedule
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
