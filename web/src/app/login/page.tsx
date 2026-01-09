'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Float, PerspectiveCamera, Stars } from '@react-three/drei';

function HealthLogo() {
    return (
        <group>
            <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                {/* Vertical Bar */}
                <mesh position={[0, 0, 0]}>
                    <boxGeometry args={[1.2, 4, 0.8]} />
                    <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.2} metalness={0.8} roughness={0.2} />
                </mesh>
                {/* Horizontal Bar */}
                <mesh position={[0, 0, 0]}>
                    <boxGeometry args={[4, 1.2, 0.8]} />
                    <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.2} metalness={0.8} roughness={0.2} />
                </mesh>
                {/* Center Detail */}
                <mesh position={[0, 0, 0.5]}>
                    <boxGeometry args={[1, 1, 0.2]} />
                    <meshStandardMaterial color="#ffffff" metalness={0.5} roughness={0.1} />
                </mesh>
                {/* Outer Ring */}
                <mesh rotation={[0, 0, Math.PI / 4]}>
                     <torusGeometry args={[3.2, 0.15, 16, 100]} />
                     <meshStandardMaterial color="#3b82f6" transparent opacity={0.4} />
                </mesh>
                <mesh rotation={[0, 0, -Math.PI / 4]}>
                     <torusGeometry args={[3.8, 0.1, 16, 100]} />
                     <meshStandardMaterial color="#60a5fa" transparent opacity={0.3} />
                </mesh>
            </Float>
        </group>
    );
}

function FloatingParticles({ count = 20 }) {
    return (
        <group>
            {Array.from({ length: count }).map((_, i) => (
                <Float key={i} speed={1 + Math.random()} rotationIntensity={2} floatIntensity={2} position={[
                    (Math.random() - 0.5) * 8,
                    (Math.random() - 0.5) * 8,
                    (Math.random() - 0.5) * 5
                ]}>
                    <mesh rotation={[Math.random() * Math.PI, Math.random() * Math.PI, 0]}>
                        <icosahedronGeometry args={[0.15, 0]} />
                        <meshStandardMaterial color={Math.random() > 0.5 ? "#3b82f6" : "#60a5fa"} transparent opacity={0.6} />
                    </mesh>
                </Float>
            ))}
        </group>
    );
}

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const user = await login(email, password);
            if (user.role === 'admin') {
                router.push('/admin');
            } else if (user.role === 'doctor') {
                router.push('/dashboard/doctor');
            } else {
                router.push('/dashboard/client');
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#020617] via-[#0f172a] to-[#1e1b4b] p-4">
            <div className="flex w-full max-w-[1000px] h-[700px] bg-[#0f172a]/30 rounded-[32px] overflow-hidden shadow-2xl border border-blue-500/20 backdrop-blur-xl">
                {/* Left Side: Decorative 3D */}
                <div className="hidden lg:block w-1/2 relative bg-blue-900/10 overflow-hidden">
                    <div className="absolute inset-0 z-0">
                        <Canvas shadows>
                            <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={50} />
                            <ambientLight intensity={0.5} />
                            <pointLight position={[10, 10, 10]} intensity={1.5} />
                            <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
                            
                            <Suspense fallback={null}>
                                <group rotation={[0, 0, 0]}>
                                    <HealthLogo />
                                    <FloatingParticles />
                                </group>
                            </Suspense>
                            <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
                        </Canvas>
                    </div>
                    
                    <div className="absolute inset-0 pointer-events-none">
                        {[...Array(20)].map((_, i) => (
                            <div key={i} className="absolute w-1 h-1 bg-white/20 rounded-full" style={{ top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`, opacity: Math.random() }} />
                        ))}
                    </div>
                </div>

                {/* Right Side: Form */}
                <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 py-12 relative bg-[#0f172a]/40">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Welcome back</h1>
                        <div className="text-sm text-gray-400">
                            Don't have an account? <Link href="/register" className="text-blue-400 hover:underline">Sign up</Link>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 mb-6 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                        <div className="flex flex-col gap-1.5">
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors placeholder:text-gray-500"
                                required
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors placeholder:text-gray-500"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                                >
                                    {showPassword ? (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.888 9.888L3 3m18 18l-6.888-6.888" /></svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3.5 rounded-lg transition-all active:scale-[0.98] disabled:opacity-50 mt-2"
                        >
                            {isLoading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
