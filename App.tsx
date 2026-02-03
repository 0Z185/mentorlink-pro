
import React, { useState, useEffect } from 'react';
import { User, UserRole, Session, Goal, GoalStatus, SessionStatus, Notification, SessionFeedback, MentorshipStatus, Pilot, PilotEvaluationReport, PilotOutcome } from './types';
import { api, Resource } from './services/supabaseService';
import {
  Users, Calendar, Target, LogOut, ChevronRight, Plus, CheckCircle2,
  Clock, Search, X, Bell, Zap, CalendarCheck2,
  Sparkles, MapPin, Award, BarChart3,
  Settings, Menu
} from 'lucide-react';
import AdminDashboard from './pages/admin/AdminDashboard';
import PeopleDirectory from './pages/admin/PeopleDirectory';
import MentorDashboard from './pages/mentor/MentorDashboard';
import MenteeDashboard from './pages/mentee/MenteeDashboard';
import AppLayout from './components/layout/AppLayout';
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
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
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
        const [stats, pairs, allPilots, pending, users] = await Promise.all([
          api.getGlobalAnalytics(currentUser),
          api.getAdminPairList(currentUser),
          api.getPilots(),
          api.getPendingUsers(),
          api.getUsers()
        ]);
        setAnalytics(stats);
        setPairList(pairs);
        setPilots(allPilots);
        setPendingUsers(pending);
        setAllUsers(users);
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
    setError(null);
    try {
      const u = await api.login(email);
      if (u) {
        setCurrentUser(u);
        setActiveTab('dashboard');
      } else {
        setError("User not found. Please sign up.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    setActiveTab('dashboard');
    setError(null);
  };


  if (tenantLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600">Loading workspace...</div>;
  }

  if (!currentUser) {
    return (
      <Login
        tenantName={tenant?.name}
        onLogin={handleLogin}
        onSignup={async (data) => {
          setLoading(true);
          setError(null);
          try {
            const interestsArray = data.interests.split(',').map(s => s.trim()).filter(Boolean);
            await api.signUp({
              name: data.name,
              email: data.email,
              role: data.role,
              department: data.department,
              interests: interestsArray,
              avatar: `https://picsum.photos/seed/${data.name.replace(/\s+/g, '')}/200`
            }, tenant?.tenant_id || '');
          } catch (err: any) {
            setError(err.message);
            throw err; // Re-throw to let Login know it failed
          } finally {
            setLoading(false);
          }
        }}
        error={error}
        loading={loading}
      />
    );
  }

  // Use the new AppLayout for all authenticated users
  return (
    <AppLayout
      role={currentUser.role === UserRole.HR_ADMIN ? 'admin' : currentUser.role === UserRole.MENTOR ? 'mentor' : 'mentee'}
      activeTab={activeTab}
      onTabChange={(tab) => setActiveTab(tab as any)}
      onSignOut={handleSignOut}
    >
      {currentUser.role === UserRole.HR_ADMIN && (
        <>
          {activeTab === 'dashboard' && (
            <AdminDashboard
              pendingUsers={pendingUsers}
              onApprove={async (id) => {
                await api.approveUser(id);
                loadUserData();
              }}
              onReject={async (id) => {
                await api.rejectUser(id);
                loadUserData();
              }}
            />
          )}
          {activeTab === 'programs' && <div className="p-8"><h2 className="text-2xl font-bold text-slate-900">Programs Management</h2><p className="text-slate-600 mt-2">Manage mentorship cohorts here.</p></div>}
          {activeTab === 'people' && (
            <PeopleDirectory
              users={allUsers}
              onApprove={async (id) => {
                await api.approveUser(id);
                loadUserData();
              }}
              onReject={async (id) => {
                await api.rejectUser(id);
                loadUserData();
              }}
            />
          )}
          {activeTab === 'reports' && <div className="p-8"><h2 className="text-2xl font-bold text-slate-900">Reports & Analytics</h2><p className="text-slate-600 mt-2">System-wide performance metrics.</p></div>}
          {activeTab === 'settings' && <div className="p-8"><h2 className="text-2xl font-bold text-slate-900">Settings</h2><p className="text-slate-600 mt-2">Configure tenant preferences.</p></div>}
        </>
      )}
      {currentUser.role === UserRole.MENTOR && <MentorDashboard />}
      {currentUser.role === UserRole.MENTEE && <MenteeDashboard />}

      {/* Keep Notifications purely for display if used by AppLayout or global state, 
          but for now we hide the old notification modal logic as it clashes with the clean layout.
          Ideally, notifications should be moved to a context or sidebar. 
      */}
      {showNotifications && (
        <div className="fixed inset-0 z-[200] flex justify-end">
          <div className="absolute inset-0 bg-brand-blue-900/20 backdrop-blur-[2px]" onClick={() => setShowNotifications(false)}></div>
          <div className="relative w-full max-w-md bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-500">
            <div className="p-6 border-b border-brand-blue-50 flex items-center justify-between">
              <h3 className="text-lg font-medium text-brand-blue-900">Notifications</h3>
              <button onClick={() => setShowNotifications(false)}><X size={20} className="text-slate-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              {notifications.map(n => (
                <div key={n.notification_id} className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-800">{n.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};


export default function App() {
  return (
    <TenantProvider>
      <AppContent />
    </TenantProvider>
  );
}
