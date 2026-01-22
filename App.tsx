
import React, { useState, useEffect } from 'react';
import { User, UserRole, Session, Goal, GoalStatus, SessionStatus, Notification, SessionFeedback, MentorshipStatus, Pilot, PilotEvaluationReport, PilotOutcome } from './types';
import { api, Resource } from './services/mockApi';
import { MatchRecommendation } from './services/matchingEngine';
import { PROGRAM_RULES } from './services/governance';
import { 
  Users, UserPlus, Calendar, Target, MessageSquare, LogOut, ChevronRight, Plus, CheckCircle2, 
  Clock, Search, Star, X, Bell, ExternalLink, Cpu, Zap, CalendarCheck2, History, 
  LayoutDashboard, BarChart3, AlertTriangle, Filter, ChevronDown, BookOpen, Video, FileText, Link, MoreVertical,
  TrendingUp, Sparkles, MapPin, Award, Rocket, ClipboardCheck, BarChart, Download, Github
} from 'lucide-react';
import JSZip from 'jszip';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'network' | 'calendar' | 'goals' | 'resources' | 'admin' | 'pilot'>('dashboard');
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
  const [exporting, setExporting] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState<{menteeId: string, menteeName: string} | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newSessionData, setNewSessionData] = useState({ topic: '', date: '', time: '' });

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

      if (currentUser.role === UserRole.ADMIN) {
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

  const handleExportProject = async () => {
    setExporting(true);
    try {
      const zip = new JSZip();
      
      // File paths and content would normally come from a manifest, 
      // but here we are preparing for a GitHub push by bundling the source.
      // Since this is a browser environment, we simulate the structure.
      
      const filePaths = [
        'index.html', 'App.tsx', 'types.ts', 'constants.ts', 'metadata.json',
        'services/mockApi.ts', 'services/matchingEngine.ts', 
        'services/governance.ts', 'services/pilotService.ts',
        'README.md', '.gitignore', 'database_schema.sql'
      ];

      // In this specialized environment, we fetch the current files 
      // This is a high-level representation of the "Export" logic
      for (const path of filePaths) {
        try {
          const response = await fetch(`./${path}`);
          if (response.ok) {
            const content = await response.text();
            zip.file(path, content);
          }
        } catch (e) {
          console.warn(`Could not include ${path} in zip.`);
        }
      }

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'mentorlink-pro-repository.zip';
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed", err);
    } finally {
      setExporting(false);
    }
  };

  const handleScheduleSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    let targetUserId = '';
    if (currentUser.role === UserRole.MENTEE && currentUser.assigned_mentor_id) {
      targetUserId = currentUser.assigned_mentor_id;
    } else if (currentUser.role === UserRole.MENTOR) {
      const firstMentee = mentees.find(m => m.assigned_mentor_id === currentUser.user_id);
      if (firstMentee) targetUserId = firstMentee.user_id;
    }

    if (!targetUserId) {
      setError("You must have an assigned partner to schedule a session.");
      return;
    }

    try {
      const isoDatetime = new Date(`${newSessionData.date}T${newSessionData.time}`).toISOString();
      await api.createSession(currentUser, targetUserId, isoDatetime, newSessionData.topic);
      setShowScheduleModal(false);
      setNewSessionData({ topic: '', date: '', time: '' });
      loadUserData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEvaluatePilot = async (pilotId: string) => {
    setLoading(true);
    try {
      const report = await api.getPilotReport(pilotId);
      setSelectedPilotReport(report);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafbfc] p-8">
        <div className="bg-white p-12 rounded-[40px] soft-card-shadow max-w-md w-full text-center animate-in fade-in zoom-in duration-700">
          <div className="inline-block p-5 bg-[#ef7f1a]/5 text-[#ef7f1a] rounded-3xl mb-8">
            <Users size={48} strokeWidth={2} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-3">MentorLink Pro</h1>
          <p className="text-slate-500 mb-12 text-sm font-medium">Professional growth, simplified.</p>
          <div className="space-y-3">
            {[
              { email: 'alex.r@mentee.com', role: 'Mentee' },
              { email: 'sarah.c@mentor.com', role: 'Mentor' },
              { email: 'admin@mentorlink.com', role: 'Admin' }
            ].map((user) => (
              <button 
                key={user.email}
                onClick={() => api.login(user.email).then(u => u && setCurrentUser(u))}
                className="w-full flex items-center justify-between p-5 bg-white border border-slate-100 rounded-2xl hover:border-[#ef7f1a]/30 hover:bg-slate-50 transition-all group"
              >
                <div className="text-left">
                  <p className="font-semibold text-slate-900 text-sm">{user.email.split('@')[0].replace('.', ' ')}</p>
                  <p className="text-[10px] font-bold uppercase text-[#ef7f1a] tracking-wider">{user.role}</p>
                </div>
                <ChevronRight size={18} className="text-slate-300 group-hover:text-[#ef7f1a] transition-colors" />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafbfc] flex flex-col md:flex-row h-screen overflow-hidden">
      <aside className="w-full md:w-72 bg-white flex flex-col border-r border-slate-100 z-20">
        <div className="px-8 py-10 flex items-center gap-4">
          <div className="bg-[#ef7f1a] p-2.5 rounded-xl text-white">
            <Users size={24} strokeWidth={2.5} />
          </div>
          <span className="font-bold text-xl text-slate-900 tracking-tight">MentorLink</span>
        </div>
        <nav className="flex-1 px-4 py-2 space-y-1.5 overflow-y-auto no-scrollbar">
          {[
            { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
            { id: 'calendar', label: 'Schedule', icon: Calendar },
            { id: 'goals', label: 'Roadmap', icon: Target },
            { id: 'network', label: 'Network', icon: Search },
            ...(currentUser.role === UserRole.ADMIN ? [
              { id: 'admin', label: 'Analytics', icon: BarChart3 },
              { id: 'pilot', label: 'Pilot Hub', icon: Rocket }
            ] : []),
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-200 text-sm font-medium ${
                activeTab === item.id 
                  ? 'bg-slate-900 text-white soft-card-shadow' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <item.icon size={18} strokeWidth={activeTab === item.id ? 2.5 : 2} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        
        {/* GitHub Export Section */}
        <div className="p-6 border-t border-slate-50 space-y-3">
          <button 
            onClick={handleExportProject}
            disabled={exporting}
            className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl text-indigo-600 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 transition-all text-sm font-bold group ${exporting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {exporting ? <Cpu className="animate-spin" size={18} /> : <Github size={18} />}
            {exporting ? 'Preparing...' : 'Export to GitHub'}
          </button>
          <button onClick={() => setCurrentUser(null)} className="w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all text-sm font-medium group">
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-10 shrink-0 z-10">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight capitalize">{activeTab.replace('-', ' ')}</h2>
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

        <main className="flex-1 overflow-y-auto p-10 bg-[#fafbfc] no-scrollbar">
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
                      <h3 className="text-3xl font-bold text-slate-900 tracking-tight">Mentorship Schedule</h3>
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

          {activeTab === 'pilot' && (
            <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-end justify-between">
                <div>
                  <h3 className="text-3xl font-bold text-slate-900 tracking-tight">Pilot Program Management</h3>
                  <p className="text-slate-500 text-sm mt-1 font-medium">Define cohorts, success criteria, and evaluate outcomes</p>
                </div>
                <button className="px-5 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs flex items-center gap-2 soft-card-shadow hover:translate-y-[-1px] transition-all">
                  <Plus size={16} /> New Pilot Cohort
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  {pilots.map(p => (
                    <div key={p.pilot_id} className="bg-white rounded-[32px] p-8 soft-card-shadow border border-slate-50">
                      <div className="flex justify-between items-start mb-8">
                        <div>
                          <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-indigo-100/50 mb-3 inline-block">Pilot Cohort</span>
                          <h4 className="text-xl font-bold text-slate-900">{p.name}</h4>
                          <p className="text-xs text-slate-400 font-medium mt-1">Status: {p.status} • {p.participant_ids.length} Participants</p>
                        </div>
                        <button 
                          onClick={() => handleEvaluatePilot(p.pilot_id)}
                          className="px-6 py-2.5 bg-slate-50 text-slate-900 rounded-xl text-xs font-bold border border-slate-100 hover:bg-slate-100 transition-all flex items-center gap-2"
                        >
                          <ClipboardCheck size={16} /> Run Evaluation
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-6 mb-8">
                        <div className="p-5 bg-[#fafbfc] rounded-2xl border border-slate-50">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Target Sessions</p>
                          <p className="text-lg font-bold text-slate-900">{p.min_sessions_required}</p>
                        </div>
                        <div className="p-5 bg-[#fafbfc] rounded-2xl border border-slate-50">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Cycle Duration</p>
                          <p className="text-lg font-bold text-slate-900">{p.duration_months} Months</p>
                        </div>
                        <div className="p-5 bg-[#fafbfc] rounded-2xl border border-slate-50">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ending On</p>
                          <p className="text-lg font-bold text-slate-900">{new Date(p.end_date).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {selectedPilotReport && (
                    <div className="bg-white rounded-[32px] soft-card-shadow border border-slate-50 overflow-hidden animate-in fade-in zoom-in duration-500">
                      <div className="p-8 border-b border-slate-50 bg-[#fafbfc] flex items-center justify-between">
                        <h4 className="font-bold text-slate-900">Cohort Outcome: {selectedPilotReport.pilot_name}</h4>
                        <div className="flex gap-4">
                          <div className="text-right">
                             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Success Rate</p>
                             <p className="text-sm font-bold text-emerald-500">{selectedPilotReport.success_rate.toFixed(1)}%</p>
                          </div>
                          <div className="text-right border-l border-slate-200 pl-4">
                             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Avg Engagement</p>
                             <p className="text-sm font-bold text-indigo-500">{selectedPilotReport.avg_engagement.toFixed(1)}/100</p>
                          </div>
                        </div>
                      </div>
                      <table className="w-full text-left">
                        <thead>
                          <tr className="text-[10px] font-bold uppercase text-slate-400 tracking-widest border-b border-slate-50">
                            <th className="py-4 px-8">Participant</th>
                            <th className="py-4 px-6">Outcome</th>
                            <th className="py-4 px-6 text-right">Engagement</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {selectedPilotReport.individual_outcomes.map((o, idx) => (
                            <tr key={idx}>
                              <td className="py-6 px-8">
                                <p className="text-sm font-bold text-slate-900">{o.user_name}</p>
                                <p className="text-[10px] text-slate-400 font-medium">{o.role}</p>
                              </td>
                              <td className="py-6 px-6">
                                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider ${getStatusColor(o.outcome)}`}>
                                  {o.outcome}
                                </span>
                              </td>
                              <td className="py-6 px-6 text-right">
                                <span className="text-xs font-bold text-slate-900">{o.score}%</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="space-y-8">
                  <div className="bg-white p-8 rounded-[32px] soft-card-shadow border border-slate-50">
                    <h4 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
                      <ClipboardCheck size={16} className="text-indigo-500" /> Success Criteria
                    </h4>
                    <div className="space-y-5">
                      {[
                        { label: 'Mentee Sessions', val: '≥ 6 Completed', desc: 'Weighted: 40%', icon: CalendarCheck2 },
                        { label: 'Goal Velocity', val: '≥ 50% Success', desc: 'Weighted: 30%', icon: Target },
                        { label: 'Sentiment', val: '≥ 4.0 Rating', desc: 'Weighted: 30%', icon: Star },
                      ].map((c, i) => (
                        <div key={i} className="flex items-start gap-4">
                          <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 shrink-0"><c.icon size={16}/></div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">{c.label}</p>
                            <p className="text-[10px] font-bold text-[#ef7f1a] uppercase">{c.val}</p>
                            <p className="text-[9px] text-slate-400 mt-0.5">{c.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
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

          {activeTab === 'admin' && analytics && (
            <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-500">
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'Active Pairs', val: analytics.overview.activePairs, icon: Users, color: 'bg-emerald-50 text-emerald-500' },
                    { label: 'Success Rate', val: `${analytics.overview.completionRate}%`, icon: Zap, color: 'bg-amber-50 text-amber-500' },
                    { label: 'Total Members', val: analytics.overview.totalMentors + analytics.overview.totalMentees, icon: Award, color: 'bg-sky-50 text-sky-500' },
                    { label: 'Network Load', val: 'Healthy', icon: Cpu, color: 'bg-indigo-50 text-indigo-500' },
                  ].map((m, i) => (
                    <div key={i} className="bg-white p-8 rounded-3xl border border-slate-50 soft-card-shadow">
                       <div className={`w-10 h-10 rounded-xl ${m.color} flex items-center justify-center mb-6`}>
                          <m.icon size={20} />
                       </div>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{m.label}</p>
                       <p className="text-2xl font-bold text-slate-900">{m.val}</p>
                    </div>
                  ))}
               </div>
            </div>
          )}
        </main>
      </div>

      {showScheduleModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white rounded-[32px] p-10 max-md w-full soft-card-shadow relative">
              <button onClick={() => setShowScheduleModal(false)} className="absolute top-8 right-8 p-2 text-slate-400 hover:text-slate-900 transition-colors"><X size={20} /></button>
              <h3 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">Schedule Session</h3>
              <p className="text-slate-500 font-medium text-sm mb-10">Coordinate your next mentorship meeting.</p>
              
              <form onSubmit={handleScheduleSession} className="space-y-6">
                <div>
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Topic</label>
                   <input 
                    type="text" 
                    required 
                    placeholder="e.g. Code Review, Career Pathing..."
                    className="w-full px-5 py-3.5 bg-[#fafbfc] border border-slate-100 rounded-2xl text-sm outline-none focus:border-[#ef7f1a]/30 transition-all"
                    value={newSessionData.topic}
                    onChange={e => setNewSessionData({...newSessionData, topic: e.target.value})}
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
                      onChange={e => setNewSessionData({...newSessionData, date: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Time</label>
                    <input 
                      type="time" 
                      required 
                      className="w-full px-5 py-3.5 bg-[#fafbfc] border border-slate-100 rounded-2xl text-sm outline-none focus:border-[#ef7f1a]/30 transition-all"
                      value={newSessionData.time}
                      onChange={e => setNewSessionData({...newSessionData, time: e.target.value})}
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

export default App;
