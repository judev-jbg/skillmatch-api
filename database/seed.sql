-- ============================
-- SEED DATA - Datos de desarrollo
-- ============================
-- Contraseña para todos los usuarios: Test1234
-- Ejecutar: psql -U postgres -d skillmatch -f database/seed.sql

-- ============================
-- LIMPIAR DATOS EXISTENTES
-- ============================
-- Orden inverso a las foreign keys para evitar conflictos
DELETE FROM certificates;
DELETE FROM reviews;
DELETE FROM deliverables;
DELETE FROM assignments;
DELETE FROM applications;
DELETE FROM project_skills;
DELETE FROM projects;
DELETE FROM user_skills;
DELETE FROM skills;
DELETE FROM student_profile;
DELETE FROM ngo_profile;
DELETE FROM users;

-- ============================
-- USUARIOS
-- ============================
-- password: Test1234
INSERT INTO users (id, name, email, password_hash, role) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Admin', 'admin@test.com', '$argon2id$v=19$m=65536,t=3,p=4$7PbdfwFlvyqExX7b7933nA$M5zl7fs4VgyQp/U7y5pXyqxOqrEkFl6eqProfJaaaXI', 'admin'),
  ('b0000000-0000-0000-0000-000000000001', 'ONG Alimentos Solidarios', 'ong1@test.com', '$argon2id$v=19$m=65536,t=3,p=4$7PbdfwFlvyqExX7b7933nA$M5zl7fs4VgyQp/U7y5pXyqxOqrEkFl6eqProfJaaaXI', 'ngo'),
  ('b0000000-0000-0000-0000-000000000002', 'ONG Refugio Animal', 'ong2@test.com', '$argon2id$v=19$m=65536,t=3,p=4$7PbdfwFlvyqExX7b7933nA$M5zl7fs4VgyQp/U7y5pXyqxOqrEkFl6eqProfJaaaXI', 'ngo'),
  ('c0000000-0000-0000-0000-000000000001', 'Laura Martinez', 'student1@test.com', '$argon2id$v=19$m=65536,t=3,p=4$7PbdfwFlvyqExX7b7933nA$M5zl7fs4VgyQp/U7y5pXyqxOqrEkFl6eqProfJaaaXI', 'student'),
  ('c0000000-0000-0000-0000-000000000002', 'Carlos Ruiz', 'student2@test.com', '$argon2id$v=19$m=65536,t=3,p=4$7PbdfwFlvyqExX7b7933nA$M5zl7fs4VgyQp/U7y5pXyqxOqrEkFl6eqProfJaaaXI', 'student');

-- ============================
-- PERFILES DE ONG
-- ============================
INSERT INTO ngo_profile (user_id, organization_name, description, area, verified) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'Alimentos Solidarios', 'Banco de alimentos que distribuye comida a familias en riesgo de exclusion social', 'Alimentacion', TRUE),
  ('b0000000-0000-0000-0000-000000000002', 'Refugio Animal Valencia', 'Refugio de animales abandonados en la provincia de Valencia', 'Animales', TRUE);

-- ============================
-- PERFILES DE ESTUDIANTE
-- ============================
INSERT INTO student_profile (user_id, availability, portfolio_url) VALUES
  ('c0000000-0000-0000-0000-000000000001', TRUE, 'https://lauramartinez.dev'),
  ('c0000000-0000-0000-0000-000000000002', TRUE, 'https://carlosruiz.design');

-- ============================
-- CATALOGO DE SKILLS
-- ============================
INSERT INTO skills (id, name, category) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'JavaScript', 'Desarrollo'),
  ('d0000000-0000-0000-0000-000000000002', 'React', 'Desarrollo'),
  ('d0000000-0000-0000-0000-000000000003', 'Node.js', 'Desarrollo'),
  ('d0000000-0000-0000-0000-000000000004', 'SQL', 'Desarrollo'),
  ('d0000000-0000-0000-0000-000000000005', 'Python', 'Desarrollo'),
  ('d0000000-0000-0000-0000-000000000006', 'Diseno UX', 'Diseno'),
  ('d0000000-0000-0000-0000-000000000007', 'Figma', 'Diseno'),
  ('d0000000-0000-0000-0000-000000000008', 'WordPress', 'CMS'),
  ('d0000000-0000-0000-0000-000000000009', 'SEO', 'Marketing'),
  ('d0000000-0000-0000-0000-000000000010', 'Redes sociales', 'Marketing');

-- ============================
-- SKILLS DE ESTUDIANTES
-- ============================
-- Laura: perfil full-stack (buen match con proyecto 1)
INSERT INTO user_skills (user_id, skill_id, level) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'advanced'),     -- JavaScript
  ('c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'intermediate'),  -- React
  ('c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', 'intermediate'),  -- Node.js
  ('c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000004', 'basic');         -- SQL

-- Carlos: perfil diseno/marketing (buen match con proyecto 2)
INSERT INTO user_skills (user_id, skill_id, level) VALUES
  ('c0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000008', 'advanced'),      -- WordPress
  ('c0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000007', 'intermediate'),   -- Figma
  ('c0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000009', 'intermediate'),   -- SEO
  ('c0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000010', 'basic');          -- Redes sociales

-- ============================
-- PROYECTOS
-- ============================
INSERT INTO projects (id, ngo_id, title, description, objectives, estimated_hours, deadline, modality, status) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
   'Web para banco de alimentos',
   'Aplicacion web para gestionar voluntarios y coordinar la distribucion de donaciones alimentarias',
   'Digitalizar la gestion de voluntarios y mejorar la coordinacion de entregas',
   120, '2026-09-30', 'remoto', 'pending'),
  ('e0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002',
   'Campana digital para refugio animal',
   'Crear presencia web y estrategia en redes sociales para aumentar las adopciones',
   'Aumentar la visibilidad online del refugio y conseguir mas adopciones',
   80, '2026-08-15', 'hibrido', 'pending');

-- ============================
-- SKILLS REQUERIDAS POR PROYECTO
-- ============================
-- Proyecto 1: Web banco de alimentos (necesita full-stack)
INSERT INTO project_skills (project_id, skill_id, required_level) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'intermediate'),  -- React
  ('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', 'basic'),         -- Node.js
  ('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000004', 'basic');         -- SQL

-- Proyecto 2: Campana digital refugio (necesita diseno/marketing)
INSERT INTO project_skills (project_id, skill_id, required_level) VALUES
  ('e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000008', 'intermediate'),  -- WordPress
  ('e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000009', 'basic'),         -- SEO
  ('e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000010', 'intermediate');  -- Redes sociales
