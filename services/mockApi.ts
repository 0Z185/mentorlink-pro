
import { INITIAL_USERS, INITIAL_SESSIONS, INITIAL_GOALS, INITIAL_FEEDBACKS } from '../constants';
import { User, UserRole, Session, SessionStatus, Goal, GoalStatus, SessionFeedback, Notification, MentorshipStatus, Pilot, PilotEvaluationReport, Tenant, UserStatus } from '../types';
import { runAutoMatching, MatchRecommendation } from './matchingEngine';
import { governance, DEFAULT_RULES } from './governance';
import { pilotService } from './pilotService';

const STORAGE_KEY = 'mentorlink_mock_data';

interface PersistentData {
  users: User[];
  sessions: Session[];
  goals: Goal[];
  feedbacks: SessionFeedback[];
  notifications: Notification[];
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  type: 'Guide' | 'Video' | 'Template' | 'Article';
  url: string;
  roles: UserRole[];
}

class MockApiService {
  private users: User[] = [];
  private sessions: Session[] = [];
  private goals: Goal[] = [];
  private feedbacks: SessionFeedback[] = [];
  private notifications: Notification[] = [];

  private pilots: Pilot[] = [
    {
      pilot_id: 'pilot-1',
      tenant_id: 'tenant-1',
      name: 'Q4 Product Design Pilot',
      start_date: '2023-10-01',
      end_date: '2024-03-31',
      min_sessions_required: 6,
      duration_months: 6,
      status: 'Active',
      participant_ids: ['1', '2', '4', '5']
    }
  ];

  private resources: Resource[] = [
    { id: 'r1', title: 'Mentorship Kickoff Guide', description: 'Everything you need to know about starting your first session.', type: 'Guide', url: '#', roles: [UserRole.MENTOR, UserRole.MENTEE] },
    { id: 'r4', title: 'Goal Setting Framework (OKR)', description: 'Template for defining career objectives.', type: 'Template', url: '#', roles: [UserRole.MENTEE, UserRole.MENTOR] },
  ];

  constructor() {
    this.loadFromStorage();
    this.generateReminders();
    this.users.forEach(u => {
      if (['1', '2', '4', '5'].includes(u.user_id)) u.pilot_id = 'pilot-1';
    });
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data: PersistentData = JSON.parse(stored);
        this.users = data.users || INITIAL_USERS;
        this.sessions = data.sessions || INITIAL_SESSIONS;
        this.goals = data.goals || INITIAL_GOALS;
        this.feedbacks = data.feedbacks || INITIAL_FEEDBACKS;
        this.notifications = data.notifications || [];
      } else {
        this.users = INITIAL_USERS;
        this.sessions = INITIAL_SESSIONS;
        this.goals = INITIAL_GOALS;
        this.feedbacks = INITIAL_FEEDBACKS;
        this.notifications = [];
        this.saveToStorage();
      }
    } catch (e) {
      console.warn('Failed to load from storage, using initial users');
      this.users = INITIAL_USERS;
    }
  }

  private saveToStorage() {
    try {
      const data: PersistentData = {
        users: this.users,
        sessions: this.sessions,
        goals: this.goals,
        feedbacks: this.feedbacks,
        notifications: this.notifications
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save to storage');
    }
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
      tenant_id: 'tenant-1',
      user_id: userId,
      title,
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false
    });
    this.saveToStorage();
  }

  private sendEmail(to: string, subject: string, body: string, userId: string) {
    console.log(`%c[Simulated Email Sent] To: ${to}\nSubject: ${subject}\n\n${body}`, "color: #ef7f1a; font-weight: bold;");
    this.addNotification(userId, subject, body, 'info');
  }

  async login(email: string): Promise<User | null> {
    const user = this.users.find(u => u.email === email);
    if (user && user.status !== UserStatus.APPROVED) {
      throw new Error(`Account status: ${user.status}. Please wait for admin approval.`);
    }
    return user || null;
  }

  async getTenants(): Promise<Tenant[]> {
    return [
      {
        tenant_id: 'tenant-1',
        name: 'MentorLink',
        slug: 'mentorlink',
        config: {
          labels: { mentor: 'Mentor', mentee: 'Mentee', program_name: 'Mentorship Program' },
          rules: { max_mentees_per_mentor: 3, min_sessions_for_completion: 6, session_duration_minutes: 60, require_feedback: true },
          roles: {
            Mentor: { permissions: ['view_dashboard', 'schedule_sessions', 'view_reports'] },
            Mentee: { permissions: ['view_dashboard', 'edit_goals'] },
            hr_admin: { permissions: ['view_dashboard', 'manage_users', 'manage_settings', 'view_reports'] }
          }
        }
      }
    ];
  }

  async signUp(userData: Partial<User>, tenantId: string): Promise<User> {
    const newUser: User = {
      user_id: Math.random().toString(36).substr(2, 9),
      tenant_id: tenantId,
      name: userData.name || 'New User',
      email: userData.email || '',
      department: userData.department || 'Undesignated',
      role: userData.role || UserRole.MENTEE,
      status: UserStatus.PENDING,
      interests: userData.interests || [],
      availability_schedule: {},
      mentorship_status: MentorshipStatus.UNASSIGNED,
      cancellation_count: 0,
      avatar: userData.avatar
    };
    this.users.push(newUser);
    this.saveToStorage();

    // Notify HR Admins
    const hrAdmins = this.users.filter(u => u.role === UserRole.HR_ADMIN);
    hrAdmins.forEach(admin => {
      this.sendEmail(
        admin.email,
        'Action Required: New User Signup',
        `A new user, ${newUser.name} (${newUser.email}), from the ${newUser.department} department has signed up and is pending review.`,
        admin.user_id
      );
    });

    return newUser;
  }

  async getPendingUsers(): Promise<User[]> {
    return this.users.filter(u => u.status === UserStatus.PENDING);
  }

  async approveUser(userId: string): Promise<void> {
    const user = this.users.find(u => u.user_id === userId);
    if (!user) throw new Error("User not found");
    user.status = UserStatus.APPROVED;
    this.saveToStorage();

    this.sendEmail(
      user.email,
      'Welcome to MentorLink!',
      `Hi ${user.name}, your account access has been validated by HR. You can now access your dashboard and start your mentorship journey here: http://localhost:3000/`,
      userId
    );
  }

  async rejectUser(userId: string): Promise<void> {
    const user = this.users.find(u => u.user_id === userId);
    if (!user) throw new Error("User not found");
    user.status = UserStatus.REJECTED;
    this.saveToStorage();
  }

  async getMyMentees(mentorId: string): Promise<User[]> {
    return this.users.filter(u => u.assigned_mentor_id === mentorId);
  }

  async getMenteesGoals(mentorId: string): Promise<Goal[]> {
    const mentees = await this.getMyMentees(mentorId);
    const menteeIds = mentees.map(m => m.user_id);
    return this.goals.filter(g => menteeIds.includes(g.mentee_id));
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
    if (requestingUser.role !== UserRole.HR_ADMIN) throw new Error("Unauthorized");
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
        maxCapacity: DEFAULT_RULES.max_mentees_per_mentor,
        minSessions: DEFAULT_RULES.min_sessions_for_completion
      }
    };
  }

  async getAdminPairList(requestingUser: User) {
    if (requestingUser.role !== UserRole.HR_ADMIN) throw new Error("Unauthorized");
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
    if (requestingUser.role !== UserRole.HR_ADMIN) throw new Error("Unauthorized");
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
      tenant_id: 'tenant-1',
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
    if (user?.role === UserRole.HR_ADMIN) return this.sessions;
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
