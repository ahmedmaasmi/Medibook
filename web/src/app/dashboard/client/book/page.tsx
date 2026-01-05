'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { doctorsApi, appointmentsApi, Doctor, TimeSlot } from '@/lib/api';
import { format, addDays } from 'date-fns';
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
    const [slots, setSlots] = useState<TimeSlot[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
    const [reason, setReason] = useState('');
    
    const [isLoading, setIsLoading] = useState(true);
    const [isBooking, setIsBooking] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    // Fetch doctors and extract categories
    useEffect(() => {
        const fetchDoctors = async () => {
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
            } finally {
                setIsLoading(false);
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

    const getDoctorDetails = () => {
        return doctors.find(d => d.id === selectedDoctor);
    };

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
                        <a href="/dashboard/client/appointments" className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl transition-colors font-medium">
                            View My Appointments
                        </a>
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

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    const activeDoctor = getDoctorDetails();

    return (
        <div className="h-full max-w-[1600px] mx-auto p-6">
            <h1 className="text-3xl font-bold text-white mb-8">Make appointment</h1>

            <div className="flex flex-col lg:flex-row gap-8 h-full">
                {/* Main Content Area */}
                <div className="flex-1 min-w-0 space-y-8">
                    
                    {/* Categories */}
                    <div className="space-y-4">
                        <h3 className="text-white/60 font-medium">Choose category</h3>
                        <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar no-scrollbar">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-6 py-3 rounded-2xl whitespace-nowrap transition-all font-medium flex items-center gap-2 ${
                                        selectedCategory === cat
                                            ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                                            : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                                    }`}
                                >
                                    {/* Icons based on category could be added here */}
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Doctors List */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-white/60 font-medium">Choose doctor</h3>
                            <div className="flex gap-2">
                                <button className="p-2 text-white/40 hover:text-white transition-colors">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <button className="p-2 text-white/40 hover:text-white transition-colors">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x">
                            {filteredDoctors.map((doc) => (
                                <button
                                    key={doc.id}
                                    onClick={() => setSelectedDoctor(doc.id)}
                                    className={`snap-start min-w-[280px] p-4 rounded-2xl border transition-all text-left flex items-center gap-4 ${
                                        selectedDoctor === doc.id
                                            ? 'bg-[#1C1A26] border-primary-500 ring-1 ring-primary-500 shadow-xl shadow-primary-500/10'
                                            : 'bg-[#1C1A26] border-white/5 hover:border-white/10 hover:bg-[#23202E]'
                                    }`}
                                >
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center text-white text-xl font-bold shadow-inner">
                                        {/* Placeholder for doctor image */}
                                        {doc.user?.firstName?.charAt(0)}{doc.user?.lastName?.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="text-white font-bold text-lg">Dr. {doc.user?.firstName}</div>
                                        <div className="text-primary-400 text-sm font-medium mb-1">{doc.specialization}</div>
                                        <div className="flex items-center gap-1">
                                            <svg className="w-4 h-4 text-yellow-500 fill-current" viewBox="0 0 20 20">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                            <span className="text-white/60 text-xs">5.0</span>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Date and Time Selection */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-2">
                             <h3 className="text-white/60 font-medium">Choose date and time</h3>
                             <div className="flex items-center gap-2 bg-[#1C1A26] rounded-lg px-3 py-1 border border-white/5">
                                <span className="text-white text-sm font-medium">November, 2023</span>
                                <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                             </div>
                        </div>

                        {/* Calendar Strip */}
                        <div className="bg-[#1C1A26] rounded-2xl p-6 border border-white/5">
                             <div className="flex justify-between mb-8">
                                 {[0, 1, 2, 3, 4, 5, 6].map((offset) => {
                                    const date = addDays(new Date(), offset);
                                    const dateStr = format(date, 'yyyy-MM-dd');
                                    const isSelected = selectedDate === dateStr;
                                    
                                    return (
                                        <button
                                            key={offset}
                                            onClick={() => setSelectedDate(dateStr)}
                                            className={`flex flex-col items-center gap-2 px-4 py-3 rounded-xl transition-all ${
                                                isSelected 
                                                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' 
                                                    : 'text-white/40 hover:text-white hover:bg-white/5'
                                            }`}
                                        >
                                            <span className="text-xs font-medium uppercase">{format(date, 'EEE')}</span>
                                            <span className="text-lg font-bold">{format(date, 'd')}</span>
                                        </button>
                                    );
                                })}
                             </div>

                             {/* Time Slots */}
                             <div className="grid grid-cols-4 gap-4">
                                {isLoading && !slots.length ? (
                                    <div className="col-span-4 text-center py-4 text-white/40">Loading slots...</div>
                                ) : slots.length === 0 ? (
                                    <div className="col-span-4 text-center py-4 text-white/40">
                                        {selectedDoctor ? 'No slots available for this date' : 'Select a doctor to see availability'}
                                    </div>
                                ) : (
                                    slots.map((slot, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setSelectedSlot(slot)}
                                            disabled={!slot.available}
                                            className={`py-3 rounded-xl text-sm font-medium transition-all ${
                                                selectedSlot?.startTime === slot.startTime
                                                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/50'
                                                    : slot.available
                                                        ? 'bg-white/5 text-white/70 border border-transparent hover:bg-white/10'
                                                        : 'bg-white/5 text-white/20 cursor-not-allowed dashed border border-white/5'
                                            }`}
                                        >
                                            {slot.startTime.slice(0, 5)}
                                        </button>
                                    ))
                                )}
                             </div>
                        </div>
                    </div>
                    
                    {/* Selected Slot Display for Mobile mainly, but also confirmation context */}
                    {selectedSlot && (
                        <div className="bg-[#1C1A26] border border-yellow-500/20 bg-yellow-500/5 rounded-xl p-4 flex items-center justify-between lg:hidden">
                             <div>
                                <span className="text-white/60 text-sm">Selected: </span>
                                <span className="text-white font-medium">
                                    {format(new Date(selectedDate), 'MMM d')} | {selectedSlot.startTime.slice(0, 5)}
                                </span>
                             </div>
                        </div>
                    )}
                </div>

                {/* Side Panel - Doctor Details */}
                <div className="w-full lg:w-[400px] shrink-0">
                    <div className="bg-[#1C1A26] border border-white/5 rounded-[32px] p-6 h-full text-white flex flex-col relative overflow-hidden">
                        {/* Close button placeholder */}
                        <div className="absolute top-6 right-6">
                             <button className="text-white/40 hover:text-white transition-colors">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                             </button>
                        </div>

                        {activeDoctor ? (
                            <>
                                <div className="flex flex-col items-center mb-8 pt-4">
                                    <div className="w-24 h-24 rounded-2xl bg-white/5 mb-4 overflow-hidden relative border border-white/10">
                                         {/* Actual image would go here */}
                                         <div className="w-full h-full bg-gradient-to-br from-primary-400/20 to-primary-600/20 flex items-center justify-center text-white text-3xl font-bold">
                                            {activeDoctor.user?.firstName?.charAt(0)}
                                         </div>
                                         <div className="absolute top-2 right-2 w-3 h-3 bg-green-500 rounded-full border-2 border-[#1C1A26]"></div>
                                    </div>
                                    <h2 className="text-xl font-bold text-white mb-1">Dr. {activeDoctor.user?.firstName} {activeDoctor.user?.lastName}</h2>
                                    <p className="text-white/60 text-sm font-medium">{activeDoctor.specialization}</p>
                                </div>

                                <div className="flex justify-center gap-4 mb-8">
                                    <button className="w-12 h-12 rounded-2xl bg-white/5 text-white flex items-center justify-center hover:bg-white/10 transition-colors border border-white/5">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                        </svg>
                                    </button>
                                    <button className="w-12 h-12 rounded-2xl bg-primary-500/20 text-primary-400 flex items-center justify-center hover:bg-primary-500/30 transition-colors border border-primary-500/20">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                    </button>
                                    <button className="w-12 h-12 rounded-2xl bg-primary-500/20 text-primary-400 flex items-center justify-center hover:bg-primary-500/30 transition-colors border border-primary-500/20">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                    <div>
                                        <h3 className="text-white font-bold mb-3">Biography</h3>
                                        <p className="text-white/60 text-sm leading-relaxed">
                                            {activeDoctor.bio || `Dr. ${activeDoctor.user?.firstName} is a renowned specialist with over ${activeDoctor.yearsOfExperience || 10} years of experience in ${activeDoctor.specialization}.`} 
                                            <button className="text-primary-400 font-medium ml-1">Read more</button>
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="text-white font-bold mb-3">Location</h3>
                                        <div className="bg-white/5 p-3 rounded-2xl flex gap-3 items-center border border-white/5">
                                            <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center text-primary-400 shrink-0">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-white font-medium text-sm">New York Medical Center</div>
                                                <div className="text-white/60 text-xs truncate">123 Main Street, New York, USA</div>
                                            </div>
                                        </div>
                                        <div className="mt-3 h-32 bg-white/5 rounded-2xl relative overflow-hidden border border-white/5">
                                             {/* Map placeholder */}
                                             <div className="absolute inset-0 flex items-center justify-center text-white/20 bg-white/5">
                                                Map View
                                             </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 pt-6 border-t border-white/10">
                                    <div className="flex justify-between items-center mb-4">
                                        <div>
                                            <div className="text-white/60 text-xs font-medium">Total Cost</div>
                                            <div className="text-white font-bold text-lg">${activeDoctor.consultationFee || 150}</div>
                                        </div>
                                        <div className="text-right">
                                             <div className="text-white/60 text-xs font-medium">Session</div>
                                             <div className="text-white font-bold text-lg">30 min</div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={handleBook}
                                        disabled={!selectedSlot || isBooking}
                                        className="w-full py-4 bg-[#CEEA32] hover:bg-[#d6f043] disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 font-bold rounded-2xl transition-colors shadow-lg shadow-[#CEEA32]/20"
                                    >
                                        {isBooking ? 'Booking...' : 'Book Appointment'}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-white/40">
                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <h3 className="text-white font-medium mb-1">No Doctor Selected</h3>
                                <p className="text-sm">Select a doctor to view their profile and book an appointment.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {error && (
                <div className="fixed bottom-6 right-6 p-4 bg-red-500 text-white rounded-xl shadow-lg animate-in slide-in-from-bottom-4">
                    {error}
                </div>
            )}
        </div>
    );
}
