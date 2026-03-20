import pool from '../config/db.js';
import ProjectsRepository from '../repositories/projects.repository.js';
import { HttpError } from '../utils/errors.js';

const VALID_STATUSES = ['pending', 'assigned', 'in_progress', 'in_review', 'rejected', 'approved', 'finished'];
const VALID_LEVELS = ['basic', 'intermediate', 'advanced'];

/**
 * Valida el array de skills de proyecto.
 * @param {any} skills
 * @throws {HttpError} 400 si el formato es inválido
 */
function validateSkills(skills) {
  if (!Array.isArray(skills)) {
    throw new HttpError('El campo skills debe ser un array', 400);
  }
  for (const s of skills) {
    if (!s.skill_id || !s.required_level) {
      throw new HttpError('Cada skill debe tener skill_id y required_level', 400);
    }
    if (!VALID_LEVELS.includes(s.required_level)) {
      throw new HttpError(`Nivel inválido "${s.required_level}". Permitidos: ${VALID_LEVELS.join(', ')}`, 400);
    }
  }
}

/**
 * Lógica de negocio para proyectos.
 */
const ProjectsService = {
  /**
   * Crea un proyecto con sus skills opcionales.
   * Solo una ONG verificada puede crear proyectos.
   *
   * @param {string} ngoId - UUID del usuario ONG autenticado
   * @param {{ title: string, description?: string, objectives?: string, estimatedHours?: number, deadline?: string, modality?: string, skills?: { skill_id: string, required_level: string }[] }} data
   * @returns {Promise<object>} Proyecto creado con skills
   * @throws {HttpError} 400 si title no está presente o skills inválidas
   */
  async create(ngoId, { title, description, objectives, estimatedHours, deadline, modality, skills = [] }) {
    if (!title) {
      throw new HttpError('El campo title es requerido', 400);
    }
    validateSkills(skills);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const project = await ProjectsRepository.create(
        { ngoId, title, description, objectives, estimatedHours, deadline, modality },
        client,
      );
      if (skills.length > 0) {
        await ProjectsRepository.upsertSkills(project.id, skills, client);
      }
      await client.query('COMMIT');
      return ProjectsRepository.findById(project.id);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * Devuelve todos los proyectos con filtros opcionales.
   *
   * @param {{ status?: string, skillId?: string }} query
   * @returns {Promise<object[]>}
   * @throws {HttpError} 400 si el status no es válido
   */
  async getAll({ status, skillId } = {}) {
    if (status && !VALID_STATUSES.includes(status)) {
      throw new HttpError(`Status inválido. Permitidos: ${VALID_STATUSES.join(', ')}`, 400);
    }
    return ProjectsRepository.findAll({ status, skillId });
  },

  /**
   * Devuelve un proyecto por ID.
   *
   * @param {string} id
   * @returns {Promise<object>}
   * @throws {HttpError} 404 si no existe
   */
  async getById(id) {
    const project = await ProjectsRepository.findById(id);
    if (!project) {
      throw new HttpError('Proyecto no encontrado', 404);
    }
    return project;
  },

  /**
   * Actualiza los campos de un proyecto.
   * Solo la ONG propietaria puede editarlo.
   *
   * @param {string} id
   * @param {string} ngoId - UUID del usuario ONG autenticado
   * @param {{ title?: string, description?: string, objectives?: string, estimatedHours?: number, deadline?: string, modality?: string }} data
   * @returns {Promise<object>} Proyecto actualizado
   * @throws {HttpError} 404 si no existe
   * @throws {HttpError} 403 si la ONG no es propietaria
   * @throws {HttpError} 400 si no se provee ningún campo
   */
  async update(id, ngoId, { title, description, objectives, estimatedHours, deadline, modality }) {
    if (!title && !description && !objectives && !estimatedHours && !deadline && !modality) {
      throw new HttpError('Debe proporcionar al menos un campo para actualizar', 400);
    }

    const existing = await ProjectsRepository.findById(id);
    if (!existing) {
      throw new HttpError('Proyecto no encontrado', 404);
    }
    if (existing.ngo_id !== ngoId) {
      throw new HttpError('No tienes permiso para editar este proyecto', 403);
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await ProjectsRepository.update(id, { title, description, objectives, estimatedHours, deadline, modality }, client);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    return ProjectsRepository.findById(id);
  },

  /**
   * Reemplaza las skills requeridas de un proyecto.
   * Solo la ONG propietaria puede modificarlas.
   *
   * @param {string} id
   * @param {string} ngoId - UUID del usuario ONG autenticado
   * @param {{ skill_id: string, required_level: string }[]} skills
   * @returns {Promise<object>} Proyecto actualizado con skills
   * @throws {HttpError} 404 si no existe
   * @throws {HttpError} 403 si la ONG no es propietaria
   * @throws {HttpError} 400 si las skills tienen formato inválido
   */
  async updateSkills(id, ngoId, skills) {
    validateSkills(skills);

    const existing = await ProjectsRepository.findById(id);
    if (!existing) {
      throw new HttpError('Proyecto no encontrado', 404);
    }
    if (existing.ngo_id !== ngoId) {
      throw new HttpError('No tienes permiso para editar este proyecto', 403);
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await ProjectsRepository.upsertSkills(id, skills, client);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    return ProjectsRepository.findById(id);
  },
};

export default ProjectsService;
