import pool from '../config/db.js';
import AssignmentsRepository from '../repositories/assignments.repository.js';
import ApplicationsRepository from '../repositories/applications.repository.js';
import ProjectsRepository from '../repositories/projects.repository.js';
import { HttpError } from '../utils/errors.js';

/**
 * Lógica de negocio para asignaciones de proyectos.
 */
const AssignmentsService = {
  /**
   * Selecciona un candidato y crea la asignación.
   * En una sola transacción:
   * 1. Aprueba la application seleccionada
   * 2. Rechaza el resto de applications del proyecto
   * 3. Crea el assignment
   * 4. Pasa el proyecto a 'assigned'
   *
   * @param {string} ngoId - UUID de la ONG autenticada
   * @param {{ applicationId: string }} data
   * @returns {Promise<object>} Assignment creado
   * @throws {HttpError} 400 si falta applicationId
   * @throws {HttpError} 404 si la application o el proyecto no existen
   * @throws {HttpError} 403 si la ONG no es propietaria
   * @throws {HttpError} 400 si la application no está en pending
   * @throws {HttpError} 400 si el proyecto no está en pending
   */
  async create(ngoId, { applicationId }) {
    if (!applicationId) {
      throw new HttpError('El campo application_id es requerido', 400);
    }

    // Verificar que la application existe
    const application = await ApplicationsRepository.findById(applicationId);
    if (!application) {
      throw new HttpError('Aplicación no encontrada', 404);
    }

    // Verificar que la application está en pending
    if (application.status !== 'pending') {
      throw new HttpError('Solo se puede asignar una aplicación en estado pending', 400);
    }

    // Verificar que el proyecto existe
    const project = await ProjectsRepository.findById(application.project_id);
    if (!project) {
      throw new HttpError('Proyecto no encontrado', 404);
    }

    // Verificar que la ONG es propietaria
    if (project.ngo_id !== ngoId) {
      throw new HttpError('No tienes permiso para asignar candidatos a este proyecto', 403);
    }

    // Verificar que el proyecto está en pending
    if (project.status !== 'pending') {
      throw new HttpError('Solo se puede asignar candidatos a proyectos en estado pending', 400);
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Aprobar la application seleccionada
      await ApplicationsRepository.updateStatus(applicationId, 'approved', client);

      // 2. Rechazar el resto de applications del proyecto
      await ApplicationsRepository.rejectAllExcept(application.project_id, applicationId, client);

      // 3. Crear el assignment
      const assignment = await AssignmentsRepository.create(
        { projectId: application.project_id, studentId: application.student_id },
        client,
      );

      // 4. Pasar el proyecto a 'assigned'
      await ProjectsRepository.updateStatus(application.project_id, 'assigned', client);

      await client.query('COMMIT');
      return assignment;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * Devuelve el assignment de un proyecto.
   *
   * @param {string} id - UUID del assignment
   * @returns {Promise<object>}
   * @throws {HttpError} 404 si no existe
   */
  /**
   * El estudiante acepta la asignación y empieza a trabajar.
   * Transiciona el proyecto de 'assigned' a 'in_progress'.
   *
   * @param {string} assignmentId - UUID del assignment
   * @param {string} studentId - UUID del estudiante autenticado
   * @returns {Promise<object>} Assignment aceptado
   * @throws {HttpError} 404 si el assignment no existe
   * @throws {HttpError} 403 si el estudiante no es el asignado
   * @throws {HttpError} 400 si el proyecto no está en 'assigned'
   */
  async accept(assignmentId, studentId) {
    const assignment = await AssignmentsRepository.findById(assignmentId);
    if (!assignment) {
      throw new HttpError('Asignación no encontrada', 404);
    }

    if (assignment.student_id !== studentId) {
      throw new HttpError('No tienes permiso para aceptar esta asignación', 403);
    }

    const project = await ProjectsRepository.findById(assignment.project_id);
    if (!project || project.status !== 'assigned') {
      throw new HttpError('El proyecto no está en estado assigned', 400);
    }

    await ProjectsRepository.updateStatus(assignment.project_id, 'in_progress');
    return assignment;
  },

  async getById(id) {
    const assignment = await AssignmentsRepository.findById(id);
    if (!assignment) {
      throw new HttpError('Asignación no encontrada', 404);
    }
    return assignment;
  },
};

export default AssignmentsService;
