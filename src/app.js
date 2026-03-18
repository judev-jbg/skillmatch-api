import express from 'express';
import cookieParser from 'cookie-parser';
import { apiReference } from '@scalar/express-api-reference';
import swaggerSpec from './config/swagger.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/users.routes.js';
import studentRoutes from './routes/students.routes.js';
import ngoRoutes from './routes/ngos.routes.js';
import projectRoutes from './routes/projects.routes.js';
import applicationRoutes from './routes/applications.routes.js';
import adminRoutes from './routes/admin.routes.js';

const app = express();

app.use(express.json());
app.use(cookieParser());

/** Documentación interactiva — deshabilitada si DOCS_ENABLED=false */
if (process.env.DOCS_ENABLED !== 'false') {
  app.use('/api-docs', apiReference({ spec: { content: swaggerSpec } }));
}

/** Rutas de autenticación */
app.use('/auth', authRoutes);

/** Rutas del usuario genérico */
app.use('/users', userRoutes);

/** Rutas del perfil del estudiante */
app.use('/students', studentRoutes);

/** Rutas del perfil de la ONG */
app.use('/ngos', ngoRoutes);

/** Rutas de proyectos */
app.use('/projects', projectRoutes);

/** Rutas de aplicaciones */
app.use('/applications', applicationRoutes);

/** Rutas de administración */
app.use('/admin', adminRoutes);

export default app;
