
import { User, UserRole, MentorshipStatus, UserStatus, Session, SessionStatus, Goal, GoalStatus, SessionFeedback } from './types';

export const INITIAL_USERS: User[] = [
  // ... (keeping the updated users)
  {
    user_id: '1',
    name: 'Sarah Chen',
    email: 'sarah.c@mentor.com',
    department: 'Engineering',
    role: UserRole.MENTOR,
    status: UserStatus.APPROVED,
    skills: ['React', 'System Design', 'Leadership', 'TypeScript'],
    experience_years: 12,
    interests: ['Tech for Good', 'Architecture'],
    availability_schedule: { "Monday": ["09:00-11:00"], "Thursday": ["14:00-16:00"] },
    mentorship_status: MentorshipStatus.ACTIVE,
    cancellation_count: 0,
    avatar: 'https://picsum.photos/seed/sarah/200',
    tenant_id: 'tenant-1'
  },
  {
    user_id: '2',
    name: 'Alex Rivera',
    email: 'alex.r@mentee.com',
    department: 'Engineering',
    role: UserRole.MENTEE,
    status: UserStatus.APPROVED,
    interests: ['Web Development', 'UI/UX', 'React'],
    availability_schedule: { "Monday": ["10:00-11:00"], "Friday": ["15:00-16:00"] },
    assigned_mentor_id: '1',
    mentorship_status: MentorshipStatus.ACTIVE,
    mentorship_start_date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // 3 months ago
    cancellation_count: 0,
    avatar: 'https://picsum.photos/seed/alex/200',
    tenant_id: 'tenant-1'
  },
  {
    user_id: '3',
    name: 'David Admin',
    email: 'hr@mentorlink.com',
    department: 'People Operations',
    role: UserRole.HR_ADMIN,
    status: UserStatus.APPROVED,
    interests: [],
    availability_schedule: {},
    mentorship_status: MentorshipStatus.ACTIVE,
    cancellation_count: 0,
    avatar: 'https://picsum.photos/seed/admin/200',
    tenant_id: 'tenant-1'
  },
  {
    user_id: '4',
    name: 'Marcus Thorne',
    email: 'marcus.t@mentor.com',
    department: 'Product',
    role: UserRole.MENTOR,
    status: UserStatus.APPROVED,
    skills: ['UI/UX', 'Figma', 'Product Management'],
    experience_years: 8,
    interests: ['Design Systems'],
    availability_schedule: { "Tuesday": ["10:00-12:00"], "Friday": ["15:00-17:00"] },
    mentorship_status: MentorshipStatus.ACTIVE,
    cancellation_count: 0,
    avatar: 'https://picsum.photos/seed/marcus/200',
    tenant_id: 'tenant-1'
  },
  {
    user_id: '5',
    name: 'Elena Vance',
    email: 'elena.v@mentee.com',
    department: 'Product',
    role: UserRole.MENTEE,
    status: UserStatus.APPROVED,
    interests: ['Figma', 'UI/UX', 'Product Management'],
    availability_schedule: { "Tuesday": ["11:00-12:00"], "Wednesday": ["09:00-10:00"] },
    mentorship_status: MentorshipStatus.UNASSIGNED,
    cancellation_count: 1,
    avatar: 'https://picsum.photos/seed/elena/200',
    tenant_id: 'tenant-1'
  }
];

export const INITIAL_SESSIONS: Session[] = [
  {
    session_id: 's1',
    tenant_id: 'tenant-1',
    mentor_id: '1',
    mentee_id: '2',
    scheduled_datetime: new Date(Date.now() - 172800000).toISOString(),
    topic: 'Career Roadmap & Goal Setting',
    status: SessionStatus.COMPLETED,
    session_notes: 'Initial meeting to discuss 2024 objectives.'
  },
  {
    session_id: 's2',
    tenant_id: 'tenant-1',
    mentor_id: '1',
    mentee_id: '2',
    scheduled_datetime: new Date(Date.now() + 86400000 * 3).toISOString(),
    topic: 'Technical Skills Deep Dive: System Design',
    status: SessionStatus.SCHEDULED
  }
];

export const INITIAL_GOALS: Goal[] = [
  {
    goal_id: 'g1',
    tenant_id: 'tenant-1',
    mentee_id: '2',
    goal_title: 'Master System Design',
    goal_description: 'Understand scalability and distribution.',
    start_date: '2023-11-01',
    due_date: '2024-02-01',
    status: GoalStatus.IN_PROGRESS
  }
];

export const INITIAL_FEEDBACKS: SessionFeedback[] = [
  { feedback_id: 'f1', tenant_id: 'tenant-1', session_id: 's1', from_user_id: '2', to_user_id: '1', rating: 5, comments: 'Excellent guidance!' }
];
