
import { User, Session, UserRole, MentorshipStatus, SessionStatus, TenantRules } from '../types';

export const DEFAULT_RULES: TenantRules = {
  max_mentees_per_mentor: 3,
  min_sessions_for_completion: 6,
  session_duration_minutes: 60,
  require_feedback: true
};

const ADDITIONAL_RULES = {
  DURATION_MONTHS: 6,
  INACTIVITY_THRESHOLD_DAYS: 30,
  MAX_CANCELLATIONS_ALLOWED: 2
};

export interface GovernanceInsight {
  status: MentorshipStatus;
  progressPercent: number;
  healthFlags: string[];
  canGraduate: boolean;
}

class GovernanceService {

  validateAssignment(mentor: User, mentee: User, allMentees: User[], rules: TenantRules = DEFAULT_RULES): { valid: boolean; error?: string } {
    // 1. Check Capacity
    const activeMenteeCount = allMentees.filter(m => m.assigned_mentor_id === mentor.user_id).length;
    if (activeMenteeCount >= rules.max_mentees_per_mentor) {
      return { valid: false, error: `Mentor ${mentor.name} has reached max capacity (${rules.max_mentees_per_mentor}).` };
    }

    // 2. Check Mentee Status
    if (mentee.assigned_mentor_id) {
      return { valid: false, error: `Mentee ${mentee.name} already has an active mentor.` };
    }

    return { valid: true };
  }

  evaluateMentorship(mentee: User, mentor: User, sessions: Session[], rules: TenantRules = DEFAULT_RULES): GovernanceInsight {
    const healthFlags: string[] = [];
    const pairSessions = sessions.filter(s => s.mentee_id === mentee.user_id && s.mentor_id === mentor.user_id);
    const completedSessions = pairSessions.filter(s => s.status === SessionStatus.COMPLETED);

    // 1. Check Inactivity (30 days)
    const lastSession = pairSessions.sort((a, b) => new Date(b.scheduled_datetime).getTime() - new Date(a.scheduled_datetime).getTime())[0];
    if (lastSession) {
      const daysSinceLast = (Date.now() - new Date(lastSession.scheduled_datetime).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLast > ADDITIONAL_RULES.INACTIVITY_THRESHOLD_DAYS) {
        healthFlags.push(`Inactivity: No session in ${Math.floor(daysSinceLast)} days`);
      }
    }

    // 2. Check Cancellations
    if (mentee.cancellation_count >= ADDITIONAL_RULES.MAX_CANCELLATIONS_ALLOWED) {
      healthFlags.push(`High Cancellations: Mentee has ${mentee.cancellation_count} cancellations`);
    }

    // 3. Progress Calculation
    const progressPercent = Math.min(100, (completedSessions.length / rules.min_sessions_for_completion) * 100);

    // 4. Graduation Readiness
    const monthsElapsed = mentee.mentorship_start_date
      ? (Date.now() - new Date(mentee.mentorship_start_date).getTime()) / (1000 * 60 * 60 * 24 * 30)
      : 0;

    const canGraduate = completedSessions.length >= rules.min_sessions_for_completion &&
      monthsElapsed >= ADDITIONAL_RULES.DURATION_MONTHS;

    return {
      status: mentee.mentorship_status,
      progressPercent,
      healthFlags,
      canGraduate
    };
  }
}

export const governance = new GovernanceService();
