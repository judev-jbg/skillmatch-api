import pool from '../config/db.js';
import StudentsRepository from '../repositories/students.repository.js';
import { HttpError } from '../utils/errors.js';

/**
 * Lógica de negocio para el perfil del estudiante.
 */
const StudentsService = {
  /**
   * Devuelve el perfil completo del estudiante autenticado.
   *
   * @param {string} userId
   * @returns {Promise<object>}
   * @throws {HttpError} 404 si no existe el perfil
   */
  async getProfile(userId) {
    const profile = await StudentsRepository.findByUserId(userId);
    if (!profile) {
      throw new HttpError('Perfil de estudiante no encontrado', 404);
    }
    return profile;
  },

  /**
   * Actualiza disponibilidad y/o portfolio del estudiante autenticado.
   * Al menos uno de los campos debe estar presente.
   *
   * @param {string} userId
   * @param {{ availability?: boolean, portfolioUrl?: string }} data
   * @returns {Promise<object>} Perfil actualizado
   * @throws {HttpError} 400 si no se provee ningún campo
   * @throws {HttpError} 404 si no existe el perfil
   */
  async updateProfile(userId, { availability, portfolioUrl }) {
    if (availability === undefined && portfolioUrl === undefined) {
      throw new HttpError('Debe proporcionar al menos un campo para actualizar', 400);
    }

    const existing = await StudentsRepository.findByUserId(userId);
    if (!existing) {
      throw new HttpError('Perfil de estudiante no encontrado', 404);
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await StudentsRepository.update(
        { userId, availability, portfolioUrl },
        client,
      );
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    return StudentsRepository.findByUserId(userId);
  },

  /**
   * Reemplaza las habilidades del estudiante autenticado.
   *
   * @param {string} userId
   * @param {{ skill_id: string, level: string }[]} skills
   * @returns {Promise<object>} Perfil actualizado con nuevas habilidades
   * @throws {HttpError} 400 si `skills` no es un array
   * @throws {HttpError} 400 si alguna habilidad tiene campos inválidos
   * @throws {HttpError} 404 si no existe el perfil
   */
  async updateSkills(userId, skills) {
    if (!Array.isArray(skills)) {
      throw new HttpError('El campo skills debe ser un array', 400);
    }

    const VALID_LEVELS = ['basic', 'intermediate', 'advanced'];
    for (const s of skills) {
      if (!s.skill_id || !s.level) {
        throw new HttpError('Cada habilidad debe tener skill_id y level', 400);
      }
      if (!VALID_LEVELS.includes(s.level)) {
        throw new HttpError(`Nivel inválido "${s.level}". Valores permitidos: ${VALID_LEVELS.join(', ')}`, 400);
      }
    }

    const existing = await StudentsRepository.findByUserId(userId);
    if (!existing) {
      throw new HttpError('Perfil de estudiante no encontrado', 404);
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await StudentsRepository.upsertSkills(userId, skills, client);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    return StudentsRepository.findByUserId(userId);
  },
};

export default StudentsService;
