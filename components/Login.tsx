import React, { useState } from 'react';
import { UserRole } from '../types';
import { Users, ArrowRight, CheckCircle2, Clock } from 'lucide-react';

interface LoginProps {
    onLogin: (email: string) => void;
    onSignup: (data: { name: string; email: string; role: UserRole; department: string; interests: string }) => Promise<void>;
    error?: string | null;
    loading?: boolean;
    tenantName?: string;
}

const DEPARTMENTS = [
    "ADMIN",
    "BD",
    "BUSINESS OPERATIONS",
    "C4H",
    "EXECUTIVE OFFICE",
    "FINANCE",
    "HnB",
    "HR",
    "IDEC",
    "IPPIS",
    "IT",
    "NASARAWA",
    "NBMS",
    "NIGER",
    "POSSAP",
    "R&PD",
    "VREG",
    "WACS-PAYDAY"
];

const Login: React.FC<LoginProps> = ({ onLogin, onSignup, error, loading, tenantName }) => {
    const [mode, setMode] = useState<'login' | 'signup' | 'pending'>('login');
    const [email, setEmail] = useState('');
    const [signupData, setSignupData] = useState({
        name: '',
        email: '',
        role: UserRole.MENTEE,
        department: '',
        interests: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (mode === 'login') {
            onLogin(email);
        } else if (mode === 'signup') {
            try {
                await onSignup(signupData);
                setMode('pending');
            } catch (err) {
                // Error is handled via props and displayed by the component
            }
        }
    };

    const quickProfiles = [
        { email: 'sarah.c@mentor.com', label: 'Sarah', role: 'Mentor' },
        { email: 'alex.r@mentee.com', label: 'Alex', role: 'Mentee' },
        { email: 'hr@mentorlink.com', label: 'Admin', role: 'HR' }
    ];

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#FDFDFD] p-6 font-sans">
            <div className="w-full max-w-[420px] mx-auto animate-in fade-in duration-700">
                {/* Header */}
                <div className="mb-10 text-center">
                    <div className="inline-flex items-center justify-center w-10 h-10 bg-slate-900 text-white rounded-xl mb-6 shadow-sm">
                        <Users size={20} strokeWidth={2.5} />
                    </div>
                    {tenantName && (
                        <p className="text-xs font-bold text-[#ef7f1a] uppercase tracking-widest mb-2">{tenantName}</p>
                    )}
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
                        {mode === 'login' ? 'Welcome back' : 'Create an account'}
                    </h1>
                    <p className="text-slate-500 text-sm font-medium">
                        {mode === 'login'
                            ? 'Enter your credentials to access your workspace.'
                            : 'Join the mentorship program to accelerate your growth.'}
                    </p>
                </div>

                {/* Form Container */}
                <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.04)]">
                    {/* Toggle */}
                    <div className="flex p-1 bg-slate-50 rounded-lg mb-8">
                        <button
                            onClick={() => setMode('login')}
                            className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${mode === 'login'
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => setMode('signup')}
                            className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${mode === 'signup'
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            Sign Up
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {mode === 'login' ? (
                            <div>
                                <label className="block text-xs font-bold text-slate-900 mb-2">Work Email</label>
                                <input
                                    type="email"
                                    required
                                    autoFocus
                                    placeholder="name@company.com"
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all font-medium"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        ) : (
                            <>
                                <div>
                                    <label className="block text-xs font-bold text-slate-900 mb-2">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        autoFocus
                                        placeholder="e.g. Jordan Lee"
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all font-medium"
                                        value={signupData.name}
                                        onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-900 mb-2">Email</label>
                                    <input
                                        type="email"
                                        required
                                        placeholder="name@company.com"
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all font-medium"
                                        value={signupData.email}
                                        onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-900 mb-2">Department / Business Unit</label>
                                    <div className="relative">
                                        <select
                                            required
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all font-medium appearance-none"
                                            value={signupData.department}
                                            onChange={(e) => setSignupData({ ...signupData, department: e.target.value })}
                                        >
                                            <option value="" disabled>Select Department</option>
                                            {DEPARTMENTS.map(dept => (
                                                <option key={dept} value={dept}>{dept}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-900 mb-2">Role</label>
                                        <div className="relative">
                                            <select
                                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all font-medium appearance-none"
                                                value={signupData.role}
                                                onChange={(e) => setSignupData({ ...signupData, role: e.target.value as UserRole })}
                                            >
                                                <option value={UserRole.MENTEE}>Mentee</option>
                                                <option value={UserRole.MENTOR}>Mentor</option>
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-900 mb-2">Interests</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. UX, React"
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all font-medium"
                                            value={signupData.interests}
                                            onChange={(e) => setSignupData({ ...signupData, interests: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {mode === 'pending' ? (
                            <div className="bg-orange-50 border border-orange-100 p-6 rounded-xl text-center space-y-4">
                                <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 text-orange-600 rounded-full">
                                    <Clock size={24} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">Registration Pending</h3>
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    Your account for <span className="font-bold">{signupData.email}</span> has been created but requires HR validation before you can log in.
                                    You will be notified once an administrator approves your access.
                                </p>
                                <button
                                    onClick={() => setMode('login')}
                                    className="text-xs font-bold text-[#ef7f1a] hover:underline"
                                >
                                    Return to Sign In
                                </button>
                            </div>
                        ) : (
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3.5 bg-slate-900 text-white rounded-lg font-bold text-sm hover:bg-slate-800 active:scale-[0.99] transition-all flex items-center justify-center gap-2 group"
                            >
                                {loading ? (
                                    <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        {mode === 'login' ? 'Continue' : 'Create Account'}
                                        <ArrowRight size={16} className="text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                                    </>
                                )}
                            </button>
                        )}
                    </form>

                    {error && (
                        <div className="mt-6 p-4 bg-rose-50 border border-rose-100 rounded-lg flex items-start gap-3">
                            <div className="p-1 bg-rose-100 rounded-full shrink-0">
                                <div className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                            </div>
                            <p className="text-xs font-medium text-rose-600 leading-relaxed">{error}</p>
                        </div>
                    )}
                </div>

                {/* Quick Access (Dev Only) */}
                {mode === 'login' && (
                    <div className="mt-8 text-center animate-in fade-in slide-in-from-top-2 duration-700 delay-200">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Quick Access (Demo)</p>
                        <div className="flex flex-wrap justify-center gap-2">
                            {quickProfiles.map((p) => (
                                <button
                                    key={p.email}
                                    onClick={() => onLogin(p.email)}
                                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-600 hover:border-[#ef7f1a] hover:text-[#ef7f1a] transition-all flex items-center gap-2"
                                >
                                    <span className={`w-1.5 h-1.5 rounded-full ${p.role === 'Mentor' ? 'bg-sky-400' : p.role === 'Mentee' ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="mt-12 text-center">
                    <p className="text-xs font-medium text-slate-400">
                        &copy; 2024 MentorLink Pro. Enterprise Edition.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
