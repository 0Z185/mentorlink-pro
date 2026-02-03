
import { supabase } from './supabaseClient';
import { User, UserRole, Session, SessionStatus, Goal, GoalStatus, SessionFeedback, Notification, MentorshipStatus, Pilot, PilotEvaluationReport, Tenant } from '../types';
import { runAutoMatching, MatchRecommendation } from './matchingEngine';
import { governance, DEFAULT_RULES } from './governance';
import { pilotService } from './pilotService';

export interface Resource {
    resource_id: string;
    title: string;
    description: string;
    type: 'Guide' | 'Video' | 'Template' | 'Article';
    url: string;
    roles: string[]; // Changed to string[] to handle DB array format
}

export interface AuditLog {
    log_id: string;
    acting_user_id: string;
    acting_user_name?: string;
    action: string;
    target_user_id?: string;
    target_user_name?: string;
    details: any;
    created_at: string;
}

class SupabaseService {
    async getTenants(): Promise<Tenant[]> {
        const { data, error } = await supabase.from('tenants').select('*');
        if (error) {
            console.error('Error fetching tenants:', error);
            return [];
        }
        return data || [];
    }

    private async sendEmail(to: string, subject: string, body: string, userId: string, tenantId: string) {
        console.log(`%c[Supabase Simulated Email Sent] To: ${to}\nSubject: ${subject}\n\n${body}`, "color: #ef7f1a; font-weight: bold;");
        await this.addNotification(userId, subject, body, 'info', tenantId);
    }

    async login(email: string): Promise<User | null> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error) {
            console.error('Login error:', error);
            return null;
        }

        if (data && data.status !== 'Approved') {
            throw new Error(`Account status: ${data.status}. Please wait for admin approval.`);
        }

        return data;
    }

    async signUp(userData: Partial<User>, tenantId: string): Promise<User> {
        const { data: newUser, error } = await supabase
            .from('users')
            .insert([{
                ...userData,
                tenant_id: tenantId,
                status: 'Pending',
                mentorship_status: MentorshipStatus.UNASSIGNED,
                cancellation_count: 0
            }])
            .select()
            .single();

        if (error) throw error;

        // Notify HR Admins
        const hrAdmins = await this.getUsers(UserRole.HR_ADMIN, tenantId);
        for (const admin of hrAdmins) {
            await this.sendEmail(
                admin.email,
                'Action Required: New User Signup',
                `A new user, ${newUser.name} (${newUser.email}), from the ${newUser.department} department has signed up and is pending review.`,
                admin.user_id,
                tenantId
            );
        }

        return newUser;
    }

    async getMyMentees(mentorId: string): Promise<User[]> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('assigned_mentor_id', mentorId);

        if (error) {
            console.error('Error fetching my mentees:', error);
            return [];
        }
        return data || [];
    }

    async getMenteesGoals(mentorId: string): Promise<Goal[]> {
        const mentees = await this.getMyMentees(mentorId);
        const menteeIds = mentees.map(m => m.user_id);

        if (menteeIds.length === 0) return [];

        const { data, error } = await supabase
            .from('mentee_goals')
            .select('*')
            .in('mentee_id', menteeIds);

        if (error) {
            console.error('Error fetching mentees goals:', error);
            return [];
        }
        return data || [];
    }

    async getUsers(role?: UserRole, tenantId?: string): Promise<User[]> {
        let query = supabase.from('users').select('*');
        if (role) {
            query = query.eq('role', role);
        }
        if (tenantId) {
            query = query.eq('tenant_id', tenantId);
        }
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) {
            console.error('Error fetching users:', error);
            return [];
        }
        return data || [];
    }

    async getPendingUsers(): Promise<User[]> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('status', 'Pending');

        if (error) {
            console.error('Error fetching pending users:', error);
            return [];
        }
        return data || [];
    }

    async approveUser(userId: string): Promise<void> {
        const { data: user, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (fetchError || !user) throw new Error("User not found");

        const { error } = await supabase
            .from('users')
            .update({ status: 'Approved' })
            .eq('user_id', userId);

        if (error) throw error;

        await this.sendEmail(
            user.email,
            'Welcome to MentorLink!',
            `Hi ${user.name}, your account access has been validated by HR. You can now access your dashboard and start your mentorship journey here: http://localhost:3000/`,
            userId,
            user.tenant_id
        );
    }

    async rejectUser(userId: string): Promise<void> {
        const { error } = await supabase
            .from('users')
            .update({ status: 'Rejected' })
            .eq('user_id', userId);

        if (error) throw error;
    }

    async getPilots(): Promise<Pilot[]> {
        const { data, error } = await supabase.from('pilots').select('*');
        if (error) {
            console.error('Error fetching pilots:', error);
            return [];
        }
        return data || [];
    }

    async getPilotReport(pilotId: string): Promise<PilotEvaluationReport> {
        const { data: pilot, error: pError } = await supabase
            .from('pilots')
            .select('*')
            .eq('pilot_id', pilotId)
            .single();

        if (pError || !pilot) throw new Error("Pilot not found");

        const [users, sessions, goals, feedbacks] = await Promise.all([
            this.getUsers(),
            this.getAllSessions(),
            this.getAllGoals(),
            this.getAllFeedback()
        ]);

        return pilotService.generateReport(pilot, users, sessions, goals, feedbacks);
    }

    // Helper methods for report generation
    private async getAllSessions(): Promise<Session[]> {
        const { data } = await supabase.from('mentorship_sessions').select('*');
        return data || [];
    }
    private async getAllGoals(): Promise<Goal[]> {
        const { data } = await supabase.from('mentee_goals').select('*');
        return data || [];
    }
    private async getAllFeedback(): Promise<SessionFeedback[]> {
        const { data } = await supabase.from('session_feedback').select('*');
        return data || [];
    }

    async getGlobalAnalytics(requestingUser: User) {
        if (requestingUser.role !== UserRole.HR_ADMIN) throw new Error("Unauthorized");

        const users = await this.getUsers();
        const sessions = await this.getAllSessions();
        const feedbacks = await this.getAllFeedback();

        const mentors = users.filter(u => u.role === UserRole.MENTOR);
        const mentees = users.filter(u => u.role === UserRole.MENTEE);
        const activePairs = mentees.filter(m => m.assigned_mentor_id).length;

        // Simplified rating calculation
        const avgRating = feedbacks.length > 0
            ? feedbacks.reduce((acc, f) => acc + f.rating, 0) / feedbacks.length
            : 4.8;

        return {
            overview: {
                totalMentors: mentors.length,
                totalMentees: mentees.length,
                activePairs,
                totalSessions: sessions.length,
                completionRate: 85,
            },
            engagement: {
                avgMentorRating: avgRating,
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

        const users = await this.getUsers();
        const sessions = await this.getAllSessions();
        const mentees = users.filter(u => u.role === UserRole.MENTEE);

        return mentees.map(mentee => {
            const mentor = users.find(u => u.user_id === mentee.assigned_mentor_id);
            const insights = mentor ? governance.evaluateMentorship(mentee, mentor, sessions) : null;

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

        const users = await this.getUsers();
        const mentor = users.find(u => u.user_id === mentorId);
        const mentee = users.find(u => u.user_id === menteeId);

        if (!mentor || !mentee) throw new Error("User not found");

        const validation = governance.validateAssignment(mentor, mentee, users.filter(u => u.role === UserRole.MENTEE));
        if (!validation.valid) throw new Error(validation.error);

        const { error } = await supabase
            .from('users')
            .update({
                assigned_mentor_id: mentorId,
                mentorship_status: MentorshipStatus.ACTIVE,
                mentorship_start_date: new Date().toISOString()
            })
            .eq('user_id', menteeId);

        if (error) throw error;

        await this.addNotification(menteeId, 'Program Update', `You have been paired with ${mentor.name}.`, 'info', requestingUser.tenant_id);
    }

    async createSession(creator: User, targetUserId: string, datetime: string, topic: string): Promise<Session> {
        const mentor_id = creator.role === UserRole.MENTOR ? creator.user_id : targetUserId;
        const mentee_id = creator.role === UserRole.MENTEE ? creator.user_id : targetUserId;

        const { data, error } = await supabase
            .from('mentorship_sessions')
            .insert([{
                tenant_id: creator.tenant_id,
                mentor_id,
                mentee_id,
                scheduled_datetime: datetime,
                topic,
                status: SessionStatus.SCHEDULED
            }])
            .select()
            .single();

        if (error) throw error;

        await this.addNotification(targetUserId, 'New Session Scheduled', `${creator.name} has scheduled a session: ${topic}`, 'reminder', creator.tenant_id);
        return data;
    }

    async getResources(role: UserRole): Promise<Resource[]> {
        const { data, error } = await supabase
            .from('resources')
            .select('*')
            .contains('roles', [role]);

        if (error) {
            console.error('Error fetching resources:', error);
            return [];
        }
        return data || [];
    }

    async getGoals(userId: string): Promise<Goal[]> {
        const { data, error } = await supabase
            .from('mentee_goals')
            .select('*')
            .eq('mentee_id', userId);

        if (error) {
            console.error('Error fetching goals:', error);
            return [];
        }
        return data || [];
    }

    async getSessions(userId: string): Promise<Session[]> {
        const { data: user } = await supabase.from('users').select('role').eq('user_id', userId).single();

        let query = supabase.from('mentorship_sessions').select('*');
        if (user?.role !== UserRole.HR_ADMIN) {
            query = query.or(`mentor_id.eq.${userId},mentee_id.eq.${userId}`);
        }

        const { data, error } = await query;
        if (error) {
            console.error('Error fetching sessions:', error);
            return [];
        }
        return data || [];
    }

    async getNotifications(userId: string): Promise<Notification[]> {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('timestamp', { ascending: false });

        if (error) {
            console.error('Error fetching notifications:', error);
            return [];
        }
        return data || [];
    }

    async getFeedbackForUser(userId: string): Promise<SessionFeedback[]> {
        const { data, error } = await supabase
            .from('session_feedback')
            .select('*')
            .eq('to_user_id', userId);

        if (error) {
            console.error('Error fetching feedback:', error);
            return [];
        }
        return data || [];
    }

    async addNotification(userId: string, title: string, message: string, type: 'info' | 'reminder' | 'alert' = 'info', tenantId: string) {
        const { error } = await supabase
            .from('notifications')
            .insert([{
                tenant_id: tenantId,
                user_id: userId,
                title,
                message,
                type,
                read: false,
                timestamp: new Date().toISOString()
            }]);

        if (error) console.error('Error adding notification:', error);
    }

    async getRecommendedMatches(requestingUser: User): Promise<MatchRecommendation[]> {
        const mentors = await this.getUsers(UserRole.MENTOR);
        const mentees = await this.getUsers(UserRole.MENTEE);
        return runAutoMatching(mentors, mentees);
    }

    // HR Exclusive Methods
    async logAction(actingUserId: string, action: string, targetUserId?: string, details: any = {}): Promise<void> {
        const { error } = await supabase
            .from('audit_logs')
            .insert([{
                acting_user_id: actingUserId,
                action,
                target_user_id: targetUserId,
                details
            }]);
        if (error) console.error('Audit log error:', error);
    }

    async getAuditLogs(): Promise<AuditLog[]> {
        const { data, error } = await supabase
            .from('audit_logs')
            .select(`
                *,
                acting_user:acting_user_id(name),
                target_user:target_user_id(name)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching audit logs:', error);
            return [];
        }

        return (data || []).map(log => ({
            ...log,
            acting_user_name: (log.acting_user as any)?.name,
            target_user_name: (log.target_user as any)?.name
        }));
    }

    async updatePilotStatus(requestingUser: User, pilotId: string, status: 'Draft' | 'Active' | 'Completed'): Promise<void> {
        if (requestingUser.role !== UserRole.HR_ADMIN) throw new Error("Unauthorized");

        const { error } = await supabase
            .from('pilots')
            .update({ status })
            .eq('pilot_id', pilotId);

        if (error) throw error;
        await this.logAction(requestingUser.user_id, `Updated pilot ${pilotId} status to ${status}`, undefined, { pilotId, status });
    }

    async overrideAssignment(requestingUser: User, menteeId: string, mentorId: string | null): Promise<void> {
        if (requestingUser.role !== UserRole.HR_ADMIN) throw new Error("Unauthorized");

        const { error } = await supabase
            .from('users')
            .update({
                assigned_mentor_id: mentorId,
                mentorship_status: mentorId ? MentorshipStatus.ACTIVE : MentorshipStatus.UNASSIGNED,
                mentorship_start_date: mentorId ? new Date().toISOString() : null
            })
            .eq('user_id', menteeId);

        if (error) throw error;
        await this.logAction(requestingUser.user_id, 'Overrode mentorship assignment', menteeId, { mentorId });
    }
}

export const api = new SupabaseService();
