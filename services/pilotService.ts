
import { Pilot, User, Session, Goal, SessionFeedback, PilotOutcome, SessionStatus, GoalStatus, PilotEvaluationReport, UserRole } from '../types';

class PilotService {
  /**
   * Evaluates a single participant's success in a pilot
   */
  evaluateParticipant(
    user: User,
    pilot: Pilot,
    sessions: Session[],
    goals: Goal[],
    feedbacks: SessionFeedback[]
  ): { outcome: PilotOutcome; score: number; details: string[] } {
    const details: string[] = [];
    let score = 0;

    // 1. Session Threshold (40 points)
    const userSessions = sessions.filter(s => 
      (s.mentee_id === user.user_id || s.mentor_id === user.user_id) && 
      s.status === SessionStatus.COMPLETED
    );
    const sessionCompletionRatio = Math.min(1, userSessions.length / pilot.min_sessions_required);
    score += sessionCompletionRatio * 40;
    details.push(`${userSessions.length}/${pilot.min_sessions_required} sessions completed`);

    // 2. Goal Completion (30 points) - Mentee specific
    if (user.role === UserRole.MENTEE) {
      const userGoals = goals.filter(g => g.mentee_id === user.user_id);
      const completedGoals = userGoals.filter(g => g.status === GoalStatus.COMPLETED);
      const goalRatio = userGoals.length > 0 ? completedGoals.length / userGoals.length : 0;
      score += goalRatio * 30;
      details.push(`${completedGoals.length}/${userGoals.length} goals achieved`);
    } else {
      // Mentors get points based on their mentees' average session participation
      score += 30; // Baseline for mentors if they attend sessions
    }

    // 3. Feedback Sentiment (30 points)
    const receivedFeedback = feedbacks.filter(f => f.to_user_id === user.user_id);
    const avgRating = receivedFeedback.length > 0 
      ? receivedFeedback.reduce((acc, f) => acc + f.rating, 0) / receivedFeedback.length 
      : 0;
    
    // Scale 5.0 rating to 30 points
    score += (avgRating / 5) * 30;
    details.push(`Avg Feedback Rating: ${avgRating.toFixed(1)}/5.0`);

    // Determine Outcome
    let outcome = PilotOutcome.UNSUCCESSFUL;
    if (score >= 80 && userSessions.length >= pilot.min_sessions_required) {
      outcome = PilotOutcome.SUCCESSFUL;
    } else if (score >= 50) {
      outcome = PilotOutcome.NEEDS_IMPROVEMENT;
    }

    return { outcome, score: Math.round(score), details };
  }

  /**
   * Generates a full cohort report
   */
  generateReport(
    pilot: Pilot,
    allUsers: User[],
    allSessions: Session[],
    allGoals: Goal[],
    allFeedbacks: SessionFeedback[]
  ): PilotEvaluationReport {
    const participants = allUsers.filter(u => pilot.participant_ids.includes(u.user_id));
    
    const individualOutcomes = participants.map(u => ({
      user_name: u.name,
      role: u.role,
      ...this.evaluateParticipant(u, pilot, allSessions, allGoals, allFeedbacks)
    }));

    const successfulCount = individualOutcomes.filter(o => o.outcome === PilotOutcome.SUCCESSFUL).length;
    
    return {
      pilot_name: pilot.name,
      total_participants: participants.length,
      success_rate: (successfulCount / participants.length) * 100,
      avg_engagement: individualOutcomes.reduce((acc, o) => acc + o.score, 0) / participants.length,
      individual_outcomes: individualOutcomes
    };
  }
}

export const pilotService = new PilotService();
