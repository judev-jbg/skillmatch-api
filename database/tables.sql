CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================
-- ENUM TYPES
-- ============================

CREATE TYPE user_role AS ENUM ('student', 'ngo', 'admin', 'sa');

CREATE TYPE project_status AS ENUM (
  'pending',
  'assigned',
  'in_progress',
  'in_review',
  'rejected',
  'completed',
  'cancelled'
);

CREATE TYPE level_skill AS ENUM ('basic', 'intermediate', 'advanced');

CREATE TYPE application_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TYPE deliverable_status AS ENUM ('pending', 'in_progress', 'in_review', 'approved', 'rejected');


-- ============================
-- USERS TABLE (SMAPI-21)
-- ============================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255),
  role user_role NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- STUDENT PROFILE TABLE (SMAPI-22)
-- ============================
CREATE TABLE student_profile (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  availability BOOLEAN DEFAULT FALSE,
  portfolio_url VARCHAR(255)
);

-- ============================
-- NGO PROFILE TABLE (SMAPI-22)
-- ============================
CREATE TABLE ngo_profile (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  organization_name VARCHAR(255) NOT NULL,
  description TEXT,
  area VARCHAR(100) NOT NULL,
  verified BOOLEAN DEFAULT FALSE
);

-- ============================
-- SKILLS TABLE (SMAPI-23)
-- ============================
CREATE TABLE skills
(
  id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name     VARCHAR(100) NOT NULL,
  category VARCHAR(50)  NOT NULL
);

-- ============================
-- USER_SKILLS TABLE (SMAPI-24)
-- ============================
CREATE TABLE user_skills (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  level level_skill NOT NULL,
  PRIMARY KEY (user_id, skill_id)
);

-- ============================
-- PROJECTS TABLE (SMAPI-25)
-- ============================
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ngo_id UUID NOT NULL REFERENCES ngo_profile(user_id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  objectives TEXT,
  estimated_hours INTEGER,
  deadline DATE,
  modality VARCHAR(100),
  status project_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- PROJECT_SKILLS TABLE (SMAPI-26)
-- ============================
CREATE TABLE project_skills (
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  required_level level_skill NOT NULL,
  PRIMARY KEY (project_id, skill_id)
);

-- ============================
-- APPLICATIONS TABLE (SMAPI-27)
-- ============================
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES student_profile(user_id) ON DELETE CASCADE,
  compatibility_score DECIMAL(5,2),
  status application_status NOT NULL DEFAULT 'pending',
  UNIQUE (project_id, student_id)
);

-- ============================
-- ASSIGNMENTS TABLE (SMAPI-28)
-- ============================
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES student_profile(user_id) ON DELETE CASCADE,
  agreement_data JSON,
  start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  end_date TIMESTAMP
);

-- ============================
-- DELIVERABLES TABLE (SMAPI-29)
-- ============================
CREATE TABLE deliverables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status deliverable_status NOT NULL DEFAULT 'pending',
  file_url VARCHAR(255),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- REVIEWS TABLE (SMAPI-30)
-- ============================
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  from_user UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating DECIMAL(3,1) NOT NULL,
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (assignment_id, from_user)
);

-- ============================
-- CERTIFICATES TABLE (SMAPI-31)
-- ============================
CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  file_url VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- INDEXES (SMAPI-32)
-- ============================
CREATE INDEX idx_applications_project ON applications(project_id);
CREATE INDEX idx_applications_student ON applications(student_id);