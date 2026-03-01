CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================
-- ENUM TYPES
-- ============================

CREATE TYPE user_role AS ENUM ('student', 'ngo', 'admin');

CREATE TYPE project_status AS ENUM (
  'pending',
  'assigned',
  'in_progress',
  'in_review',
  'rejected',
  'approved',
  'finished'
);

CREATE TYPE level_skill AS ENUM ('basic', 'intermediate', 'advanced');

CREATE TYPE application_status AS ENUM ('pending', 'approved', 'rejected');


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
  ngo_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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