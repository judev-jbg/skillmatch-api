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