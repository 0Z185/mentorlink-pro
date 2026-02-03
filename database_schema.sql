-- MentorLink Pro Finalized Database Schema (Multi-Tenant)

-- Clean up existing tables for a fresh start
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS session_feedback CASCADE;
DROP TABLE IF EXISTS mentorship_sessions CASCADE;
DROP TABLE IF EXISTS mentee_goals CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS resources CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS pilots CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;

-- Tenants Table
CREATE TABLE tenants (
    tenant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL, -- for subdomain or URL lookup
    domain VARCHAR(255) UNIQUE,
    config JSONB DEFAULT '{}', -- stores branding (colors, logo), features
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Users Table
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL, -- Email unique per tenant usually, but globally unique simplifies auth for now. Let's make it unique per tenant.
    phone VARCHAR(50),
    role VARCHAR(20) CHECK (role IN ('hr_admin', 'Mentor', 'Mentee')) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('Pending', 'Approved', 'Rejected')) DEFAULT 'Pending',
    department VARCHAR(255),
    skills TEXT[],
    experience_years INT,
    interests TEXT[],
    availability_schedule JSONB,
    assigned_mentor_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    pilot_id UUID,
    avatar TEXT,
    mentorship_status VARCHAR(20) DEFAULT 'Unassigned',
    mentorship_start_date TIMESTAMP WITH TIME ZONE,
    cancellation_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, email) -- Email unique within a tenant
);

-- Sessions Table
CREATE TABLE mentorship_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    mentor_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    mentee_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    scheduled_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('Scheduled', 'Completed', 'Cancelled')) DEFAULT 'Scheduled',
    topic VARCHAR(255),
    session_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_roles CHECK (mentor_id != mentee_id)
);

-- Feedback Table
CREATE TABLE session_feedback (
    feedback_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES mentorship_sessions(session_id) ON DELETE CASCADE,
    from_user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (session_id, from_user_id),
    CONSTRAINT check_self_feedback CHECK (from_user_id != to_user_id)
);

-- Mentee Goals Table
CREATE TABLE mentee_goals (
    goal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    mentee_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    goal_title VARCHAR(255) NOT NULL,
    goal_description TEXT,
    start_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    status VARCHAR(20) CHECK (status IN ('Not Started', 'In Progress', 'Completed')) DEFAULT 'Not Started',
    progress_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Pilots Table
CREATE TABLE pilots (
    pilot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    start_date DATE,
    end_date DATE,
    min_sessions_required INT DEFAULT 6,
    duration_months INT DEFAULT 6,
    status VARCHAR(20) CHECK (status IN ('Draft', 'Active', 'Completed')) DEFAULT 'Draft',
    participant_ids UUID[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notifications Table
CREATE TABLE notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) CHECK (type IN ('info', 'reminder', 'alert')) DEFAULT 'info',
    read BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Resources Table
CREATE TABLE resources (
    resource_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(20) CHECK (type IN ('Guide', 'Video', 'Template', 'Article')),
    url TEXT,
    roles VARCHAR(20)[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs Table
CREATE TABLE audit_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    acting_user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    target_user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_sessions_tenant ON mentorship_sessions(tenant_id);
CREATE INDEX idx_feedback_session ON session_feedback(session_id);
CREATE INDEX idx_feedback_recipient ON session_feedback(to_user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_users_pilot ON users(pilot_id);

-- Initial Seed Data
-- 1. Create Tenant
INSERT INTO tenants (tenant_id, name, slug, domain, config)
VALUES ('00000000-0000-0000-0000-000000000000', 'MentorLink', 'mentorlink', 'app.mentorlink.com', '{
  "primary_color": "#ef7f1a",
  "logo": "default",
  "features": {
    "goals": true,
    "calendar": true,
    "resources": true
  },
  "labels": {
    "mentor": "Mentor",
    "mentee": "Mentee",
    "program_name": "MentorLink Global"
  },
  "rules": {
    "max_mentees_per_mentor": 3,
    "min_sessions_for_completion": 6,
    "session_duration_minutes": 60,
    "require_feedback": true
  },
  "roles": {
    "Mentor": {
      "permissions": ["view_dashboard", "schedule_sessions", "view_reports"],
      "label_override": "Senior Mentor"
    },
    "Mentee": {
      "permissions": ["view_dashboard", "edit_goals"]
    },
    "hr_admin": {
      "permissions": ["view_dashboard", "manage_users", "manage_settings", "view_reports"]
    }
  }
}');

-- 2. Create Users (Linked to Tenant)
INSERT INTO users (user_id, tenant_id, name, email, role, status, department, skills, experience_years, interests, availability_schedule, mentorship_status, avatar) 
VALUES 
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'Sarah Chen', 'sarah.c@mentor.com', 'Mentor', 'Approved', 'Engineering', ARRAY['React', 'System Design', 'Leadership', 'TypeScript'], 12, ARRAY['Tech for Good', 'Architecture'], '{"Monday": ["09:00-11:00"], "Thursday": ["14:00-16:00"]}', 'Active', 'https://picsum.photos/seed/sarah/200'),
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'Alex Rivera', 'alex.r@mentee.com', 'Mentee', 'Approved', 'Engineering', ARRAY['React', 'Web Development'], 2, ARRAY['Web Development', 'UI/UX', 'React'], '{"Monday": ["10:00-11:00"], "Friday": ["15:00-16:00"]}', 'Active', 'https://picsum.photos/seed/alex/200'),
('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'David HR', 'hr@mentorlink.com', 'hr_admin', 'Approved', 'HR', ARRAY[]::TEXT[], 10, ARRAY[]::TEXT[], '{}', 'Active', 'https://picsum.photos/seed/admin/200'),
('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'Marcus Thorne', 'marcus.t@mentor.com', 'Mentor', 'Approved', 'Design', ARRAY['UI/UX', 'Figma', 'Product Management'], 8, ARRAY['Design Systems'], '{"Tuesday": ["10:00-12:00"], "Friday": ["15:00-17:00"]}', 'Active', 'https://picsum.photos/seed/marcus/200'),
('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'Elena Vance', 'elena.v@mentee.com', 'Mentee', 'Approved', 'Design', ARRAY['Figma', 'UI/UX'], 1, ARRAY['Figma', 'UI/UX', 'Product Management'], '{"Tuesday": ["11:00-12:00"], "Wednesday": ["09:00-10:00"]}', 'Unassigned', 'https://picsum.photos/seed/elena/200');

UPDATE users SET assigned_mentor_id = '00000000-0000-0000-0000-000000000001' WHERE email = 'alex.r@mentee.com';

-- Pilots
INSERT INTO pilots (pilot_id, tenant_id, name, start_date, end_date, min_sessions_required, duration_months, status, participant_ids)
VALUES ('00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000000', 'Q4 Product Design Pilot', '2023-10-01', '2024-03-31', 6, 6, 'Active', ARRAY['00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000005']::UUID[]);

UPDATE users SET pilot_id = '00000000-0000-0000-0000-000000000006' WHERE user_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000005');

-- Sessions
INSERT INTO mentorship_sessions (session_id, tenant_id, mentor_id, mentee_id, scheduled_datetime, topic, status, session_notes)
VALUES 
('00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', now() - interval '2 days', 'Career Roadmap & Goal Setting', 'Completed', 'Initial meeting to discuss 2024 objectives.'),
('00000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', now() + interval '3 days', 'Technical Skills Deep Dive: System Design', 'Scheduled', NULL);

-- Feedback
INSERT INTO session_feedback (session_id, tenant_id, from_user_id, to_user_id, rating, comments)
VALUES 
('00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 5, 'Excellent guidance and very actionable advice!');

-- Goals
INSERT INTO mentee_goals (mentee_id, tenant_id, goal_title, goal_description, start_date, due_date, status)
VALUES 
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'Master System Design', 'Understand scalability, availability, and reliability.', now() - interval '1 month', now() + interval '2 months', 'In Progress'),
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'Publish Tech Blog', 'Write at least 3 articles on React.', now() - interval '2 weeks', now() + interval '1 month', 'Not Started');

-- Resources
INSERT INTO resources (title, tenant_id, description, type, url, roles)
VALUES 
('Mentorship Kickoff Guide', '00000000-0000-0000-0000-000000000000', 'Everything you need to know about starting your first session.', 'Guide', '#', ARRAY['Mentor', 'Mentee']),
('Goal Setting Framework (OKR)', '00000000-0000-0000-0000-000000000000', 'Template for defining career objectives.', 'Template', '#', ARRAY['Mentee', 'Mentor']);
