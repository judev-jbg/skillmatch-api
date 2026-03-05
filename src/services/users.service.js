import pool from '../config/db.js';
import UsersRepository from '../repositories/users.repository.js';
import { HttpError } from '../utils/errors.js';

/**
 * Lógica de negocio para el perfil genérico del usuario autenticado.
 */
const UsersService = {
  /**
   * Retorna los datos básicos del usuario autenticado.
   *
   * @param {string} userId - UUID del usuario
   * @returns {Promise<object>}
   * @throws {HttpError} 404 si el usuario no existe
   */
  async getMe(userId) {
    const user = await UsersRepository.findById(userId);
    if (!user) throw new HttpError('Usuario no encontrado', 404);
    const { password_hash, ...publicUser } = user;
    return publicUser;
  },

  /**
   * Actualiza name y/o email del usuario autenticado.
   *
   * @param {string} userId - UUID del usuario
   * @param {{ name?: string, email?: string }} data
   * @returns {Promise<object>} Usuario actualizado
   * @throws {HttpError} 400 si no se provee ningún campo
   * @throws {HttpError} 409 si el email ya está en uso por otro usuario
   */
  async updateMe(userId, { name, email }) {
    if (!name && !email) {
      throw new HttpError('Se debe proveer al menos name o email', 400);
    }

    if (email) {
      const existing = await UsersRepository.findByEmail(email);
      if (existing && existing.id !== userId) {
        throw new HttpError('El email ya está en uso', 409);
      }
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const updated = await UsersRepository.update({ userId, name, email }, client);
      await client.query('COMMIT');
      return updated;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },
};

export default UsersService;
