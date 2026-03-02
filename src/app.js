import express from 'express';
import cookieParser from 'cookie-parser';
import { apiReference } from '@scalar/express-api-reference';
import swaggerSpec from './config/swagger.js';
import authRoutes from './routes/auth.routes.js';

const app = express();

app.use(express.json());
app.use(cookieParser());

/** Documentación interactiva — deshabilitada si DOCS_ENABLED=false */
if (process.env.DOCS_ENABLED !== 'false') {
  app.use('/api-docs', apiReference({ spec: { content: swaggerSpec } }));
}

/** Rutas de autenticación */
app.use('/auth', authRoutes);

export default app;
