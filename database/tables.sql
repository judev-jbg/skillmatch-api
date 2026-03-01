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

