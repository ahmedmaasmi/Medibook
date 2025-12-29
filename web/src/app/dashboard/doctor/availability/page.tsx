'use client';

import { useEffect, useState } from 'react';
import { doctorsApi, Availability, AvailabilityInput } from '@/lib/api';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function DoctorAvailabilityPage() {
    const [availabilities, setAvailabilities] = useState<Availability[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [editingDay, setEditingDay] = useState<number | null>(null);
    const [formData, setFormData] = useState<AvailabilityInput>({
        dayOfWeek: 0,
        startTime: '09:00',
        endTime: '17:00',
        slotDuration: 30,
    });

    useEffect(() => {
        fetchAvailability();
    }, []);

    const fetchAvailability = async () => {
        try {
            // This would need the doctor ID - for now we'll get current doctor's availability
            // In a real app, you'd get this from auth context
            const response = await doctorsApi.getAvailability('current');
            setAvailabilities(response.data.availabilities);
        } catch (error) {
            console.error('Failed to fetch availability:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await doctorsApi.setAvailability(formData);
            await fetchAvailability();
            setEditingDay(null);
        } catch (error) {
            console.error('Failed to save availability:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const getAvailabilityForDay = (dayOfWeek: number) => {
        return availabilities.find(a => a.dayOfWeek === dayOfWeek);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Manage Availability</h1>
                <p className="text-white/60">Set your working hours for each day of the week</p>
            </div>

            {/* Weekly Schedule */}
            <div className="card-dark">
                <div className="space-y-4">
                    {DAYS.map((day, index) => {
                        const availability = getAvailabilityForDay(index);
                        const isEditing = editingDay === index;

                        return (
                            <div key={day} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="w-28 font-medium text-white">{day}</div>

                                    {isEditing ? (
                                        <div className="flex items-center gap-4 flex-1">
                                            <input
                                                type="time"
                                                value={formData.startTime}
                                                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                                className="input-field-dark w-32"
                                            />
                                            <span className="text-white/50">to</span>
                                            <input
                                                type="time"
                                                value={formData.endTime}
                                                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                                className="input-field-dark w-32"
                                            />
                                            <select
                                                value={formData.slotDuration}
                                                onChange={(e) => setFormData({ ...formData, slotDuration: Number(e.target.value) })}
                                                className="input-field-dark w-24"
                                            >
                                                <option value={15}>15 min</option>
                                                <option value={30}>30 min</option>
                                                <option value={45}>45 min</option>
                                                <option value={60}>60 min</option>
                                            </select>
                                        </div>
                                    ) : availability ? (
                                        <div className="text-white/70">
                                            {availability.startTime.slice(0, 5)} - {availability.endTime.slice(0, 5)}
                                            <span className="text-white/40 ml-2">({availability.slotDuration} min slots)</span>
                                        </div>
                                    ) : (
                                        <div className="text-white/40">Not available</div>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    {isEditing ? (
                                        <>
                                            <button
                                                onClick={handleSave}
                                                disabled={isSaving}
                                                className="px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 disabled:opacity-50"
                                            >
                                                {isSaving ? 'Saving...' : 'Save'}
                                            </button>
                                            <button
                                                onClick={() => setEditingDay(null)}
                                                className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20"
                                            >
                                                Cancel
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                setEditingDay(index);
                                                setFormData({
                                                    dayOfWeek: index,
                                                    startTime: availability?.startTime.slice(0, 5) || '09:00',
                                                    endTime: availability?.endTime.slice(0, 5) || '17:00',
                                                    slotDuration: availability?.slotDuration || 30,
                                                });
                                            }}
                                            className="px-4 py-2 bg-primary-500/20 text-primary-400 rounded-lg hover:bg-primary-500/30"
                                        >
                                            {availability ? 'Edit' : 'Set Hours'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Info */}
            <div className="p-4 bg-primary-500/20 border border-primary-500/30 rounded-xl">
                <div className="flex gap-3">
                    <svg className="w-6 h-6 text-primary-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm text-white/70">
                        <p className="font-medium text-white mb-1">How availability works</p>
                        <p>Patients can only book appointments during your available hours. The slot duration determines how long each appointment will be.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
