'use client';

import { useState } from 'react';
import { useSpeech, speak } from '@/lib/speech';
import { voiceApi } from '@/lib/api';

export default function VoiceBookingPage() {
    const { isListening, transcript, isSupported, startListening, stopListening, resetTranscript } = useSpeech();
    const [response, setResponse] = useState<{ message: string; success: boolean } | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleVoiceCommand = async () => {
        if (!transcript.trim()) {
            setResponse({ message: 'Please speak your request first.', success: false });
            return;
        }

        setIsProcessing(true);
        try {
            const result = await voiceApi.process(transcript.trim());
            setResponse({
                message: result.data.message,
                success: result.data.success,
            });
            // Speak the response
            speak(result.data.message);
        } catch (error) {
            setResponse({
                message: error instanceof Error ? error.message : 'Failed to process request',
                success: false,
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleToggleListening = () => {
        if (isListening) {
            stopListening();
        } else {
            resetTranscript();
            setResponse(null);
            startListening();
        }
    };

    if (!isSupported) {
        return (
            <div className="max-w-2xl mx-auto">
                <div className="card-dark text-center py-12">
                    <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-4">Voice Not Supported</h2>
                    <p className="text-white/60">
                        Your browser does not support the Web Speech API.
                        Please use Chrome, Edge, or Safari for voice booking.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            {/* Header */}
            <div className="text-center">
                <h1 className="text-3xl font-bold text-white mb-2">AI Voice Booking</h1>
                <p className="text-white/60">
                    Speak naturally to book, check availability, or manage your appointments
                </p>
            </div>

            {/* Voice Interface */}
            <div className="card-dark text-center py-12">
                {/* Microphone Button */}
                <button
                    onClick={handleToggleListening}
                    disabled={isProcessing}
                    className={`w-32 h-32 rounded-full mx-auto mb-8 flex items-center justify-center transition-all duration-300 ${isListening
                            ? 'bg-primary-500 voice-active scale-110'
                            : 'bg-white/10 hover:bg-white/20'
                        } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <svg
                        className={`w-16 h-16 ${isListening ? 'text-white' : 'text-white/70'}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                        />
                    </svg>
                </button>

                <p className="text-white/60 mb-2">
                    {isListening ? 'Listening...' : isProcessing ? 'Processing...' : 'Click the microphone to start'}
                </p>

                {/* Transcript */}
                {transcript && (
                    <div className="mt-6 p-4 bg-white/5 rounded-xl">
                        <p className="text-white/50 text-sm mb-2">You said:</p>
                        <p className="text-white text-lg">&quot;{transcript}&quot;</p>
                    </div>
                )}

                {/* Process Button */}
                {transcript && !isListening && (
                    <button
                        onClick={handleVoiceCommand}
                        disabled={isProcessing}
                        className="btn-primary mt-6 disabled:opacity-50"
                    >
                        {isProcessing ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Processing...
                            </span>
                        ) : (
                            'Process Request'
                        )}
                    </button>
                )}

                {/* Response */}
                {response && (
                    <div
                        className={`mt-6 p-4 rounded-xl ${response.success
                                ? 'bg-accent-500/20 border border-accent-500/50'
                                : 'bg-yellow-500/20 border border-yellow-500/50'
                            }`}
                    >
                        <p className={response.success ? 'text-accent-400' : 'text-yellow-400'}>
                            {response.message}
                        </p>
                    </div>
                )}
            </div>

            {/* Example Commands */}
            <div className="card-dark">
                <h3 className="text-lg font-semibold text-white mb-4">Try saying:</h3>
                <div className="grid gap-3">
                    {[
                        '"Book an appointment with Dr. Smith tomorrow at 2pm"',
                        '"Check availability for Dr. Johnson on Monday"',
                        '"What are my upcoming appointments?"',
                        '"Cancel my appointment on Friday"',
                    ].map((example, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                            <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 text-sm">
                                {i + 1}
                            </div>
                            <p className="text-white/70 text-sm">{example}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
