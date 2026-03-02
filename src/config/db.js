import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

/**
 * Pool de conexiones a PostgreSQL configurado desde variables de entorno.
 * Se reutiliza una única instancia en toda la aplicación.
 */
const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

export default pool;
