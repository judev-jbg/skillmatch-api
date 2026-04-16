import pool from '../config/db.js';
import ProjectsRepository from '../repositories/projects.repository.js';
import AssignmentsRepository from '../repositories/assignments.repository.js';
import CertificatesService from './certificates.service.js';
import { HttpError } from '../utils/errors.js';

const VALID_STATUSES = ['pending', 'assigned', 'in_progress', 'in_review', 'rejected', 'completed', 'cancelled'];
const VALID_LEVELS = ['basic', 'intermediate', 'advanced'];

/**
 * Mapa de transiciones de estado válidas.
 * Cada clave es el estado actual, el array son los estados destino permitidos.
 */
const VALID_TRANSITIONS = {
  pending:     ['assigned', 'cancelled'],
  assigned:    ['in_progress', 'cancelled'],
  in_progress: ['in_review', 'cancelled'],
  in_review:   ['in_progress', 'rejected', 'completed', 'cancelled'],
  rejected:    ['in_progress', 'in_review', 'cancelled'],
  completed:   [],
  cancelled:   [],
};

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
   * Devuelve los proyectos de la ONG autenticada con filtros opcionales.
   *
   * @param {string} ngoId - UUID de la ONG autenticada
   * @param {{ status?: string, skillId?: string }} query
   * @returns {Promise<object[]>}
   * @throws {HttpError} 400 si el status no es válido
   */
  async getOwn(ngoId, { status, skillId } = {}) {
    if (status && !VALID_STATUSES.includes(status)) {
      throw new HttpError(`Status inválido. Permitidos: ${VALID_STATUSES.join(', ')}`, 400);
    }
    return ProjectsRepository.findAll({ ngoId, status, skillId });
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

  /**
   * Cambia el estado de un proyecto validando la transición.
   * Reutilizable por otros services (assignments, deliverables).
   *
   * @param {string} id - UUID del proyecto
   * @param {string} newStatus - Estado destino
   * @param {string} userId - UUID del usuario que hace la acción
   * @param {import('pg').PoolClient} [client] - Cliente de transacción (opcional)
   * @returns {Promise<object>} Proyecto actualizado
   * @throws {HttpError} 404 si no existe
   * @throws {HttpError} 403 si el usuario no tiene permiso
   * @throws {HttpError} 400 si la transición no es válida
   */
  async transitionStatus(id, newStatus, userId, client) {
    const project = await ProjectsRepository.findById(id);
    if (!project) {
      throw new HttpError('Proyecto no encontrado', 404);
    }

    // Verificar que el usuario es la ONG propietaria
    if (project.ngo_id !== userId) {
      throw new HttpError('No tienes permiso para cambiar el estado de este proyecto', 403);
    }

    // Validar que la transición es legal
    const allowed = VALID_TRANSITIONS[project.status];
    if (!allowed || !allowed.includes(newStatus)) {
      throw new HttpError(
        `Transición no permitida: ${project.status} → ${newStatus}. Permitidas: ${allowed.join(', ') || 'ninguna'}`,
        400,
      );
    }

    // Si el destino es 'completed', cerrar assignment, generar certificado y actualizar estado en transacción
    if (newStatus === 'completed') {
      const assignment = await AssignmentsRepository.findByProject(id);
      const txClient = await pool.connect();
      try {
        await txClient.query('BEGIN');
        if (assignment) {
          await AssignmentsRepository.setEndDate(assignment.id, txClient);
        }
        await CertificatesService.generate(id, txClient);
        const updated = await ProjectsRepository.updateStatus(id, newStatus, txClient);
        await txClient.query('COMMIT');
        return updated;
      } catch (err) {
        await txClient.query('ROLLBACK');
        throw err;
      } finally {
        txClient.release();
      }
    }

    return ProjectsRepository.updateStatus(id, newStatus, client);
  },

  /**
   * Cancela un proyecto.
   * Puede cancelar la ONG propietaria o el estudiante asignado.
   * No se puede cancelar un proyecto en 'completed'.
   *
   * @param {string} id - UUID del proyecto
   * @param {string} userId - UUID del usuario que cancela
   * @returns {Promise<object>} Proyecto cancelado
   * @throws {HttpError} 404 si no existe
   * @throws {HttpError} 403 si el usuario no tiene permiso
   * @throws {HttpError} 400 si el proyecto está en completed
   */
  async cancel(id, userId) {
    const project = await ProjectsRepository.findById(id);
    if (!project) {
      throw new HttpError('Proyecto no encontrado', 404);
    }

    if (project.status === 'completed') {
      throw new HttpError('No se puede cancelar un proyecto completado', 400);
    }

    if (project.status === 'cancelled') {
      throw new HttpError('El proyecto ya está cancelado', 400);
    }

    // Verificar que es la ONG propietaria o el estudiante asignado
    const isNgo = project.ngo_id === userId;
    let isStudent = false;

    const assignment = await AssignmentsRepository.findByProject(id);
    if (assignment) {
      isStudent = assignment.student_id === userId;
    }

    if (!isNgo && !isStudent) {
      throw new HttpError('No tienes permiso para cancelar este proyecto', 403);
    }

    // Cancelar y cerrar assignment si existe
    await ProjectsRepository.updateStatus(id, 'cancelled');
    if (assignment && !assignment.end_date) {
      await AssignmentsRepository.setEndDate(assignment.id);
    }

    return ProjectsRepository.findById(id);
  },
};

export default ProjectsService;
