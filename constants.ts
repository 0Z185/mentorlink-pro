
import { User, UserRole, MentorshipStatus } from './types';

export const INITIAL_USERS: User[] = [
  {
    user_id: '1',
    name: 'Sarah Chen',
    email: 'sarah.c@mentor.com',
    role: UserRole.MENTOR,
    skills: ['React', 'System Design', 'Leadership', 'TypeScript'],
    experience_years: 12,
    interests: ['Tech for Good', 'Architecture'],
    availability_schedule: { "Monday": ["09:00-11:00"], "Thursday": ["14:00-16:00"] },
    mentorship_status: MentorshipStatus.ACTIVE,
    cancellation_count: 0,
    avatar: 'https://picsum.photos/seed/sarah/200'
  },
  {
    user_id: '2',
    name: 'Alex Rivera',
    email: 'alex.r@mentee.com',
    role: UserRole.MENTEE,
    interests: ['Web Development', 'UI/UX', 'React'],
    availability_schedule: { "Monday": ["10:00-11:00"], "Friday": ["15:00-16:00"] },
    assigned_mentor_id: '1',
    mentorship_status: MentorshipStatus.ACTIVE,
    mentorship_start_date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // 3 months ago
    cancellation_count: 0,
    avatar: 'https://picsum.photos/seed/alex/200'
  },
  {
    user_id: '3',
    name: 'David Admin',
    email: 'admin@mentorlink.com',
    role: UserRole.ADMIN,
    interests: [],
    availability_schedule: {},
    mentorship_status: MentorshipStatus.ACTIVE,
    cancellation_count: 0,
    avatar: 'https://picsum.photos/seed/admin/200'
  },
  {
    user_id: '4',
    name: 'Marcus Thorne',
    email: 'marcus.t@mentor.com',
    role: UserRole.MENTOR,
    skills: ['UI/UX', 'Figma', 'Product Management'],
    experience_years: 8,
    interests: ['Design Systems'],
    availability_schedule: { "Tuesday": ["10:00-12:00"], "Friday": ["15:00-17:00"] },
    mentorship_status: MentorshipStatus.ACTIVE,
    cancellation_count: 0,
    avatar: 'https://picsum.photos/seed/marcus/200'
  },
  {
    user_id: '5',
    name: 'Elena Vance',
    email: 'elena.v@mentee.com',
    role: UserRole.MENTEE,
    interests: ['Figma', 'UI/UX', 'Product Management'],
    availability_schedule: { "Tuesday": ["11:00-12:00"], "Wednesday": ["09:00-10:00"] },
    mentorship_status: MentorshipStatus.UNASSIGNED,
    cancellation_count: 1,
    avatar: 'https://picsum.photos/seed/elena/200'
  }
];
