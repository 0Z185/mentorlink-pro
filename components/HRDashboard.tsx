
import React, { useState, useEffect } from 'react';
import {
    Users, Zap, Award, Target, Plus, Search,
    AlertCircle, ArrowRight, ClipboardList, Shield,
    Activity, BarChart3, Settings, ShieldAlert,
    ChevronRight, MoreVertical, RefreshCw, LogOut,
    Mail, Phone, Calendar, Star, CheckCircle2, Clock,
    AlertTriangle, X, Menu
} from 'lucide-react';
import { api, Resource, AuditLog } from '../services/supabaseService';
import { User, UserRole, Pilot, PilotEvaluationReport, SessionStatus, MentorshipStatus } from '../types';

interface HRDashboardProps {
    currentUser: User;
    onSignOut: () => void;
}

const HRDashboard: React.FC<HRDashboardProps> = ({ currentUser, onSignOut }) => {
    const [activeSubTab, setActiveSubTab] = useState<'oversight' | 'monitoring' | 'intervention' | 'reporting'>('oversight');
    const [analytics, setAnalytics] = useState<any>(null);
    const [pairs, setPairs] = useState<any[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        fetchData();
    }, [activeSubTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const coreData = await Promise.all([
                api.getGlobalAnalytics(currentUser),
                api.getAdminPairList(currentUser),
                api.getUsers(),
                api.getAuditLogs()
            ]);
            setAnalytics(coreData[0]);
            setPairs(coreData[1]);
            setUsers(coreData[2]);
            setAuditLogs(coreData[3]);
        } catch (err) {
            console.error('Error fetching HR data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOverride = async (menteeId: string, mentorId: string | null) => {
        if (window.confirm(`Are you sure you want to ${mentorId ? 'change' : 'remove'} this assignment?`)) {
            try {
                await api.overrideAssignment(currentUser, menteeId, mentorId);
                fetchData();
            } catch (err) {
                alert('Assignment override failed. See console.');
            }
        }
    };

    if (loading && !analytics) return (
        <div className="flex h-full items-center justify-center p-20">
            <RefreshCw className="animate-spin text-slate-300" size={48} />
        </div>
    );

    return (
        <div className="flex h-screen bg-[#f8fafc] overflow-hidden relative">
            {/* Mobile Overlay */}
            {isMenuOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 z-30 md:hidden backdrop-blur-sm"
                    onClick={() => setIsMenuOpen(false)}
                />
            )}

            {/* HR Side Nav - RESPONSIVE */}
            <aside className={`
                fixed inset-y-0 left-0 z-40 w-80 bg-slate-900 flex flex-col p-8 gap-10 transition-transform duration-300 transform
                md:relative md:translate-x-0 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#ef7f1a] rounded-xl flex items-center justify-center text-white shadow-lg">
                            <Shield size={24} />
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-white font-bold text-lg tracking-tight">Governance</h2>
                            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-widest leading-none">HR System Admin</span>
                        </div>
                    </div>
                    <button onClick={() => setIsMenuOpen(false)} className="md:hidden p-2 text-slate-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
                    {[
                        { id: 'oversight', label: 'Program Oversight', icon: Activity },
                        { id: 'monitoring', label: 'Safety & Monitoring', icon: ShieldAlert },
                        { id: 'intervention', label: 'Intervention Hub', icon: Zap },
                        { id: 'reporting', label: 'Audit & Reports', icon: ClipboardList },
                    ].map(item => (
                        <button
                            key={item.id}
                            onClick={() => {
                                setActiveSubTab(item.id as any);
                                setIsMenuOpen(false);
                            }}
                            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm transition-all ${activeSubTab === item.id
                                ? 'bg-slate-800 text-[#ef7f1a] shadow-lg'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                                }`}
                        >
                            <item.icon size={20} />
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="mt-auto space-y-4 shrink-0">
                    <div className="p-6 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                        <div className="flex items-center gap-3 mb-4">
                            <img src={currentUser.avatar} className="w-10 h-10 rounded-xl object-cover" />
                            <div className="overflow-hidden">
                                <p className="text-white text-xs font-bold truncate">{currentUser.name}</p>
                                <p className="text-slate-500 text-[10px] font-medium truncate">{currentUser.email}</p>
                            </div>
                        </div>
                        <button onClick={onSignOut} className="w-full py-3 bg-slate-700 hover:bg-red-500/20 hover:text-red-400 text-slate-300 rounded-xl font-bold text-[10px] uppercase transition-all flex items-center justify-center gap-2">
                            <LogOut size={14} /> Exit Governance
                        </button>
                    </div>
                </div>
            </aside>

            {/* Primary Workspace */}
            <main className="flex-1 overflow-y-auto bg-white flex flex-col relative">
                <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-10 shrink-0 z-10 sticky top-0">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsMenuOpen(true)}
                            className="md:hidden p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all"
                        >
                            <Menu size={20} />
                        </button>
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight capitalize">{activeSubTab.replace('-', ' ')}</h2>
                    </div>
                    <div className="flex gap-4">
                        <button className="px-8 py-3.5 bg-slate-900 text-white rounded-xl font-bold text-xs soft-card-shadow flex items-center gap-2">
                            <BarChart3 size={16} /> Strategy View
                        </button>
                    </div>
                </header>

                <div className="flex-1 p-10 bg-[#f8fafc]">
                    {activeSubTab === 'oversight' && (
                        <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-500">
                            <div className="grid grid-cols-4 gap-8">
                                {[
                                    { label: 'Network Engagement', val: `${analytics.overview.activePairs}`, icon: Users, color: 'text-sky-500', bg: 'bg-sky-50' },
                                    { label: 'Retention Rate', val: `${analytics.overview.completionRate}%`, icon: Award, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                                    { label: 'Avg Sentiment', val: analytics.engagement.avgMentorRating.toFixed(1), icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
                                    { label: 'Audit Velocity', val: 'Healthy', icon: Zap, color: 'text-indigo-500', bg: 'bg-indigo-50' },
                                ].map((stat, i) => (
                                    <div key={i} className="bg-white p-8 rounded-[32px] border border-slate-100 soft-card-shadow group hover:border-[#ef7f1a]/20 transition-all">
                                        <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-6`}>
                                            <stat.icon size={24} />
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                                        <p className="text-3xl font-bold text-slate-900 tracking-tight">{stat.val}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-white rounded-[40px] border border-slate-100 soft-card-shadow overflow-hidden">
                                <div className="p-10 border-b border-slate-50 flex items-center justify-between">
                                    <h4 className="text-xl font-bold text-slate-900">Active Mentorship Health</h4>
                                    <div className="flex gap-2">
                                        <button className="p-2.5 text-slate-400 hover:text-slate-900 transition-colors"><MoreVertical size={20} /></button>
                                    </div>
                                </div>
                                <div className="p-10 overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">
                                                <th className="pb-8">Relationship</th>
                                                <th className="pb-8">Mentorship Status</th>
                                                <th className="pb-8">Progress</th>
                                                <th className="pb-8">Health Flags</th>
                                                <th className="pb-8"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {pairs.map((pair, i) => (
                                                <tr key={i} className="group hover:bg-slate-50/50 transition-all">
                                                    <td className="py-6 whitespace-nowrap">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex -space-x-3">
                                                                <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold">M</div>
                                                                <div className="w-8 h-8 rounded-full bg-indigo-50 border-2 border-white flex items-center justify-center text-[10px] font-bold">m</div>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-slate-900">{pair.mentee_name}</p>
                                                                <p className="text-[10px] text-slate-400 font-medium">with {pair.mentor_name}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-6">
                                                        <span className={`px-4 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider ${pair.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                                            }`}>{pair.status}</span>
                                                    </td>
                                                    <td className="py-6 whitespace-nowrap">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                                <div className="h-full bg-emerald-500" style={{ width: `${pair.progress}%` }} />
                                                            </div>
                                                            <span className="text-xs font-bold text-slate-900">{pair.progress}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-6 whitespace-nowrap">
                                                        {pair.flags.length > 0 ? (
                                                            <div className="flex gap-2">
                                                                {pair.flags.map((flag: string, idx: number) => (
                                                                    <span key={idx} className="flex items-center gap-1.5 text-red-500 bg-red-50 px-3 py-1 rounded-full text-[9px] font-bold">
                                                                        <AlertCircle size={10} /> {flag}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-300 text-[10px] font-bold italic tracking-wide">No issues detected</span>
                                                        )}
                                                    </td>
                                                    <td className="py-6 text-right">
                                                        <button className="p-2 text-slate-300 hover:text-slate-900 transition-all"><ChevronRight size={18} /></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSubTab === 'monitoring' && (
                        <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-500">
                            <div className="flex items-end justify-between">
                                <div>
                                    <h3 className="text-4xl font-bold text-slate-900 tracking-tight">Safety & Monitoring</h3>
                                    <p className="text-slate-500 font-medium mt-2">Active risk detection and engagement monitoring.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-8">
                                    <div className="bg-white rounded-[40px] border border-slate-100 soft-card-shadow p-10">
                                        <h4 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                                            <ShieldAlert className="text-red-500" /> High-Priority Alerts
                                        </h4>
                                        <div className="space-y-4">
                                            {pairs.filter(p => p.flags.length > 0).map((pair, i) => (
                                                <div key={i} className="p-6 bg-red-50/50 rounded-3xl border border-red-100/50 flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-red-500 shadow-sm border border-red-50">
                                                            <AlertTriangle size={18} />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-900">{pair.mentee_name} & {pair.mentor_name}</p>
                                                            <p className="text-[10px] text-red-500 font-bold uppercase tracking-wide">Flagged: {pair.flags.join(', ')}</p>
                                                        </div>
                                                    </div>
                                                    <button className="px-5 py-2.5 bg-white text-slate-900 border border-slate-200 rounded-xl text-[10px] font-bold hover:bg-slate-900 hover:text-white transition-all">Review Details</button>
                                                </div>
                                            ))}
                                            {pairs.filter(p => p.flags.length > 0).length === 0 && (
                                                <div className="py-10 text-center text-slate-400 font-medium italic">
                                                    No high-priority alerts today.
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-[40px] border border-slate-100 soft-card-shadow p-10">
                                        <h4 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                                            <Activity className="text-sky-500" /> Inactivity Monitor
                                        </h4>
                                        <div className="space-y-4">
                                            {users.filter(u => u.mentorship_status === MentorshipStatus.ACTIVE).slice(0, 5).map((user) => (
                                                <div key={user.user_id} className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-transparent hover:border-slate-100 hover:bg-white transition-all group">
                                                    <div className="flex items-center gap-4">
                                                        <img src={user.avatar} className="w-10 h-10 rounded-xl object-cover" />
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-900">{user.name}</p>
                                                            <p className="text-[10px] text-slate-400 font-medium tracking-wide">Last active: 4 days ago</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-right">
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Login Freq</p>
                                                            <p className="text-xs font-bold text-slate-900">Weekly</p>
                                                        </div>
                                                        <div className={`w-2 h-2 rounded-full bg-emerald-400`} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div className="bg-white p-10 rounded-[40px] border border-slate-100 soft-card-shadow">
                                        <h4 className="text-sm font-bold text-slate-900 mb-8 flex items-center gap-2">
                                            <Clock size={16} className="text-[#ef7f1a]" /> Missed Sessions
                                        </h4>
                                        <div className="space-y-6">
                                            <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-red-500 shadow-sm border border-slate-100"><X size={14} /></div>
                                                <div>
                                                    <p className="text-[11px] font-bold text-slate-900">Career Strategy</p>
                                                    <p className="text-[10px] text-slate-400">Scheduled for yesterday</p>
                                                    <p className="text-[10px] font-bold text-red-500 uppercase mt-1">Expired</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 opacity-60">
                                                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-300 shadow-sm border border-slate-100"><Calendar size={14} /></div>
                                                <div>
                                                    <p className="text-[11px] font-bold text-slate-900">Tech Stack Review</p>
                                                    <p className="text-[10px] text-slate-400">Scheduled for 3 days ago</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Rescheduled</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-900 p-10 rounded-[40px] soft-card-shadow relative overflow-hidden">
                                        <div className="relative z-10">
                                            <h4 className="text-sm font-bold text-white mb-4">Sentiment Index</h4>
                                            <p className="text-3xl font-bold text-[#ef7f1a] mb-2">9.2</p>
                                            <p className="text-[10px] text-slate-400 font-medium leading-relaxed">Overall program sentiment is extremely high. Monitoring 12 active pairs.</p>
                                        </div>
                                        <Activity className="absolute bottom-[-20px] right-[-20px] text-white/5" size={120} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSubTab === 'intervention' && (
                        <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-end justify-between">
                                <div>
                                    <h3 className="text-4xl font-bold text-slate-900 tracking-tight">Intervention Hub</h3>
                                    <p className="text-slate-500 font-medium mt-2">Manage manual assignments and mentorship overrides.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                <div className="bg-white rounded-[40px] border border-slate-100 soft-card-shadow p-10">
                                    <h4 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                                        <Users className="text-[#ef7f1a]" /> Unassigned Mentees
                                    </h4>
                                    <div className="space-y-4">
                                        {users.filter(u => u.role === UserRole.MENTEE && !u.assigned_mentor_id).map(mentee => (
                                            <div key={mentee.user_id} className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-transparent hover:border-[#ef7f1a]/10 hover:bg-white transition-all group">
                                                <div className="flex items-center gap-4">
                                                    <img src={mentee.avatar} className="w-12 h-12 rounded-2xl object-cover" />
                                                    <div>
                                                        <p className="font-bold text-slate-900">{mentee.name}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase">{mentee.interests.slice(0, 2).join(' • ')}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleOverride(mentee.user_id, '00000000-0000-0000-0000-000000000001')}
                                                    className="p-3 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-[#ef7f1a] hover:text-white transition-all shadow-sm"
                                                >
                                                    <Plus size={18} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-white rounded-[40px] border border-slate-100 soft-card-shadow p-10">
                                    <h4 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                                        <Target className="text-indigo-500" /> Administrative Overrides
                                    </h4>
                                    <div className="space-y-4">
                                        {pairs.map((pair, i) => (
                                            <div key={i} className="p-6 bg-[#fafbfc] rounded-3xl border border-slate-50 flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-300">
                                                        <ShieldAlert size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900">{pair.mentee_name}</p>
                                                        <p className="text-[10px] text-slate-500 font-medium">Currently with {pair.mentor_name}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleOverride(pair.mentee_id, null)} className="px-5 py-2.5 bg-white text-red-500 border border-red-50 rounded-xl text-[10px] font-bold hover:bg-red-50 transition-all">Unpair</button>
                                                    <button className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-bold hover:bg-slate-800 transition-all">Reassign</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSubTab === 'reporting' && (
                        <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-500">
                            <div className="flex items-end justify-between">
                                <div>
                                    <h3 className="text-4xl font-bold text-slate-900 tracking-tight">Audit & Reports</h3>
                                    <p className="text-slate-500 font-medium mt-2">Comprehensive logs of all system interventions.</p>
                                </div>
                                <button className="px-8 py-3.5 bg-[#ef7f1a] text-white rounded-xl font-bold text-xs soft-card-shadow flex items-center gap-2">
                                    <Mail size={16} /> Export CSV Report
                                </button>
                            </div>

                            <div className="bg-white rounded-[40px] border border-slate-100 soft-card-shadow overflow-hidden">
                                <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                                    <div className="flex items-center gap-4">
                                        <ClipboardList className="text-slate-400" />
                                        <h4 className="text-xl font-bold text-slate-900">Governance Audit Logs</h4>
                                    </div>
                                </div>
                                <div className="p-10">
                                    <div className="space-y-6">
                                        {auditLogs.map(log => (
                                            <div key={log.log_id} className="flex gap-6 p-8 rounded-3xl bg-[#fafbfc] border border-slate-50 relative overflow-hidden group">
                                                <div className="w-1 bg-[#ef7f1a] absolute left-0 top-0 bottom-0 opacity-0 group-hover:opacity-100 transition-all" />
                                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-300 border border-slate-100 shrink-0 shadow-sm">
                                                    <Clock size={18} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <p className="text-sm font-bold text-slate-900">{log.action}</p>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(log.created_at).toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-100 rounded-lg">
                                                            <Shield size={10} className="text-[#ef7f1a]" />
                                                            <span className="text-[10px] font-bold text-slate-600">{log.acting_user_name}</span>
                                                        </div>
                                                        {log.target_user_name && (
                                                            <>
                                                                <ChevronRight size={12} className="text-slate-300" />
                                                                <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-100 rounded-lg">
                                                                    <Users size={10} className="text-indigo-500" />
                                                                    <span className="text-[10px] font-bold text-slate-600">{log.target_user_name}</span>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                    {log.details && Object.keys(log.details).length > 0 && (
                                                        <pre className="mt-4 p-4 bg-slate-900 rounded-2xl text-[10px] text-slate-400 overflow-x-auto font-mono leading-relaxed">
                                                            {JSON.stringify(log.details, null, 2)}
                                                        </pre>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default HRDashboard;
