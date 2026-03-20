import pool from '../config/db.js';
import NgosRepository from '../repositories/ngos.repository.js';
import { HttpError } from '../utils/errors.js';

/**
 * Lógica de negocio para el perfil de la ONG.
 */
const NgosService = {
  /**
   * Devuelve el perfil completo de la ONG autenticada.
   *
   * @param {string} userId
   * @returns {Promise<object>}
   * @throws {HttpError} 404 si no existe el perfil
   */
  async getProfile(userId) {
    const profile = await NgosRepository.findByUserId(userId);
    if (!profile) {
      throw new HttpError('Perfil de ONG no encontrado', 404);
    }
    return profile;
  },

  /**
   * Actualiza los datos institucionales de la ONG autenticada.
   * Al menos uno de los campos debe estar presente.
   *
   * @param {string} userId
   * @param {{ organizationName?: string, description?: string, area?: string }} data
   * @returns {Promise<object>} Perfil actualizado
   * @throws {HttpError} 400 si no se provee ningún campo
   * @throws {HttpError} 404 si no existe el perfil
   */
  async updateProfile(userId, { organizationName, description, area }) {
    if (organizationName === undefined && description === undefined && area === undefined) {
      throw new HttpError('Debe proporcionar al menos un campo para actualizar', 400);
    }

    const existing = await NgosRepository.findByUserId(userId);
    if (!existing) {
      throw new HttpError('Perfil de ONG no encontrado', 404);
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await NgosRepository.update(
        { userId, organizationName, description, area },
        client,
      );
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    return NgosRepository.findByUserId(userId);
  },
  /**
   * Verifica una ONG (solo admin).
   *
   * @param {string} userId - UUID del usuario ONG a verificar
   * @returns {Promise<object>} Perfil de la ONG verificada
   * @throws {HttpError} 404 si no existe el perfil
   */
  async verify(userId) {
    const existing = await NgosRepository.findByUserId(userId);
    if (!existing) {
      throw new HttpError('Perfil de ONG no encontrado', 404);
    }

    await NgosRepository.verify(userId);
    return NgosRepository.findByUserId(userId);
  },
};

export default NgosService;
