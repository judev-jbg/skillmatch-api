import pool from '../config/db.js';
import ApplicationsRepository from '../repositories/applications.repository.js';
import ProjectsRepository from '../repositories/projects.repository.js';
import StudentsRepository from '../repositories/students.repository.js';
import calculateScore from './matching.service.js';
import { HttpError } from '../utils/errors.js';

const VALID_STATUSES = ['pending', 'approved', 'rejected'];

/**
 * Lógica de negocio para aplicaciones a proyectos.
 */
const ApplicationsService = {
  /**
   * Crea una aplicación de un estudiante a un proyecto.
   * Valida que el proyecto exista y que el estudiante no haya aplicado antes.
   *
   * @param {string} studentId - UUID del estudiante autenticado
   * @param {{ projectId: string }} data
   * @returns {Promise<object>} Aplicación creada
   * @throws {HttpError} 400 si falta projectId
   * @throws {HttpError} 404 si el proyecto no existe
   * @throws {HttpError} 409 si ya existe una aplicación
   */
  async create(studentId, { projectId }) {
    if (!projectId) {
      throw new HttpError('El campo project_id es requerido', 400);
    }

    const project = await ProjectsRepository.findById(projectId);
    if (!project) {
      throw new HttpError('Proyecto no encontrado', 404);
    }

    const student = await StudentsRepository.findByUserId(studentId);
    if (!student) {
      throw new HttpError('Estudiante no encontrado', 404);
    }

    const existing = await ApplicationsRepository.findByProjectAndStudent(projectId, studentId);
    if (existing) {
      throw new HttpError('Ya has aplicado a este proyecto', 409);
    }

    const compatibilityScore = calculateScore(student.skills, project.skills);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const application = await ApplicationsRepository.create({ projectId, studentId, compatibilityScore }, client);
      await client.query('COMMIT');
      return application;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * Devuelve todas las aplicaciones de un proyecto.
   * Solo la ONG propietaria puede consultar.
   *
   * @param {string} projectId
   * @param {string} ngoId - UUID de la ONG autenticada
   * @returns {Promise<object[]>}
   * @throws {HttpError} 400 si falta project_id
   * @throws {HttpError} 404 si el proyecto no existe
   * @throws {HttpError} 403 si la ONG no es propietaria
   */
  async getByProject(projectId, ngoId) {
    if (!projectId) {
      throw new HttpError('El parámetro project_id es requerido', 400);
    }

    const project = await ProjectsRepository.findById(projectId);
    if (!project) {
      throw new HttpError('Proyecto no encontrado', 404);
    }

    if (project.ngo_id !== ngoId) {
      throw new HttpError('No tienes permiso para ver las aplicaciones de este proyecto', 403);
    }

    return ApplicationsRepository.findByProject(projectId);
  },

  /**
   * Actualiza el estado de una aplicación.
   * Solo la ONG propietaria del proyecto puede cambiar el estado.
   *
   * @param {string} id - UUID de la aplicación
   * @param {string} ngoId - UUID de la ONG autenticada
   * @param {{ status: string }} data
   * @returns {Promise<object>} Aplicación actualizada
   * @throws {HttpError} 400 si status es inválido o falta
   * @throws {HttpError} 404 si la aplicación o el proyecto no existen
   * @throws {HttpError} 403 si la ONG no es propietaria
   */
  async updateStatus(id, ngoId, { status }) {
    if (!status) {
      throw new HttpError('El campo status es requerido', 400);
    }
    if (!VALID_STATUSES.includes(status)) {
      throw new HttpError(`Status inválido. Permitidos: ${VALID_STATUSES.join(', ')}`, 400);
    }

    const application = await ApplicationsRepository.findById(id);
    if (!application) {
      throw new HttpError('Aplicación no encontrada', 404);
    }

    const project = await ProjectsRepository.findById(application.project_id);
    if (!project) {
      throw new HttpError('Proyecto no encontrado', 404);
    }

    if (project.ngo_id !== ngoId) {
      throw new HttpError('No tienes permiso para actualizar esta aplicación', 403);
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const updated = await ApplicationsRepository.updateStatus(id, status, client);
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

export default ApplicationsService;
