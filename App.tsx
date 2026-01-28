
import React, { useState, useEffect } from 'react';
import { User, UserRole, Session, Goal, GoalStatus, SessionStatus, Notification, SessionFeedback, MentorshipStatus, Pilot, PilotEvaluationReport, PilotOutcome } from './types';
import { api, Resource } from './services/supabaseService';
import {
  Users, Calendar, Target, LogOut, ChevronRight, Plus, CheckCircle2,
  Clock, Search, X, Bell, Zap, CalendarCheck2,
  Sparkles, MapPin, Award, BarChart3,
  Settings, Menu
} from 'lucide-react';
import HRDashboard from './components/HRDashboard';
import Login from './components/Login';
import { TenantProvider, useTenant } from './contexts/TenantContext';

const AppContent: React.FC = () => {
  const { tenant, loading: tenantLoading, getLabel } = useTenant();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'goals' | 'network' | 'reporting'>('dashboard');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [mentors, setMentors] = useState<User[]>([]);
  const [mentees, setMentees] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userFeedback, setUserFeedback] = useState<SessionFeedback[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);

  const [analytics, setAnalytics] = useState<any>(null);
  const [pairList, setPairList] = useState<any[]>([]);
  const [pilots, setPilots] = useState<Pilot[]>([]);
  const [selectedPilotReport, setSelectedPilotReport] = useState<PilotEvaluationReport | null>(null);

  const [loading, setLoading] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState<{ menteeId: string, menteeName: string } | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newSessionData, setNewSessionData] = useState({ topic: '', date: '', time: '', menteeId: '' });
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadUserData();
    }
  }, [currentUser]);

  const loadUserData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const [userSessions, userGoals, allMentors, allMentees, userNotifications, feedback, userResources] = await Promise.all([
        api.getSessions(currentUser.user_id),
        api.getGoals(currentUser.user_id),
        api.getUsers(UserRole.MENTOR),
        api.getUsers(UserRole.MENTEE),
        api.getNotifications(currentUser.user_id),
        api.getFeedbackForUser(currentUser.user_id),
        api.getResources(currentUser.role)
      ]);
      setSessions(userSessions.sort((a, b) => new Date(a.scheduled_datetime).getTime() - new Date(b.scheduled_datetime).getTime()));
      setGoals(userGoals);
      setMentors(allMentors);
      setMentees(allMentees);
      setNotifications(userNotifications);
      setUserFeedback(feedback);
      setResources(userResources);

      if (currentUser.role === UserRole.MENTOR) {
        const [myMentees, menteeGoals] = await Promise.all([
          api.getMyMentees(currentUser.user_id),
          api.getMenteesGoals(currentUser.user_id)
        ]);
        setMentees(myMentees);
        // We'll store mentee goals in a separate state or reuse goals if careful
        // Filtering goals to only show own goals in dashboard, and mentee goals in reporting
        setGoals([...userGoals, ...menteeGoals]);
      }

      if (currentUser.role === UserRole.HR_ADMIN) {
        const [stats, pairs, allPilots] = await Promise.all([
          api.getGlobalAnalytics(currentUser),
          api.getAdminPairList(currentUser),
          api.getPilots()
        ]);
        setAnalytics(stats);
        setPairList(pairs);
        setPilots(allPilots);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  const handleScheduleSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    let targetUserId = '';
    if (currentUser.role === UserRole.MENTEE && currentUser.assigned_mentor_id) {
      targetUserId = currentUser.assigned_mentor_id;
    } else if (currentUser.role === UserRole.MENTOR) {
      targetUserId = newSessionData.menteeId;
      if (!targetUserId && mentees.length > 0) {
        // Fallback to first mentee if only one exists and not selected
        targetUserId = mentees[0].user_id;
      }
    }

    if (!targetUserId) {
      setError("Please select a mentee to schedule a session.");
      return;
    }

    try {
      const isoDatetime = new Date(`${newSessionData.date}T${newSessionData.time}`).toISOString();
      await api.createSession(currentUser, targetUserId, isoDatetime, newSessionData.topic);
      setShowScheduleModal(false);
      setNewSessionData({ topic: '', date: '', time: '', menteeId: '' });
      loadUserData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleManualAssign = async (menteeId: string, mentorId: string) => {
    if (!currentUser) return;
    try {
      setError(null);
      await api.assignMentor(currentUser, menteeId, mentorId);
      setShowAssignModal(null);
      loadUserData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getStatusColor = (status: string | SessionStatus | GoalStatus | MentorshipStatus | PilotOutcome) => {
    switch (status) {
      case 'Active':
      case SessionStatus.SCHEDULED:
      case GoalStatus.COMPLETED:
      case MentorshipStatus.ACTIVE:
      case PilotOutcome.SUCCESSFUL: return 'bg-emerald-50 text-emerald-600';
      case 'Pending':
      case MentorshipStatus.UNASSIGNED:
      case SessionStatus.PENDING:
      case GoalStatus.IN_PROGRESS:
      case PilotOutcome.NEEDS_IMPROVEMENT: return 'bg-amber-50 text-amber-600';
      case MentorshipStatus.TERMINATED:
      case SessionStatus.CANCELLED:
      case PilotOutcome.UNSUCCESSFUL: return 'bg-rose-50 text-rose-600';
      default: return 'bg-slate-50 text-slate-500';
    }
  };

  const formatSessionDate = (iso: string) => {
    const d = new Date(iso);
    return {
      month: d.toLocaleString('default', { month: 'short' }),
      day: d.getDate(),
      time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const handleLogin = async (email: string) => {
    setLoading(true);
    try {
      const u = await api.login(email);
      if (u) {
        setCurrentUser(u);
        setActiveTab(u.role === UserRole.HR_ADMIN ? 'dashboard' : 'dashboard');
      } else {
        setError("User not found. Please sign up.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  if (tenantLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#fafbfc] text-slate-400">Loading workspace...</div>;
  }

  if (!currentUser) {
    return (
      <Login
        tenantName={tenant?.name}
        onLogin={handleLogin}
        onSignup={(data) => {
          // Adapt the data structure for the existing handleSignUp
          // We need to set state then call handleSignUp or just call the API directly
          // Since handleSignUp uses state, we might need to refactor handleSignUp or set state here.
          // Let's check handleSignUp implementation.
          // It uses signupData state.
          // We should probably refactor handleSignUp to accept data, but for now let's set state and call logic or better:
          // The Login component passes data back. We should update handleSignUp to accept arguments or update the state then call it.
          // Actually, handleSignUp takes an event. Let's refactor handleSignUp in next step or change how we call it.
          // Wait, the Login component calls onSignup(data). 
          // Let's just create a wrapper here.

          // We can't immediately call handleSignUp because state hasn't updated. 
          // Better pattern: Update handleSignUp to optionally take data.
          // For now, let's pass a custom handler that calls the API directly or refactor handleSignUp.
          // Refactoring handleSignUp is cleaner. I will do that in a separate edit.
          // For this block, I will assume handleSignUp is refactored or I will implement the logic here.
          // Let's implement a specific handler here to match what Login expects.
          const doSignup = async () => {
            setLoading(true);
            try {
              const interestsArray = data.interests.split(',').map(s => s.trim()).filter(Boolean);
              const newUser = await api.signUp({
                name: data.name,
                email: data.email,
                role: data.role,
                interests: interestsArray,
                avatar: `https://picsum.photos/seed/${data.name.replace(/\s+/g, '')}/200`
              }, tenant?.tenant_id || '');
              setCurrentUser(newUser);
              setActiveTab('dashboard');
            } catch (err: any) {
              setError(err.message);
            } finally {
              setLoading(false);
            }
          };
          doSignup();
        }}
        error={error}
        loading={loading}
      />
    );
  }

  if (currentUser.role === UserRole.HR_ADMIN) {
    return <HRDashboard currentUser={currentUser} onSignOut={() => setCurrentUser(null)} />;
  }

  return (
    <div className="min-h-screen bg-[#fafbfc] flex flex-col md:flex-row h-screen overflow-hidden relative">
      {/* Mobile Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Sidebar - RESPONSIVE */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-slate-100 flex flex-col transition-transform duration-300 transform
        md:relative md:translate-x-0 ${isMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        <div className="px-8 py-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-[#ef7f1a] p-2.5 rounded-xl text-white">
              <Users size={24} strokeWidth={2.5} />
            </div>
            <span className="font-bold text-xl text-slate-900 tracking-tight">{tenant?.name || 'MentorLink'}</span>
          </div>
          <button onClick={() => setIsMenuOpen(false)} className="md:hidden p-2 text-slate-400 hover:text-slate-900">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
          {[
            { id: 'dashboard', label: 'Overview', icon: Zap },
            { id: 'calendar', label: 'Schedule', icon: Calendar },
            { id: 'goals', label: 'Roadmap', icon: Target },
            { id: 'network', label: 'Network', icon: Users },
            ...(currentUser.role === UserRole.MENTOR ? [{ id: 'reporting', label: `${getLabel('mentee')} Progress`, icon: BarChart3 }] : []),
          ].map(item => {
            const Icon = (item as any).icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as any);
                  setIsMenuOpen(false);
                }}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm transition-all ${activeTab === item.id
                  ? 'bg-[#ef7f1a]/5 text-[#ef7f1a] shadow-sm'
                  : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'
                  }`}
              >
                <Icon size={20} />
                {item.label}
              </button>
            );
          })}

          <div className="pt-8 mt-8 border-t border-slate-50">
            <button className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all">
              <Settings size={20} />
              Settings
            </button>
          </div>
        </nav>

        <div className="p-6 border-t border-slate-50 space-y-3 shrink-0">
          <button onClick={() => setCurrentUser(null)} className="w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all text-sm font-medium group text-left">
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-6 md:px-10 shrink-0 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMenuOpen(true)}
              className="md:hidden p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all"
            >
              <Menu size={20} />
            </button>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight capitalize">{activeTab.replace('-', ' ')}</h2>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={() => setShowNotifications(!showNotifications)} className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all relative">
              <Bell size={20} />
              {notifications.some(n => !n.read) && <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#ef7f1a] rounded-full border-2 border-white"></span>}
            </button>
            <div className="flex items-center gap-3">
              <img src={currentUser.avatar} alt="Profile" className="w-9 h-9 rounded-xl object-cover ring-2 ring-slate-50 shadow-sm" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-10 bg-[#fafbfc]">
          {activeTab === 'dashboard' && (
            <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500">
              <div className="bg-white p-12 rounded-[32px] soft-card-shadow border border-slate-50 relative overflow-hidden group">
                <div className="relative z-10 max-w-2xl">
                  <div className="flex items-center gap-2 text-[#ef7f1a] mb-4">
                    <Sparkles size={18} />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Personalized Insights</span>
                  </div>
                  <h3 className="text-4xl font-bold text-slate-900 mb-6 tracking-tight">Hello, {currentUser.name.split(' ')[0]}</h3>
                  <p className="text-slate-500 font-medium mb-10 leading-relaxed">
                    Your mentorship cycle is currently at peak productivity. You have <span className="text-slate-900 font-bold">{sessions.filter(s => s.status === SessionStatus.SCHEDULED).length} upcoming sessions</span> to prepare for.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button onClick={() => setActiveTab('calendar')} className="px-8 py-3.5 bg-[#ef7f1a] text-white rounded-xl font-bold text-sm soft-card-shadow hover:translate-y-[-2px] transition-all">Check Schedule</button>
                    <button onClick={() => setActiveTab('goals')} className="px-8 py-3.5 bg-white border border-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all">Career Goals</button>
                  </div>
                </div>
                <div className="absolute top-[-20%] right-[-10%] opacity-[0.03] pointer-events-none group-hover:scale-105 transition-transform duration-[3s]">
                  <Users size={600} strokeWidth={1} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Upcoming', val: sessions.filter(s => s.status === SessionStatus.SCHEDULED).length, icon: CalendarCheck2, color: 'text-sky-500', bg: 'bg-sky-50' },
                  { label: 'Completed', val: sessions.filter(s => s.status === SessionStatus.COMPLETED).length, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                  { label: 'Pending Goals', val: goals.filter(g => g.status !== GoalStatus.COMPLETED).length, icon: Target, color: 'text-indigo-500', bg: 'bg-indigo-50' },
                  { label: 'Health Score', val: '9.4', icon: Award, color: 'text-amber-500', bg: 'bg-amber-50' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white p-8 rounded-3xl border border-slate-50 soft-card-shadow group">
                    <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-6`}>
                      <stat.icon size={20} />
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-slate-900 tracking-tight">{stat.val}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'calendar' && (
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-end justify-between">
                <div>
                  <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{getLabel('program_name')} Schedule</h3>
                  <p className="text-slate-500 text-sm mt-1 font-medium">Coordinate your growth sessions with ease</p>
                </div>
                <button
                  onClick={() => setShowScheduleModal(true)}
                  className="px-6 py-3 bg-[#ef7f1a] text-white rounded-xl font-bold text-xs flex items-center gap-2 soft-card-shadow hover:translate-y-[-1px] transition-all"
                >
                  <Plus size={16} /> Schedule Session
                </button>
              </div>

              <div className="bg-white rounded-[32px] soft-card-shadow border border-slate-50 p-10 space-y-6">
                {sessions.length > 0 ? sessions.map(session => {
                  const { month, day, time } = formatSessionDate(session.scheduled_datetime);
                  return (
                    <div key={session.session_id} className="flex items-center gap-6 p-6 rounded-2xl bg-[#fafbfc] border border-slate-50 hover:bg-white hover:border-slate-100 transition-all group">
                      <div className="w-14 h-14 rounded-xl bg-white border border-slate-100 flex flex-col items-center justify-center text-center shadow-sm">
                        <span className="text-[10px] font-bold text-[#ef7f1a] uppercase leading-none">{month}</span>
                        <span className="text-xl font-bold text-slate-900 leading-none mt-1">{day}</span>
                      </div>
                      <div className="flex-1">
                        <h5 className="font-bold text-slate-900 text-sm group-hover:text-[#ef7f1a] transition-colors">{session.topic}</h5>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">{time} • Video Conference</p>
                      </div>
                      <span className={`px-4 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider ${getStatusColor(session.status)}`}>
                        {session.status}
                      </span>
                    </div>
                  );
                }) : (
                  <div className="py-24 text-center">
                    <Calendar className="mx-auto text-slate-200 mb-6" size={64} strokeWidth={1} />
                    <h4 className="text-slate-900 font-bold mb-2">No Sessions Yet</h4>
                    <p className="text-slate-400 text-sm font-medium mb-8">Kick off your mentorship by scheduling your first 1-on-1.</p>
                    <button
                      onClick={() => setShowScheduleModal(true)}
                      className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs soft-card-shadow"
                    >
                      Find a Time
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'goals' && (
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-end justify-between">
                <div>
                  <h3 className="text-3xl font-bold text-slate-900 tracking-tight">Career Roadmap</h3>
                  <p className="text-slate-500 text-sm mt-1 font-medium">Track your professional development milestones</p>
                </div>
                <button className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs flex items-center gap-2 soft-card-shadow hover:translate-y-[-1px] transition-all">
                  <Plus size={16} /> New Goal
                </button>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {goals.length > 0 ? goals.map(goal => (
                  <div key={goal.goal_id} className="bg-white p-8 rounded-[32px] soft-card-shadow border border-slate-50 relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
                          <Target size={24} />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900">{goal.goal_title}</h4>
                          <p className="text-xs text-slate-400 font-medium">Due {new Date(goal.due_date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className={`px-4 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider ${getStatusColor(goal.status)}`}>
                        {goal.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed mb-8">{goal.goal_description}</p>
                    <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Clock size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Added {new Date(goal.start_date).toLocaleDateString()}</span>
                      </div>
                      <button className="text-[#ef7f1a] font-bold text-xs flex items-center gap-2 hover:gap-3 transition-all">
                        Update Progress <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )) : (
                  <div className="py-24 text-center bg-white rounded-[40px] border border-slate-50 soft-card-shadow">
                    <Target className="mx-auto text-slate-200 mb-6" size={64} strokeWidth={1} />
                    <h4 className="text-slate-900 font-bold mb-2">Build Your Roadmap</h4>
                    <p className="text-slate-400 text-sm font-medium mb-8">Define your professional milestones and track your growth journey.</p>
                    <button className="px-8 py-3 bg-[#ef7f1a] text-white rounded-xl font-bold text-xs soft-card-shadow">Set First Goal</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'network' && (
            <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <h3 className="text-3xl font-bold text-slate-900 tracking-tight">The Professional Network</h3>
                  <p className="text-slate-500 text-sm mt-1 font-medium">Explore available mentors and their expertise</p>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input type="text" placeholder="Search by skill..." className="pl-11 pr-6 py-3 bg-white border border-slate-100 rounded-xl text-xs font-medium outline-none" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {mentors.map(mentor => (
                  <div key={mentor.user_id} className="bg-white rounded-[32px] p-8 border border-slate-50 soft-card-shadow hover:translate-y-[-4px] transition-all group">
                    <div className="flex items-start justify-between mb-8">
                      <img src={mentor.avatar} alt={mentor.name} className="w-16 h-16 rounded-2xl shadow-sm object-cover border-2 border-slate-50" />
                    </div>
                    <h4 className="text-lg font-bold text-slate-900 mb-1">{mentor.name}</h4>
                    <p className="text-slate-500 text-xs font-medium mb-6 flex items-center gap-1.5">
                      <MapPin size={12} className="text-[#ef7f1a]" />
                      Corporate HQ, New York
                    </p>
                    <div className="flex flex-wrap gap-2 mb-8">
                      {mentor.skills?.slice(0, 3).map(skill => (
                        <span key={skill} className="px-2.5 py-1.5 bg-[#fafbfc] text-slate-500 text-[10px] font-bold uppercase rounded-lg border border-slate-50">{skill}</span>
                      ))}
                    </div>
                    <button className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition-all soft-card-shadow">View Career Profile</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'reporting' && currentUser.role === UserRole.MENTOR && (
            <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{getLabel('mentee')} Progress Report</h3>
                  <p className="text-slate-500 text-sm mt-1 font-medium">Tracking growth and milestones for your assigned {getLabel('mentee').toLowerCase()}s</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-10">
                {mentees.length > 0 ? mentees.map(mentee => {
                  const menteeGoals = goals.filter(g => g.mentee_id === mentee.user_id);
                  const completedGoals = menteeGoals.filter(g => g.status === GoalStatus.COMPLETED).length;
                  const progress = menteeGoals.length > 0 ? (completedGoals / menteeGoals.length) * 100 : 0;

                  return (
                    <div key={mentee.user_id} className="bg-white rounded-[40px] p-10 soft-card-shadow border border-slate-50">
                      <div className="flex flex-col md:flex-row gap-8 items-start mb-10">
                        <img src={mentee.avatar} alt={mentee.name} className="w-24 h-24 rounded-3xl object-cover ring-4 ring-slate-50" />
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-2xl font-bold text-slate-900">{mentee.name}</h4>
                            <span className="px-3 py-1 bg-[#ef7f1a]/5 text-[#ef7f1a] text-[10px] font-bold uppercase tracking-widest rounded-full">{mentee.mentorship_status}</span>
                          </div>
                          <p className="text-slate-500 font-medium mb-6">{mentee.email}</p>
                          <div className="flex gap-4">
                            <div className="px-6 py-3 bg-slate-50 rounded-2xl">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Goals Met</p>
                              <p className="text-lg font-bold text-slate-900">{completedGoals}/{menteeGoals.length}</p>
                            </div>
                            <div className="px-6 py-3 bg-slate-50 rounded-2xl">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Engagement</p>
                              <p className="text-lg font-bold text-slate-900">High</p>
                            </div>
                          </div>
                        </div>
                        <div className="w-full md:w-48">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 text-right">Program Progress</p>
                          <div className="h-3 bg-slate-50 rounded-full overflow-hidden mb-2">
                            <div className="h-full bg-[#ef7f1a] transition-all" style={{ width: `${progress}%` }}></div>
                          </div>
                          <p className="text-sm font-bold text-slate-900 text-right">{Math.round(progress)}%</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Active Roadmap</p>
                        {menteeGoals.map(goal => (
                          <div key={goal.goal_id} className="flex items-center justify-between p-5 bg-[#fafbfc] border border-slate-50 rounded-2xl">
                            <div>
                              <p className="font-bold text-slate-900 text-sm">{goal.goal_title}</p>
                              <p className="text-xs text-slate-400 font-medium mt-0.5">Due {new Date(goal.due_date).toLocaleDateString()}</p>
                            </div>
                            <span className={`px-4 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider ${getStatusColor(goal.status)}`}>
                              {goal.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }) : (
                  <div className="py-24 text-center bg-white rounded-[40px] border border-slate-50 soft-card-shadow">
                    <Users className="mx-auto text-slate-200 mb-6" size={64} strokeWidth={1} />
                    <h4 className="text-slate-900 font-bold mb-2">No {getLabel('mentee')}s Assigned</h4>
                    <p className="text-slate-400 text-sm font-medium">You will see progress reports here once {getLabel('mentee').toLowerCase()}s are assigned to you by HR.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {showScheduleModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] p-10 max-w-md w-full soft-card-shadow relative">
            <button onClick={() => setShowScheduleModal(false)} className="absolute top-8 right-8 p-2 text-slate-400 hover:text-slate-900 transition-colors"><X size={20} /></button>
            <h3 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">Schedule Session</h3>
            <p className="text-slate-500 font-medium text-sm mb-10">Coordinate your next mentorship meeting.</p>

            <form onSubmit={handleScheduleSession} className="space-y-6">
              {currentUser.role === UserRole.MENTOR && (
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Select {getLabel('mentee')}</label>
                  <select
                    required
                    className="w-full px-5 py-3.5 bg-[#fafbfc] border border-slate-100 rounded-2xl text-sm outline-none focus:border-[#ef7f1a]/30 transition-all"
                    value={newSessionData.menteeId}
                    onChange={e => setNewSessionData({ ...newSessionData, menteeId: e.target.value })}
                  >
                    <option value="">Choose a {getLabel('mentee').toLowerCase()}...</option>
                    {mentees.map(m => (
                      <option key={m.user_id} value={m.user_id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Topic</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Code Review, Career Pathing..."
                  className="w-full px-5 py-3.5 bg-[#fafbfc] border border-slate-100 rounded-2xl text-sm outline-none focus:border-[#ef7f1a]/30 transition-all"
                  value={newSessionData.topic}
                  onChange={e => setNewSessionData({ ...newSessionData, topic: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Date</label>
                  <input
                    type="date"
                    required
                    className="w-full px-5 py-3.5 bg-[#fafbfc] border border-slate-100 rounded-2xl text-sm outline-none focus:border-[#ef7f1a]/30 transition-all"
                    value={newSessionData.date}
                    onChange={e => setNewSessionData({ ...newSessionData, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Time</label>
                  <input
                    type="time"
                    required
                    className="w-full px-5 py-3.5 bg-[#fafbfc] border border-slate-100 rounded-2xl text-sm outline-none focus:border-[#ef7f1a]/30 transition-all"
                    value={newSessionData.time}
                    onChange={e => setNewSessionData({ ...newSessionData, time: e.target.value })}
                  />
                </div>
              </div>
              <button type="submit" className="w-full py-4 bg-[#ef7f1a] text-white rounded-2xl font-bold text-sm soft-card-shadow hover:translate-y-[-2px] transition-all">
                Confirm Schedule
              </button>
            </form>
          </div>
        </div>
      )}

      {showNotifications && (
        <div className="fixed inset-0 z-[200] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px]" onClick={() => setShowNotifications(false)}></div>
          <div className="relative w-full max-w-md bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-500">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Alerts</h3>
              <button onClick={() => setShowNotifications(false)} className="p-2 text-slate-400 hover:text-slate-900 transition-all"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-4 no-scrollbar">
              {notifications.map(n => (
                <div key={n.notification_id} className={`p-6 rounded-2xl border ${n.type === 'reminder' ? 'bg-[#ef7f1a]/5 border-[#ef7f1a]/10' : 'bg-[#fafbfc] border-slate-50'}`}>
                  <h5 className="font-bold text-slate-900 text-sm mb-1">{n.title}</h5>
                  <p className="text-xs font-medium text-slate-500 leading-relaxed">{n.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <TenantProvider>
      <AppContent />
    </TenantProvider>
  );
}
