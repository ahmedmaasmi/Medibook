'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { doctorsApi, appointmentsApi, Doctor, TimeSlot } from '@/lib/api';
import { format, addDays, startOfWeek, addWeeks, subWeeks, isSameDay } from 'date-fns';
import { useRouter } from 'next/navigation';

export default function BookAppointmentPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const preselectedDoctorId = searchParams.get('doctor');

    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    
    const [selectedDoctor, setSelectedDoctor] = useState<string>(preselectedDoctorId || '');
    const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
    const [weekStart, setWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
    const [slots, setSlots] = useState<TimeSlot[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
    const [reason, setReason] = useState('');
    
    // Split loading states
    const [isLoadingDoctors, setIsLoadingDoctors] = useState(true);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    const [isBooking, setIsBooking] = useState(false);
    
    // Split error states
    const [doctorsError, setDoctorsError] = useState('');
    const [slotsError, setSlotsError] = useState('');
    const [bookingError, setBookingError] = useState('');
    const [success, setSuccess] = useState(false);

    const abortControllerRef = useRef<AbortController | null>(null);

    // Derived values
    const selectedDateObj = useMemo(() => new Date(selectedDate), [selectedDate]);
    const monthYearLabel = format(selectedDateObj, 'MMMM, yyyy');

    const weekDays = useMemo(() => {
        return Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
    }, [weekStart]);

    // Fetch doctors and extract categories
    useEffect(() => {
        const fetchDoctors = async () => {
            setIsLoadingDoctors(true);
            setDoctorsError('');
            try {
                const response = await doctorsApi.getAll();
                const docs = response.data.doctors;
                setDoctors(docs);
                setFilteredDoctors(docs);

                // Extract unique specializations
                const uniqueCategories = Array.from(new Set(docs.map(d => d.specialization)));
                setCategories(['All', ...uniqueCategories]);
            } catch (err) {
                console.error('Failed to fetch doctors:', err);
                setDoctorsError('Failed to load doctors. Please try again.');
            } finally {
                setIsLoadingDoctors(false);
            }
        };
        fetchDoctors();
    }, []);

    // Filter doctors when category changes
    useEffect(() => {
        if (selectedCategory === 'All') {
            setFilteredDoctors(doctors);
        } else {
            setFilteredDoctors(doctors.filter(d => d.specialization === selectedCategory));
        }
        // Deselect doctor if they are not in the new category
        if (selectedDoctor) {
            const currentDoc = doctors.find(d => d.id === selectedDoctor);
            if (currentDoc && selectedCategory !== 'All' && currentDoc.specialization !== selectedCategory) {
                setSelectedDoctor('');
                setSlots([]);
                setSelectedSlot(null);
            }
        }
    }, [selectedCategory, doctors, selectedDoctor]);

    // Fetch slots when doctor or date changes
    useEffect(() => {
        if (selectedDoctor && selectedDate) {
            fetchSlots();
        } else {
            setSlots([]);
            setSlotsError('');
        }
        
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [selectedDoctor, selectedDate]);

    const fetchSlots = async () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        setIsLoadingSlots(true);
        setSlotsError('');
        try {
            const response = await appointmentsApi.getSlots(selectedDoctor, selectedDate, abortControllerRef.current.signal);
            setSlots(response.data.slots);
            setSelectedSlot(null);
        } catch (err: any) {
            if (err.name === 'AbortError') return;
            console.error('Failed to fetch slots:', err);
            setSlots([]);
            setSlotsError('Failed to load available slots.');
        } finally {
            setIsLoadingSlots(false);
        }
    };

    const handleBook = async () => {
        if (!selectedDoctor || !selectedSlot) return;

        setIsBooking(true);
        setBookingError('');

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
            setBookingError(err instanceof Error ? err.message : 'Failed to book appointment');
        } finally {
            setIsBooking(false);
        }
    };

    const getDoctorDetails = () => {
        return doctors.find(d => d.id === selectedDoctor);
    };

    const activeDoctor = getDoctorDetails();

    const handleNextWeek = () => setWeekStart(prev => addWeeks(prev, 1));
    const handlePrevWeek = () => setWeekStart(prev => subWeeks(prev, 1));

    if (success) {
        return (
            <div className="max-w-2xl mx-auto py-12 px-4">
                <div className="bg-[#1C1A26] border border-white/5 rounded-2xl p-8 text-center">
                    <div className="w-20 h-20 rounded-full bg-accent-500/20 flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-4">Appointment Booked!</h2>
                    <p className="text-white/60 mb-8">
                        Your appointment has been confirmed for {format(new Date(selectedDate), 'MMMM d, yyyy')} at {selectedSlot?.startTime.slice(0, 5)}.
                    </p>
                    <div className="flex gap-4 justify-center">
                        <Link href="/dashboard/client/appointments" className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl transition-colors font-medium">
                            View My Appointments
                        </Link>
                        <button onClick={() => {
                            setSuccess(false);
                            setSelectedDoctor('');
                            setSelectedSlot(null);
                        }} className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors font-medium">
                            Book Another
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full max-w-[1600px] mx-auto p-6">
            <h1 className="text-3xl font-bold text-white mb-8">Make appointment</h1>

            <div className="flex flex-col lg:flex-row gap-8 h-full">
                {/* Main Content Area */}
                <div className="flex-1 min-w-0 space-y-8">
                    
                    {/* Step 1: Categories */}
                    <div className="space-y-4">
                        <h3 className="text-white/60 font-medium">1. Choose category</h3>
                        <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar no-scrollbar">
                            {isLoadingDoctors ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="w-32 h-12 rounded-2xl bg-white/5 animate-pulse shrink-0" />
                                ))
                            ) : (
                                categories.map((cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        aria-selected={selectedCategory === cat}
                                        className={`px-6 py-3 rounded-2xl whitespace-nowrap transition-all font-medium flex items-center gap-2 ${
                                            selectedCategory === cat
                                                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                                                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                                        }`}
                                    >
                                        {cat}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Step 2: Doctors List */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-white/60 font-medium">2. Choose doctor</h3>
                        </div>
                        {doctorsError ? (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                                {doctorsError}
                            </div>
                        ) : (
                            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x">
                                {isLoadingDoctors ? (
                                    Array.from({ length: 4 }).map((_, i) => (
                                        <div key={i} className="snap-start min-w-[280px] h-24 rounded-2xl bg-white/5 animate-pulse border border-white/5" />
                                    ))
                                ) : filteredDoctors.length === 0 ? (
                                    <div className="text-white/40 italic py-4">No doctors found in this category.</div>
                                ) : (
                                    filteredDoctors.map((doc) => (
                                        <button
                                            key={doc.id}
                                            onClick={() => setSelectedDoctor(doc.id)}
                                            aria-selected={selectedDoctor === doc.id}
                                            className={`snap-start min-w-[280px] p-4 rounded-2xl border transition-all text-left flex items-center gap-4 ${
                                                selectedDoctor === doc.id
                                                    ? 'bg-[#1C1A26] border-primary-500 ring-1 ring-primary-500 shadow-xl shadow-primary-500/10'
                                                    : 'bg-[#1C1A26] border-white/5 hover:border-white/10 hover:bg-[#23202E]'
                                            }`}
                                        >
                                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center text-white text-xl font-bold shadow-inner shrink-0">
                                                {doc.user?.firstName?.charAt(0)}{doc.user?.lastName?.charAt(0)}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-white font-bold text-lg truncate">Dr. {doc.user?.firstName}</div>
                                                <div className="text-primary-400 text-sm font-medium mb-1 truncate">{doc.specialization}</div>
                                                <div className="flex items-center gap-1">
                                                    <svg className="w-4 h-4 text-yellow-500 fill-current" viewBox="0 0 20 20">
                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                    </svg>
                                                    <span className="text-white/60 text-xs">5.0</span>
                                                </div>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    {/* Step 3: Date and Time Selection */}
                    <div className={`space-y-4 transition-opacity duration-300 ${!selectedDoctor ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                        <div className="flex justify-between items-center mb-2">
                             <h3 className="text-white/60 font-medium">3. Choose date and time</h3>
                             <div className="flex items-center gap-2 bg-[#1C1A26] rounded-lg px-3 py-1 border border-white/5">
                                <span className="text-white text-sm font-medium">{monthYearLabel}</span>
                                <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                             </div>
                        </div>

                        {/* Calendar Strip */}
                        <div className="bg-[#1C1A26] rounded-2xl p-6 border border-white/5 relative overflow-hidden">
                             <div className="flex justify-between items-center mb-8">
                                 <button 
                                    onClick={handlePrevWeek}
                                    className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-full transition-all"
                                    aria-label="Previous week"
                                 >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                 </button>
                                 <div className="flex-1 flex justify-around">
                                     {weekDays.map((date, i) => {
                                        const dateStr = format(date, 'yyyy-MM-dd');
                                        const isSelected = selectedDate === dateStr;
                                        const isToday = isSameDay(date, new Date());
                                        
                                        return (
                                            <button
                                                key={i}
                                                onClick={() => setSelectedDate(dateStr)}
                                                aria-selected={isSelected}
                                                className={`flex flex-col items-center gap-2 px-4 py-3 rounded-xl transition-all ${
                                                    isSelected 
                                                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' 
                                                        : isToday
                                                            ? 'text-primary-400 border border-primary-500/30'
                                                            : 'text-white/40 hover:text-white hover:bg-white/5'
                                                }`}
                                            >
                                                <span className="text-[10px] font-bold uppercase tracking-wider">{format(date, 'EEE')}</span>
                                                <span className="text-lg font-bold">{format(date, 'd')}</span>
                                            </button>
                                        );
                                     })}
                                 </div>
                                 <button 
                                    onClick={handleNextWeek}
                                    className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-full transition-all"
                                    aria-label="Next week"
                                 >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                 </button>
                             </div>

                             {/* Time Slots */}
                             <div className="relative min-h-[120px]" aria-busy={isLoadingSlots}>
                                {slotsError ? (
                                    <div className="text-center py-8 text-red-400 text-sm">{slotsError}</div>
                                ) : isLoadingSlots ? (
                                    <div className="grid grid-cols-4 gap-4 animate-pulse">
                                        {Array.from({ length: 8 }).map((_, i) => (
                                            <div key={i} className="h-12 rounded-xl bg-white/5 border border-white/5" />
                                        ))}
                                    </div>
                                ) : slots.length === 0 ? (
                                    <div className="text-center py-8 text-white/40">
                                        {selectedDoctor ? 'No slots available for this date' : 'Select a doctor to see availability'}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-4 gap-4">
                                        {slots.map((slot, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setSelectedSlot(slot)}
                                                disabled={!slot.available}
                                                aria-selected={selectedSlot?.startTime === slot.startTime}
                                                className={`py-3 rounded-xl text-sm font-medium transition-all ${
                                                    selectedSlot?.startTime === slot.startTime
                                                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/50'
                                                        : slot.available
                                                            ? 'bg-white/5 text-white/70 border border-transparent hover:bg-white/10'
                                                            : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5 border-dashed'
                                                }`}
                                            >
                                                {slot.startTime.slice(0, 5)}
                                            </button>
                                        ))}
                                    </div>
                                )}
                             </div>
                        </div>
                    </div>
                </div>

                {/* Side Panel - Step 4: Summary & Booking */}
                <div className="w-full lg:w-[400px] shrink-0">
                    <div className="bg-[#1C1A26] border border-white/5 rounded-[32px] p-6 h-full text-white flex flex-col relative overflow-hidden">
                        {activeDoctor ? (
                            <>
                                <div className="flex flex-col items-center mb-8 pt-4">
                                    <div className="w-24 h-24 rounded-2xl bg-white/5 mb-4 overflow-hidden relative border border-white/10 shadow-xl">
                                         <div className="w-full h-full bg-gradient-to-br from-primary-400/20 to-primary-600/20 flex items-center justify-center text-white text-3xl font-bold">
                                            {activeDoctor.user?.firstName?.charAt(0)}
                                         </div>
                                         <div className="absolute top-2 right-2 w-3 h-3 bg-green-500 rounded-full border-2 border-[#1C1A26]"></div>
                                    </div>
                                    <h2 className="text-xl font-bold text-white mb-1">Dr. {activeDoctor.user?.firstName} {activeDoctor.user?.lastName}</h2>
                                    <p className="text-white/60 text-sm font-medium">{activeDoctor.specialization}</p>
                                </div>

                                <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-3">
                                        <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest">Appointment Summary</h3>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <div className="text-sm font-medium">{format(selectedDateObj, 'EEEE, MMMM d')}</div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <div className="text-sm font-medium">
                                                {selectedSlot ? `${selectedSlot.startTime.slice(0, 5)} - ${selectedSlot.endTime.slice(0, 5)}` : 'Select a time slot'}
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-white font-bold mb-3">Reason for visit (optional)</h3>
                                        <textarea 
                                            value={reason}
                                            onChange={(e) => setReason(e.target.value)}
                                            placeholder="E.g. Checkup, consultation..."
                                            className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-primary-500 transition-colors resize-none h-24"
                                        />
                                    </div>

                                    <div>
                                        <h3 className="text-white font-bold mb-3">Biography</h3>
                                        <p className="text-white/60 text-xs leading-relaxed">
                                            {activeDoctor.bio || `Dr. ${activeDoctor.user?.firstName} is a renowned specialist with over ${activeDoctor.yearsOfExperience || 10} years of experience in ${activeDoctor.specialization}.`} 
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-6 pt-6 border-t border-white/10">
                                    <div className="flex justify-between items-center mb-6">
                                        <div>
                                            <div className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Total Cost</div>
                                            <div className="text-white font-bold text-2xl">${activeDoctor.consultationFee || 150}</div>
                                        </div>
                                        <div className="text-right">
                                             <div className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Session</div>
                                             <div className="text-white font-medium">30 min</div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={handleBook}
                                        disabled={!selectedSlot || isBooking}
                                        className="w-full py-4 bg-[#CEEA32] hover:bg-[#d6f043] disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 font-bold rounded-2xl transition-all shadow-lg shadow-[#CEEA32]/20 active:scale-[0.98]"
                                    >
                                        {isBooking ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="w-4 h-4 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" />
                                                <span>Booking...</span>
                                            </div>
                                        ) : 'Confirm Booking'}
                                    </button>
                                    {bookingError && (
                                        <p className="mt-4 text-red-400 text-xs text-center font-medium bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                                            {bookingError}
                                        </p>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-white/40 space-y-6">
                                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center relative">
                                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    <div className="absolute inset-0 rounded-full border border-white/10 animate-ping opacity-20" />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold mb-2">No Doctor Selected</h3>
                                    <p className="text-sm leading-relaxed">Please select a doctor from the list to view their profile and finalize your appointment.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
