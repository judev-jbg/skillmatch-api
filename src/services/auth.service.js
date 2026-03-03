import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import UsersRepository from '../repositories/users.repository.js';
import { HttpError } from '../utils/errors.js';

/**
 * Lógica de negocio para autenticación.
 */
const AuthService = {
  /**
   * Registra un nuevo usuario estudiante u ONG.
   * Los administradores solo pueden ser creados por otro admin (no cubre este método).
   *
   * @param {{ name: string, email: string, password: string, role: string, organizationName?: string, area?: string }} data
   * @returns {Promise<{ id: string, name: string, email: string, role: string, created_at: Date }>}
   * @throws {HttpError} 409 si el email ya está registrado
   * @throws {HttpError} 400 si el rol es inválido o faltan campos de ONG
   */
  async register({ name, email, password, role, organizationName, area }) {
    const ALLOWED_ROLES = ['student', 'ngo'];

    if (!ALLOWED_ROLES.includes(role)) {
      throw new HttpError(`Rol inválido. Valores permitidos: ${ALLOWED_ROLES.join(', ')}`, 400);
    }

    if (role === 'ngo' && (!organizationName || !area)) {
      throw new HttpError('Los campos organization_name y area son requeridos para ONGs', 400);
    }

    const existing = await UsersRepository.findByEmail(email);
    if (existing) {
      throw new HttpError('El email ya está registrado', 409);
    }

    const passwordHash = await argon2.hash(password);

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const user = await UsersRepository.create({ name, email, passwordHash, role }, client);

      if (role === 'student') {
        await UsersRepository.createStudentProfile(user.id, client);
      } else {
        await UsersRepository.createNgoProfile({
          userId: user.id,
          organizationName,
          area,
        }, client);
      }

      await client.query('COMMIT');
      return user;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * Autentica un usuario por email y contraseña.
   * Devuelve el token JWT firmado y los datos públicos del usuario.
   *
   * @param {{ email: string, password: string }} data
   * @returns {Promise<{ token: string, user: { id: string, name: string, email: string, role: string, created_at: Date } }>}
   * @throws {HttpError} 401 si el email no existe o la contraseña es incorrecta
   */
  async login({ email, password }) {
    const user = await UsersRepository.findByEmail(email);
    if (!user) {
      throw new HttpError('Credenciales inválidas', 401);
    }

    const valid = await argon2.verify(user.password_hash, password);
    if (!valid) {
      throw new HttpError('Credenciales inválidas', 401);
    }

    const token = jwt.sign(
      { sub: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN ?? '7d' },
    );

    const { password_hash, ...publicUser } = user;
    return { token, user: publicUser };
  },
};

export default AuthService;
