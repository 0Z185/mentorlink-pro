
import { User, UserRole } from '../types';

export interface MatchRecommendation {
  mentee_id: string;
  mentee_name: string;
  recommended_mentor_id: string;
  recommended_mentor_name: string;
  score: number;
  match_reasons: string[];
}

export const calculateMatchScore = (mentor: User, mentee: User): { score: number; reasons: string[] } => {
  let score = 0;
  const reasons: string[] = [];

  // 1. Skill/Interest Alignment (Weight: High)
  const sharedInterests = mentor.skills?.filter(skill => 
    mentee.interests.some(interest => interest.toLowerCase() === skill.toLowerCase())
  ) || [];
  
  if (sharedInterests.length > 0) {
    score += sharedInterests.length * 25;
    reasons.push(`Strong overlap in skills: ${sharedInterests.join(', ')}`);
  }

  // 2. Availability Check (Weight: Medium)
  let availabilityOverlap = 0;
  Object.keys(mentor.availability_schedule).forEach(day => {
    if (mentee.availability_schedule[day]) {
      const mentorSlots = mentor.availability_schedule[day];
      const menteeSlots = mentee.availability_schedule[day];
      const overlap = mentorSlots.filter(slot => menteeSlots.includes(slot));
      availabilityOverlap += overlap.length;
    }
  });

  if (availabilityOverlap > 0) {
    score += availabilityOverlap * 15;
    reasons.push(`Compatible schedule (${availabilityOverlap} shared slots)`);
  } else {
    score -= 40; // Penalty for zero availability overlap
    reasons.push(`Scheduling might be difficult (no direct overlap)`);
  }

  // 3. Experience Weighting (Weight: Low)
  if (mentor.experience_years) {
    const expBonus = Math.min(mentor.experience_years * 2, 20);
    score += expBonus;
    reasons.push(`Mentor has ${mentor.experience_years} years of experience`);
  }

  return { score: Math.max(0, score), reasons };
};

export const runAutoMatching = (mentors: User[], mentees: User[]): MatchRecommendation[] => {
  // Constants for balancing
  const MAX_MENTEES_PER_MENTOR = 2;

  // Track mentor load
  const mentorLoad: Record<string, number> = {};
  mentors.forEach(m => {
    mentorLoad[m.user_id] = mentees.filter(mentee => mentee.assigned_mentor_id === m.user_id).length;
  });

  return mentees
    .filter(mentee => !mentee.assigned_mentor_id) // Only match unassigned mentees
    .map(mentee => {
      const candidates = mentors
        .map(mentor => ({
          mentor,
          ...calculateMatchScore(mentor, mentee)
        }))
        // Sort by highest score
        .sort((a, b) => b.score - a.score);

      // Find the best available candidate within capacity
      const bestMatch = candidates.find(c => (mentorLoad[c.mentor.user_id] || 0) < MAX_MENTEES_PER_MENTOR);

      if (bestMatch) {
        mentorLoad[bestMatch.mentor.user_id] = (mentorLoad[bestMatch.mentor.user_id] || 0) + 1;
        return {
          mentee_id: mentee.user_id,
          mentee_name: mentee.name,
          recommended_mentor_id: bestMatch.mentor.user_id,
          recommended_mentor_name: bestMatch.mentor.name,
          score: bestMatch.score,
          match_reasons: bestMatch.reasons
        };
      }

      return null;
    })
    .filter((rec): rec is MatchRecommendation => rec !== null);
};
