
import { INITIAL_USERS } from '../constants';
import { User, UserRole, Session, SessionStatus, Goal, GoalStatus, SessionFeedback, Notification, MentorshipStatus, Pilot, PilotEvaluationReport } from '../types';
import { runAutoMatching, MatchRecommendation } from './matchingEngine';
import { governance, PROGRAM_RULES } from './governance';
import { pilotService } from './pilotService';

export interface Resource {
  id: string;
  title: string;
  description: string;
  type: 'Guide' | 'Video' | 'Template' | 'Article';
  url: string;
  roles: UserRole[];
}

class MockApiService {
  private users: User[] = INITIAL_USERS;
  private pilots: Pilot[] = [
    {
      pilot_id: 'pilot-1',
      name: 'Q4 Product Design Pilot',
      start_date: '2023-10-01',
      end_date: '2024-03-31',
      min_sessions_required: 6,
      duration_months: 6,
      status: 'Active',
      participant_ids: ['1', '2', '4', '5']
    }
  ];
  private sessions: Session[] = [
    {
      session_id: 's1',
      mentor_id: '1',
      mentee_id: '2',
      scheduled_datetime: new Date(Date.now() - 172800000).toISOString(),
      topic: 'Career Roadmap & Goal Setting',
      status: SessionStatus.COMPLETED,
      session_notes: 'Initial meeting to discuss 2024 objectives.'
    },
    {
      session_id: 's2',
      mentor_id: '1',
      mentee_id: '2',
      scheduled_datetime: new Date(Date.now() + 86400000 * 3).toISOString(), // 3 days in future
      topic: 'Technical Skills Deep Dive: System Design',
      status: SessionStatus.SCHEDULED
    }
  ];
  
  private goals: Goal[] = [];
  private feedbacks: SessionFeedback[] = [
    { feedback_id: 'f1', session_id: 's1', from_user_id: '2', to_user_id: '1', rating: 5, comments: 'Excellent guidance!' }
  ];
  private resources: Resource[] = [
    { id: 'r1', title: 'Mentorship Kickoff Guide', description: 'Everything you need to know about starting your first session.', type: 'Guide', url: '#', roles: [UserRole.MENTOR, UserRole.MENTEE] },
    { id: 'r4', title: 'Goal Setting Framework (OKR)', description: 'Template for defining career objectives.', type: 'Template', url: '#', roles: [UserRole.MENTEE, UserRole.MENTOR] },
  ];

  private notifications: Notification[] = [];

  constructor() {
    this.generateReminders();
    this.users.forEach(u => {
      if (['1', '2', '4', '5'].includes(u.user_id)) u.pilot_id = 'pilot-1';
    });
  }

  private generateReminders() {
    const now = new Date();
    this.sessions.forEach(s => {
      const sessionDate = new Date(s.scheduled_datetime);
      const diffHours = (sessionDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      if (diffHours > 0 && diffHours <= 24 && s.status === SessionStatus.SCHEDULED) {
        this.addNotification(s.mentor_id, 'Upcoming Session Reminder', `Session in ${Math.round(diffHours)}h`, 'reminder');
        this.addNotification(s.mentee_id, 'Upcoming Session Reminder', `Session in ${Math.round(diffHours)}h`, 'reminder');
      }
    });
  }

  private addNotification(userId: string, title: string, message: string, type: 'info' | 'reminder' | 'alert' = 'info') {
    this.notifications.unshift({
      notification_id: Math.random().toString(36).substr(2, 9),
      user_id: userId,
      title,
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false
    });
  }

  async login(email: string): Promise<User | null> {
    return this.users.find(u => u.email === email) || null;
  }

  async getPilots(): Promise<Pilot[]> {
    return this.pilots;
  }

  async getPilotReport(pilotId: string): Promise<PilotEvaluationReport> {
    const pilot = this.pilots.find(p => p.pilot_id === pilotId);
    if (!pilot) throw new Error("Pilot not found");
    return pilotService.generateReport(pilot, this.users, this.sessions, this.goals, this.feedbacks);
  }

  async getGlobalAnalytics(requestingUser: User) {
    if (requestingUser.role !== UserRole.ADMIN) throw new Error("Unauthorized");
    const mentors = this.users.filter(u => u.role === UserRole.MENTOR);
    const mentees = this.users.filter(u => u.role === UserRole.MENTEE);
    const activePairs = mentees.filter(m => m.assigned_mentor_id).length;
    
    return {
      overview: {
        totalMentors: mentors.length,
        totalMentees: mentees.length,
        activePairs,
        totalSessions: this.sessions.length,
        completionRate: 85,
      },
      engagement: {
        avgMentorRating: 4.8,
        responseRate: 92,
      },
      goals: {
        total: 12,
        completed: 4,
        successRate: 33
      },
      governance: {
        maxCapacity: PROGRAM_RULES.MAX_MENTEES_PER_MENTOR,
        minSessions: PROGRAM_RULES.MIN_SESSIONS_FOR_COMPLETION
      }
    };
  }

  async getAdminPairList(requestingUser: User) {
    if (requestingUser.role !== UserRole.ADMIN) throw new Error("Unauthorized");
    const mentees = this.users.filter(u => u.role === UserRole.MENTEE);

    return mentees.map(mentee => {
      const mentor = this.users.find(u => u.user_id === mentee.assigned_mentor_id);
      const insights = mentor ? governance.evaluateMentorship(mentee, mentor, this.sessions) : null;
      
      return {
        mentee_id: mentee.user_id,
        mentee_name: mentee.name,
        mentor_name: mentor?.name || 'Unassigned',
        status: mentee.mentorship_status,
        progress: insights?.progressPercent || 0,
        flags: insights?.healthFlags || [],
        canGraduate: insights?.canGraduate || false
      };
    });
  }

  async assignMentor(requestingUser: User, menteeId: string, mentorId: string): Promise<void> {
    if (requestingUser.role !== UserRole.ADMIN) throw new Error("Unauthorized");
    const mentor = this.users.find(u => u.user_id === mentorId);
    const mentee = this.users.find(u => u.user_id === menteeId);
    if (!mentor || !mentee) throw new Error("User not found");
    const validation = governance.validateAssignment(mentor, mentee, this.users.filter(u => u.role === UserRole.MENTEE));
    if (!validation.valid) throw new Error(validation.error);
    mentee.assigned_mentor_id = mentorId;
    mentee.mentorship_status = MentorshipStatus.ACTIVE;
    mentee.mentorship_start_date = new Date().toISOString();
    this.addNotification(menteeId, 'Program Update', `You have been paired with ${mentor.name}.`, 'info');
  }

  async createSession(creator: User, targetUserId: string, datetime: string, topic: string): Promise<Session> {
    const newSession: Session = {
      session_id: Math.random().toString(36).substr(2, 9),
      mentor_id: creator.role === UserRole.MENTOR ? creator.user_id : targetUserId,
      mentee_id: creator.role === UserRole.MENTEE ? creator.user_id : targetUserId,
      scheduled_datetime: datetime,
      topic,
      status: SessionStatus.SCHEDULED
    };
    this.sessions.push(newSession);
    this.addNotification(targetUserId, 'New Session Scheduled', `${creator.name} has scheduled a session: ${topic}`, 'reminder');
    return newSession;
  }

  async getUsers(role?: UserRole): Promise<User[]> {
    return role ? this.users.filter(u => u.role === role) : this.users;
  }

  async getResources(role: UserRole): Promise<Resource[]> {
    return this.resources.filter(r => r.roles.includes(role));
  }

  async getGoals(userId: string): Promise<Goal[]> {
    return this.goals.filter(g => g.mentee_id === userId);
  }

  async getSessions(userId: string): Promise<Session[]> {
    const user = this.users.find(u => u.user_id === userId);
    if (user?.role === UserRole.ADMIN) return this.sessions;
    return this.sessions.filter(s => s.mentor_id === userId || s.mentee_id === userId);
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    return this.notifications.filter(n => n.user_id === userId);
  }

  async getFeedbackForUser(userId: string): Promise<SessionFeedback[]> {
    return this.feedbacks.filter(f => f.to_user_id === userId);
  }

  async getRecommendedMatches(requestingUser: User): Promise<MatchRecommendation[]> {
    const mentors = await this.getUsers(UserRole.MENTOR);
    const mentees = await this.getUsers(UserRole.MENTEE);
    return runAutoMatching(mentors, mentees);
  }
}

export const api = new MockApiService();
