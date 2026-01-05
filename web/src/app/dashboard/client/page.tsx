'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useChat, Message } from '@/lib/chat';
import { appointmentsApi, doctorsApi, chatApi, Appointment, Doctor, ChatResponse } from '@/lib/api';
import { format } from 'date-fns';

export default function ClientDashboard() {
    const { user } = useAuth();
    const { activeChat, addMessageToChat, appendTokenToLastMessage, updateLastMessage, activeChatId, createNewChat } = useChat();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [inputValue, setInputValue] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [lastAiResponse, setLastAiResponse] = useState<ChatResponse | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const messages = activeChat?.messages || [];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                const [apptRes, docRes] = await Promise.all([
                    appointmentsApi.getAll({ fromDate: new Date().toISOString().split('T')[0] }),
                    doctorsApi.getAll(),
                ]);
                setAppointments(apptRes.data.appointments.slice(0, 3));
                setDoctors(docRes.data.doctors.slice(0, 4));
            } catch (error) {
                console.error('Failed to fetch data:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [user]);

    const handleStopChat = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
            setIsSending(false);
        }
    };

    const handleSendMessage = async (text: string = inputValue) => {
        if (!text.trim() || isSending) return;

        let currentChatId = activeChatId;
        if (!currentChatId) {
            currentChatId = createNewChat();
        }

        const userMessage = text.trim();
        addMessageToChat(currentChatId, { role: 'user', content: userMessage });
        setInputValue('');
        setIsSending(true);
        setLastAiResponse(null); // Clear previous suggestions

        // Create new AbortController for this request
        abortControllerRef.current = new AbortController();

        try {
            // Add an empty assistant message to be filled by the stream
            addMessageToChat(currentChatId, { role: 'assistant', content: '' });

            await chatApi.streamMessage(
                userMessage,
                (token) => {
                    if (currentChatId) {
                        appendTokenToLastMessage(currentChatId, token);
                    }
                },
                async (finalData: ChatResponse) => {
                    setLastAiResponse(finalData);
                    
                    // If the response indicates success, we might want to refresh data
                    if (finalData.success) {
                        // Refresh appointments if needed
                        const apptRes = await appointmentsApi.getAll({ fromDate: new Date().toISOString().split('T')[0] });
                        setAppointments(apptRes.data.appointments.slice(0, 3));
                    }
                },
                abortControllerRef.current.signal
            );
        } catch (error: any) {
            if (error.name === 'AbortError') {
                console.log('Chat stream aborted');
                if (currentChatId) {
                    updateLastMessage(currentChatId, 'Chat stopped.');
                }
            } else {
                console.error('Failed to send message:', error);
                if (currentChatId) {
                    updateLastMessage(currentChatId, 'Sorry, I encountered an error processing your request.');
                }
            }
        } finally {
            setIsSending(false);
            abortControllerRef.current = null;
        }
    };

    const handleActionClick = (label: string) => {
        let command = '';
        switch (label) {
            case 'Book Appointment':
                command = 'I want to book an appointment';
                break;
            case 'Check Symptoms':
                command = 'I want to check my symptoms';
                break;
            case 'View Schedule':
                command = 'Show me my schedule';
                break;
            default:
                command = label;
        }
        handleSendMessage(command);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col max-w-6xl mx-auto w-full px-6 py-4">
            {/* Top Bar */}
            <header className="flex justify-between items-center mb-8">
                <div className="flex-1"></div>
                
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => alert('Configuration settings coming soon!')}
                        className="px-4 py-2 bg-[#2A2735] hover:bg-[#322F40] text-white/70 text-sm font-medium rounded-xl border border-white/5 transition-colors flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Configuration
                    </button>
                    <button 
                        onClick={() => alert('Exporting data...')}
                        className="px-4 py-2 bg-[#2A2735] hover:bg-[#322F40] text-white/70 text-sm font-medium rounded-xl border border-white/5 transition-colors flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Export
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <div className={`flex-1 flex flex-col items-center mx-auto w-full text-center transition-all duration-700 ${
                messages.length > 0 ? 'max-w-5xl' : 'max-w-2xl'
            }`}>
                
                {/* Orb */}
                {messages.length === 0 && (
                    <div className="orb-container mb-8 animate-in fade-in zoom-in duration-700">
                        <div className="orb"></div>
                    </div>
                )}

                <div className={`transition-all duration-500 overflow-hidden w-full ${
                    messages.length > 0 ? 'opacity-0 max-h-0' : 'opacity-100 max-h-20 mb-8'
                }`}>
                    <h1 className="text-4xl font-medium text-white tracking-tight">
                        Ready to Book an Appointment?
                    </h1>
                </div>

                {messages.length > 0 && (
                    <div className="w-full flex-1 overflow-y-auto mb-8 pr-2 custom-scrollbar transition-all duration-500 min-h-[400px] flex flex-col">
                        <div className="flex flex-col gap-6 mt-auto">
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div className={`max-w-[85%] px-5 py-3 rounded-2xl text-left transition-all duration-300 ${
                                        msg.role === 'user' 
                                            ? 'bg-primary-500 text-white rounded-tr-none shadow-lg shadow-primary-500/10' 
                                            : 'bg-gradient-to-br from-blue-600/20 via-blue-500/10 to-transparent border border-blue-400/20 text-white/90 rounded-tl-none shadow-[0_0_20px_rgba(59,130,246,0.1)] backdrop-blur-sm'
                                    }`}>
                                        <p className={`text-sm leading-relaxed ${msg.role === 'assistant' ? 'font-normal' : 'font-light'}`}>{msg.content}</p>
                                    </div>
                                </div>
                            ))}
                            {isSending && (
                                <div className="flex flex-col items-start gap-2">
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-400/20 rounded-full">
                                        <div className="flex gap-1 mr-2">
                                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                                        </div>
                                        <span className="text-[10px] font-medium text-blue-300 uppercase tracking-wider">AI is processing</span>
                                        <button 
                                            onClick={handleStopChat}
                                            className="ml-2 px-2 py-0.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-[9px] font-bold rounded-md transition-colors border border-red-500/30"
                                        >
                                            STOP
                                        </button>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>
                )}

                {/* AI Suggestions (if any) */}
                {lastAiResponse && (lastAiResponse.suggested_specialty || (lastAiResponse.data && lastAiResponse.data.slots)) && (
                    <div className="w-full mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-accent-500/10 border border-accent-500/20 rounded-2xl p-4 text-left backdrop-blur-md">
                            {lastAiResponse.suggested_specialty && (
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-8 h-8 rounded-full bg-accent-500/20 flex items-center justify-center text-accent-400">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="text-white font-medium text-sm">Suggested Specialty: {lastAiResponse.suggested_specialty}</h4>
                                        <p className="text-white/40 text-xs">Based on your described symptoms</p>
                                    </div>
                                </div>
                            )}
                            
                            {lastAiResponse.doctors && lastAiResponse.doctors.length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                                    {lastAiResponse.doctors.map((doc) => (
                                        <Link 
                                            key={doc.id}
                                            href={`/dashboard/client/book?doctor=${doc.id}`}
                                            className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all group"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-400 to-accent-400 flex items-center justify-center text-white font-bold text-xs">
                                                {doc.user?.firstName?.charAt(0)}{doc.user?.lastName?.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-white text-sm font-medium truncate">Dr. {doc.user?.lastName}</div>
                                                <div className="text-white/40 text-xs truncate">{doc.specialization}</div>
                                            </div>
                                            <div className="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <svg className="w-3 h-3 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}

                            {lastAiResponse.data?.slots && lastAiResponse.data.slots.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-white/5">
                                    <h4 className="text-white/80 font-medium text-sm mb-3 flex items-center gap-2">
                                        <svg className="w-4 h-4 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Available Times for Dr. {lastAiResponse.data.doctor?.user?.lastName}
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {lastAiResponse.data.slots.slice(0, 8).map((slot, idx) => (
                                            <button 
                                                key={idx}
                                                className="px-3 py-1.5 bg-primary-500/20 hover:bg-primary-500/40 border border-primary-500/30 rounded-lg text-primary-200 text-xs font-medium transition-all"
                                                onClick={() => handleSendMessage(`Book appointment at ${slot.startTime.slice(0, 5)}`)}
                                            >
                                                {slot.startTime.slice(0, 5)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Quick Actions */}
                <div className={`transition-all duration-500 overflow-hidden w-full ${
                    messages.length > 0 ? 'opacity-0 max-h-0 mb-0' : 'opacity-100 max-h-32 mb-8'
                }`}>
                    <div className="flex flex-wrap justify-center gap-3">
                        <ActionButton icon="calendar" label="Book Appointment" onClick={() => handleActionClick('Book Appointment')} />
                        <ActionButton icon="brain" label="Check Symptoms" onClick={() => handleActionClick('Check Symptoms')} />
                        <ActionButton icon="list" label="View Schedule" onClick={() => handleActionClick('View Schedule')} />
                    </div>
                </div>

                {/* Input Area */}
                <div className="w-full relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-accent-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative bg-[#1C1A26] border border-white/10 rounded-2xl p-4 shadow-2xl">
                        <form 
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSendMessage();
                            }}
                            className="flex items-center gap-3 mb-3"
                        >
                            <div className="w-5 h-5 text-primary-400">
                                <svg className={`w-full h-full ${isSending ? 'animate-pulse' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <input 
                                type="text" 
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="Describe your symptoms or ask for a doctor..." 
                                className="bg-transparent border-none outline-none text-white placeholder-white/30 text-lg flex-1 font-light"
                                disabled={isSending}
                            />
                        </form>
                        
                        <div className="flex justify-between items-center pt-3 border-t border-white/5">
                            <div className="flex items-center gap-2">
                                <IconButton icon="paperclip" />
                                <IconButton icon="settings" />
                                <IconButton icon="grid" />
                            </div>
                            <div className="flex items-center gap-3">
                                <Link 
                                    href="/dashboard/client/voice"
                                    className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                    </svg>
                                </Link>
                                <button 
                                    onClick={() => handleSendMessage()}
                                    disabled={!inputValue.trim() || isSending}
                                    className="w-8 h-8 rounded-full bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-white transition-colors shadow-lg shadow-primary-500/20"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Cards */}
            {messages.length === 0 && (
                <div className="mt-16 transition-all duration-700 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <div className="grid md:grid-cols-3 gap-6">
                        <Card 
                            title="Recent Appointments" 
                            icon="clock" 
                            color="primary"
                            items={appointments.length > 0 ? appointments.slice(0, 2).map(apt => (
                                `Dr. ${apt.doctor?.user?.firstName} ${apt.doctor?.user?.lastName} - ${format(new Date(apt.appointmentDate), 'MMM d')}`
                            )) : ['No recent appointments']}
                        />
                        <Card 
                            title="Available Doctors" 
                            icon="user" 
                            color="accent"
                            items={doctors.length > 0 ? doctors.slice(0, 2).map(doc => (
                                `Dr. ${doc.user?.firstName} ${doc.user?.lastName}`
                            )) : ['No doctors available']}
                        />
                        <Card 
                            title="Health Assistant" 
                            icon="code" 
                            color="blue"
                            items={['Check symptoms', 'Emergency contacts', 'Health tips']}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

function ActionButton({ icon, label, onClick }: { icon: string; label: string; onClick?: () => void }) {
    const icons: Record<string, JSX.Element> = {
        calendar: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
        brain: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />,
        list: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    };

    return (
        <button 
            onClick={onClick}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-white/70 hover:text-white text-sm transition-all"
        >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {icons[icon]}
            </svg>
            {label}
        </button>
    );
}

function IconButton({ icon }: { icon: string }) {
    const icons: Record<string, JSX.Element> = {
        paperclip: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />,
        settings: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />,
        grid: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    };

    return (
        <button className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {icons[icon]}
            </svg>
        </button>
    );
}

function Card({ title, icon, color, items }: { title: string; icon: string; color: string; items: string[] }) {
    const icons: Record<string, JSX.Element> = {
        clock: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
        user: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
        code: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    };

    const colorClasses: Record<string, string> = {
        primary: 'bg-primary-500/20 text-primary-400',
        accent: 'bg-accent-500/20 text-accent-400',
        blue: 'bg-blue-500/20 text-blue-400'
    };

    return (
        <div className="bg-[#1C1A26] border border-white/5 rounded-2xl p-6 hover:bg-[#23202E] transition-all group cursor-pointer relative overflow-hidden">
            <div className={`absolute top-0 right-0 p-4 opacity-50`}>
                <button className="text-white/20 hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                </button>
            </div>
            
            <div className={`w-12 h-12 rounded-xl ${colorClasses[color]} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {icons[icon]}
                </svg>
            </div>
            
            <h3 className="text-white font-semibold mb-2">{title}</h3>
            
            <ul className="space-y-2">
                {items.map((item, i) => (
                    <li key={i} className="text-white/40 text-sm truncate">
                        {item}
                    </li>
                ))}
            </ul>
            
            <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs text-white/40">View details</span>
                <div className={`w-6 h-6 rounded-full ${colorClasses[color]} flex items-center justify-center`}>
                     <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                </div>
            </div>
        </div>
    );
}
