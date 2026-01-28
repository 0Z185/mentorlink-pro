


export type Permission =
  | 'view_dashboard'
  | 'manage_users'
  | 'manage_settings'
  | 'view_reports'
  | 'edit_goals'
  | 'schedule_sessions';

export interface TenantLabels {
  mentor: string;
  mentee: string;
  program_name: string;
}

export interface TenantRules {
  max_mentees_per_mentor: number;
  min_sessions_for_completion: number;
  session_duration_minutes: number;
  require_feedback: boolean;
}

export interface TenantRoleConfig {
  permissions: Permission[];
  label_override?: string; // e.g. "Lead Coach" for Mentor
}

export interface TenantConfig {
  primary_color?: string;
  logo?: string;
  features?: Record<string, boolean>;
  labels: TenantLabels;
  rules: TenantRules;
  roles: Record<string, TenantRoleConfig>; // key is UserRole enum value
}

export interface Tenant {
  tenant_id: string;
  name: string;
  slug: string;
  domain?: string;
  config: TenantConfig;
}

export enum UserRole {
  MENTOR = 'Mentor',
  MENTEE = 'Mentee',
  HR_ADMIN = 'hr_admin'
}

export enum MentorshipStatus {
  ACTIVE = 'Active',
  PAUSED = 'Paused',
  COMPLETED = 'Completed',
  TERMINATED = 'Terminated',
  UNASSIGNED = 'Unassigned'
}

export enum SessionStatus {
  PENDING = 'Pending',
  SCHEDULED = 'Scheduled',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
  RESCHEDULED = 'Rescheduled'
}

export enum GoalStatus {
  NOT_STARTED = 'Not Started',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed'
}

export enum PilotOutcome {
  SUCCESSFUL = 'Successful',
  NEEDS_IMPROVEMENT = 'Needs Improvement',
  UNSUCCESSFUL = 'Unsuccessful',
  PENDING = 'Pending'
}

export interface Pilot {
  pilot_id: string;
  tenant_id: string;
  name: string;
  start_date: string;
  end_date: string;
  min_sessions_required: number;
  duration_months: number;
  status: 'Draft' | 'Active' | 'Completed';
  participant_ids: string[];
}

export interface User {
  user_id: string;
  tenant_id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  skills?: string[];
  experience_years?: number;
  interests: string[];
  availability_schedule: Record<string, string[]>;
  assigned_mentor_id?: string;
  assigned_mentee_ids?: string[];
  mentorship_status: MentorshipStatus;
  mentorship_start_date?: string;
  cancellation_count: number;
  avatar?: string;
  pilot_id?: string; // Links user to a specific pilot cohort
}

export interface Session {
  session_id: string;
  tenant_id: string;
  mentor_id: string;
  mentee_id: string;
  scheduled_datetime: string;
  topic: string;
  status: SessionStatus;
  session_notes?: string;
  feedback_id?: string;
}

export interface Notification {
  notification_id: string;
  tenant_id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'reminder' | 'alert';
  timestamp: string;
  read: boolean;
}

export interface Goal {
  goal_id: string;
  tenant_id: string;
  mentee_id: string;
  goal_title: string;
  goal_description: string;
  start_date: string;
  due_date: string;
  status: GoalStatus;
  progress_notes?: string;
}

export interface SessionFeedback {
  feedback_id: string;
  tenant_id: string;
  session_id: string;
  from_user_id: string;
  to_user_id: string;
  rating: number;
  comments: string;
}

export interface PilotEvaluationReport {
  pilot_name: string;
  total_participants: number;
  success_rate: number;
  avg_engagement: number;
  individual_outcomes: {
    user_name: string;
    role: UserRole;
    outcome: PilotOutcome;
    score: number;
    details: string[];
  }[];
}
