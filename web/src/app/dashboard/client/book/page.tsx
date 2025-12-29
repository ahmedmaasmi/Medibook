'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { doctorsApi, appointmentsApi, Doctor, TimeSlot } from '@/lib/api';
import { format, addDays } from 'date-fns';

export default function BookAppointmentPage() {
    const searchParams = useSearchParams();
    const preselectedDoctorId = searchParams.get('doctor');

    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [selectedDoctor, setSelectedDoctor] = useState<string>(preselectedDoctorId || '');
    const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
    const [slots, setSlots] = useState<TimeSlot[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
    const [reason, setReason] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isBooking, setIsBooking] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const response = await doctorsApi.getAll();
                setDoctors(response.data.doctors);
            } catch (err) {
                console.error('Failed to fetch doctors:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDoctors();
    }, []);

    useEffect(() => {
        if (selectedDoctor && selectedDate) {
            fetchSlots();
        }
    }, [selectedDoctor, selectedDate]);

    const fetchSlots = async () => {
        try {
            const response = await appointmentsApi.getSlots(selectedDoctor, selectedDate);
            setSlots(response.data.slots);
            setSelectedSlot(null);
        } catch (err) {
            console.error('Failed to fetch slots:', err);
            setSlots([]);
        }
    };

    const handleBook = async () => {
        if (!selectedDoctor || !selectedSlot) return;

        setIsBooking(true);
        setError('');

        try {
            await appointmentsApi.book({
                doctorId: selectedDoctor,
                appointmentDate: selectedDate,
                startTime: selectedSlot.startTime,
                endTime: selectedSlot.endTime,
                reason,
            });
            setSuccess(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to book appointment');
        } finally {
            setIsBooking(false);
        }
    };

    if (success) {
        return (
            <div className="max-w-2xl mx-auto">
                <div className="card-dark text-center py-12">
                    <div className="w-20 h-20 rounded-full bg-accent-500/20 flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-4">Appointment Booked!</h2>
                    <p className="text-white/60 mb-6">
                        Your appointment has been confirmed for {format(new Date(selectedDate), 'MMMM d, yyyy')} at {selectedSlot?.startTime.slice(0, 5)}.
                    </p>
                    <a href="/dashboard/client/appointments" className="btn-primary inline-block">
                        View My Appointments
                    </a>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Book an Appointment</h1>
                <p className="text-white/60">Select a doctor, date, and available time slot</p>
            </div>

            {error && (
                <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400">
                    {error}
                </div>
            )}

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Left Column - Selection */}
                <div className="space-y-6">
                    {/* Doctor Selection */}
                    <div className="card-dark">
                        <h3 className="text-lg font-semibold text-white mb-4">Select Doctor</h3>
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                            {doctors.map((doc) => (
                                <button
                                    key={doc.id}
                                    onClick={() => setSelectedDoctor(doc.id)}
                                    className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${selectedDoctor === doc.id
                                            ? 'bg-primary-500/20 border border-primary-500/50'
                                            : 'bg-white/5 hover:bg-white/10 border border-transparent'
                                        }`}
                                >
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary-400 to-purple-400 flex items-center justify-center text-white font-semibold">
                                        {doc.user?.firstName?.charAt(0)}
                                    </div>
                                    <div className="flex-1 text-left">
                                        <div className="text-white font-medium">
                                            Dr. {doc.user?.firstName} {doc.user?.lastName}
                                        </div>
                                        <div className="text-white/50 text-sm">{doc.specialization}</div>
                                    </div>
                                    {selectedDoctor === doc.id && (
                                        <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Date Selection */}
                    <div className="card-dark">
                        <h3 className="text-lg font-semibold text-white mb-4">Select Date</h3>
                        <div className="grid grid-cols-4 gap-2">
                            {[0, 1, 2, 3, 4, 5, 6].map((offset) => {
                                const date = addDays(new Date(), offset);
                                const dateStr = format(date, 'yyyy-MM-dd');
                                return (
                                    <button
                                        key={offset}
                                        onClick={() => setSelectedDate(dateStr)}
                                        className={`p-3 rounded-xl text-center transition-all ${selectedDate === dateStr
                                                ? 'bg-primary-500 text-white'
                                                : 'bg-white/5 text-white/70 hover:bg-white/10'
                                            }`}
                                    >
                                        <div className="text-xs">{format(date, 'EEE')}</div>
                                        <div className="text-lg font-semibold">{format(date, 'd')}</div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Reason */}
                    <div className="card-dark">
                        <h3 className="text-lg font-semibold text-white mb-4">Reason (Optional)</h3>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="input-field-dark resize-none"
                            rows={3}
                            placeholder="Briefly describe the reason for your visit..."
                        />
                    </div>
                </div>

                {/* Right Column - Time Slots & Confirmation */}
                <div className="space-y-6">
                    {/* Time Slots */}
                    <div className="card-dark">
                        <h3 className="text-lg font-semibold text-white mb-4">Available Times</h3>
                        {!selectedDoctor ? (
                            <p className="text-white/50 text-center py-4">Please select a doctor first</p>
                        ) : slots.length === 0 ? (
                            <p className="text-white/50 text-center py-4">No available slots on this date</p>
                        ) : (
                            <div className="grid grid-cols-3 gap-2">
                                {slots.map((slot, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedSlot(slot)}
                                        className={`p-3 rounded-xl text-center transition-all ${selectedSlot?.startTime === slot.startTime
                                                ? 'bg-primary-500 text-white'
                                                : 'bg-white/5 text-white/70 hover:bg-white/10'
                                            }`}
                                    >
                                        {slot.startTime.slice(0, 5)}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Confirmation */}
                    {selectedDoctor && selectedSlot && (
                        <div className="card-dark border border-primary-500/30">
                            <h3 className="text-lg font-semibold text-white mb-4">Confirm Booking</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-white/60">Doctor</span>
                                    <span className="text-white">
                                        Dr. {doctors.find(d => d.id === selectedDoctor)?.user?.lastName}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-white/60">Date</span>
                                    <span className="text-white">{format(new Date(selectedDate), 'MMMM d, yyyy')}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-white/60">Time</span>
                                    <span className="text-white">
                                        {selectedSlot.startTime.slice(0, 5)} - {selectedSlot.endTime.slice(0, 5)}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={handleBook}
                                disabled={isBooking}
                                className="w-full btn-primary mt-6 disabled:opacity-50"
                            >
                                {isBooking ? 'Booking...' : 'Confirm Booking'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
