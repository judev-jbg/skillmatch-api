import crypto from 'crypto';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { Resend } from 'resend';
import pool from '../config/db.js';
import UsersRepository from '../repositories/users.repository.js';
import PasswordResetRepository from '../repositories/password-reset.repository.js';
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

  /**
   * Genera un token de recuperación y envía el email al usuario.
   * Siempre devuelve 200 aunque el email no exista (no revelar si está registrado).
   *
   * @param {string} email
   * @returns {Promise<void>}
   */
  async forgotPassword(email) {
    const user = await UsersRepository.findByEmail(email);
    if (!user) return;

    await PasswordResetRepository.deleteByUserId(user.id);

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await PasswordResetRepository.create({ userId: user.id, token, expiresAt });

    await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: process.env.RESEND_FROM,
      to: user.email,
      subject: 'Recuperación de contraseña — SkillMatch',
      html: `
        <p>Hola ${user.name},</p>
        <p>Recibimos una solicitud para restablecer tu contraseña.</p>
        <p>Tu token de recuperación es:</p>
        <pre>${token}</pre>
        <p>Este token expira en 1 hora. Si no solicitaste este cambio, ignora este mensaje.</p>
      `,
    });
  },

  /**
   * Verifica el token y actualiza la contraseña del usuario.
   *
   * @param {{ token: string, password: string }} data
   * @returns {Promise<void>}
   * @throws {HttpError} 400 si el token no existe o ha expirado
   */
  async resetPassword({ token, password }) {
    const record = await PasswordResetRepository.findByToken(token);
    if (!record) {
      throw new HttpError('Token inválido o expirado', 400);
    }

    const passwordHash = await argon2.hash(password);
    await UsersRepository.updatePassword(record.user_id, passwordHash);
    await PasswordResetRepository.deleteByUserId(record.user_id);
  },
};

export default AuthService;
