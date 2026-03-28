import DeliverablesRepository from '../repositories/deliverables.repository.js';
import AssignmentsRepository from '../repositories/assignments.repository.js';
import ProjectsRepository from '../repositories/projects.repository.js';
import { HttpError } from '../utils/errors.js';

/**
 * Lógica de negocio para entregables.
 */
const DeliverablesService = {
  /**
   * La ONG crea un entregable para un assignment.
   *
   * @param {string} ngoId - UUID de la ONG autenticada
   * @param {{ assignmentId: string, title: string, description?: string }} data
   * @returns {Promise<object>} Entregable creado
   * @throws {HttpError} 400 si faltan campos requeridos
   * @throws {HttpError} 404 si el assignment no existe
   * @throws {HttpError} 403 si la ONG no es propietaria del proyecto
   */
  async create(ngoId, { assignmentId, title, description }) {
    if (!assignmentId) {
      throw new HttpError('El campo assignment_id es requerido', 400);
    }
    if (!title) {
      throw new HttpError('El campo title es requerido', 400);
    }

    const assignment = await AssignmentsRepository.findById(assignmentId);
    if (!assignment) {
      throw new HttpError('Asignación no encontrada', 404);
    }

    const project = await ProjectsRepository.findById(assignment.project_id);
    if (!project || project.ngo_id !== ngoId) {
      throw new HttpError('No tienes permiso para crear entregables en este proyecto', 403);
    }

    return DeliverablesRepository.create({ assignmentId, title, description });
  },

  /**
   * Lista los entregables de un assignment.
   * Solo la ONG propietaria o el estudiante asignado pueden ver.
   *
   * @param {string} assignmentId
   * @param {string} userId - UUID del usuario autenticado
   * @returns {Promise<object[]>}
   * @throws {HttpError} 400 si falta assignmentId
   * @throws {HttpError} 404 si el assignment no existe
   * @throws {HttpError} 403 si no tiene permiso
   */
  async getByAssignment(assignmentId, userId) {
    if (!assignmentId) {
      throw new HttpError('El parámetro assignment_id es requerido', 400);
    }

    const assignment = await AssignmentsRepository.findById(assignmentId);
    if (!assignment) {
      throw new HttpError('Asignación no encontrada', 404);
    }

    const project = await ProjectsRepository.findById(assignment.project_id);
    const isNgo = project && project.ngo_id === userId;
    const isStudent = assignment.student_id === userId;

    if (!isNgo && !isStudent) {
      throw new HttpError('No tienes permiso para ver los entregables de esta asignación', 403);
    }

    return DeliverablesRepository.findByAssignment(assignmentId);
  },

  /**
   * El estudiante empieza a trabajar en un entregable.
   * Transiciona de 'pending' a 'in_progress'.
   * Solo un entregable activo a la vez por assignment.
   *
   * @param {string} deliverableId
   * @param {string} studentId - UUID del estudiante autenticado
   * @returns {Promise<object>} Entregable actualizado
   * @throws {HttpError} 404 si el entregable no existe
   * @throws {HttpError} 403 si no es el estudiante asignado
   * @throws {HttpError} 400 si el entregable no está en pending
   * @throws {HttpError} 400 si ya hay un entregable activo
   */
  async startWork(deliverableId, studentId) {
    const deliverable = await DeliverablesRepository.findById(deliverableId);
    if (!deliverable) {
      throw new HttpError('Entregable no encontrado', 404);
    }

    const assignment = await AssignmentsRepository.findById(deliverable.assignment_id);
    if (!assignment || assignment.student_id !== studentId) {
      throw new HttpError('No tienes permiso para trabajar en este entregable', 403);
    }

    if (deliverable.status !== 'pending') {
      throw new HttpError('Solo se puede empezar un entregable en estado pending', 400);
    }

    const hasActive = await DeliverablesRepository.hasActiveDeliverable(deliverable.assignment_id);
    if (hasActive) {
      throw new HttpError('Ya hay un entregable activo en esta asignación', 400);
    }

    return DeliverablesRepository.update(deliverableId, { status: 'in_progress' });
  },

  /**
   * El estudiante envía un entregable a revisión.
   * Transiciona de 'in_progress' a 'in_review'.
   * El proyecto pasa a 'in_review'.
   *
   * @param {string} deliverableId
   * @param {string} studentId - UUID del estudiante autenticado
   * @param {{ fileUrl: string, comment?: string }} data
   * @returns {Promise<object>} Entregable actualizado
   * @throws {HttpError} 404 si el entregable no existe
   * @throws {HttpError} 403 si no es el estudiante asignado
   * @throws {HttpError} 400 si el entregable no está en in_progress
   * @throws {HttpError} 400 si falta file_url
   */
  async submitForReview(deliverableId, studentId, { fileUrl, comment }) {
    if (!fileUrl) {
      throw new HttpError('El campo file_url es requerido para enviar a revisión', 400);
    }

    const deliverable = await DeliverablesRepository.findById(deliverableId);
    if (!deliverable) {
      throw new HttpError('Entregable no encontrado', 404);
    }

    const assignment = await AssignmentsRepository.findById(deliverable.assignment_id);
    if (!assignment || assignment.student_id !== studentId) {
      throw new HttpError('No tienes permiso para enviar este entregable', 403);
    }

    if (deliverable.status !== 'in_progress') {
      throw new HttpError('Solo se puede enviar a revisión un entregable en estado in_progress', 400);
    }

    // Actualizar entregable
    const updated = await DeliverablesRepository.update(deliverableId, {
      fileUrl,
      comment,
      status: 'in_review',
    });

    // Transicionar proyecto a in_review
    await ProjectsRepository.updateStatus(assignment.project_id, 'in_review');

    return updated;
  },

  /**
   * La ONG aprueba o rechaza un entregable.
   * - Si aprueba: entregable → approved. Si todos están approved → proyecto a completed. Si no → proyecto a in_progress.
   * - Si rechaza: entregable → rejected, proyecto → rejected.
   *
   * @param {string} deliverableId
   * @param {string} ngoId - UUID de la ONG autenticada
   * @param {{ status: string }} data - 'approved' o 'rejected'
   * @returns {Promise<object>} Entregable actualizado
   * @throws {HttpError} 400 si status no es approved/rejected
   * @throws {HttpError} 404 si el entregable no existe
   * @throws {HttpError} 403 si la ONG no es propietaria
   * @throws {HttpError} 400 si el entregable no está en in_review
   */
  async review(deliverableId, ngoId, { status }) {
    if (!status || !['approved', 'rejected'].includes(status)) {
      throw new HttpError('El campo status debe ser approved o rejected', 400);
    }

    const deliverable = await DeliverablesRepository.findById(deliverableId);
    if (!deliverable) {
      throw new HttpError('Entregable no encontrado', 404);
    }

    if (deliverable.status !== 'in_review') {
      throw new HttpError('Solo se puede revisar un entregable en estado in_review', 400);
    }

    const assignment = await AssignmentsRepository.findById(deliverable.assignment_id);
    const project = await ProjectsRepository.findById(assignment.project_id);
    if (!project || project.ngo_id !== ngoId) {
      throw new HttpError('No tienes permiso para revisar este entregable', 403);
    }

    // Actualizar estado del entregable
    const updated = await DeliverablesRepository.update(deliverableId, { status });

    if (status === 'rejected') {
      // Proyecto pasa a rejected
      await ProjectsRepository.updateStatus(assignment.project_id, 'rejected');
    } else {
      // Comprobar si todos los entregables están approved
      const all = await DeliverablesRepository.findByAssignment(deliverable.assignment_id);
      const allApproved = all.every(d => d.status === 'approved');

      if (allApproved) {
        // Todos aprobados → proyecto completado, cerrar assignment
        await ProjectsRepository.updateStatus(assignment.project_id, 'completed');
        await AssignmentsRepository.setEndDate(assignment.id);
      } else {
        // Quedan más → proyecto vuelve a in_progress
        await ProjectsRepository.updateStatus(assignment.project_id, 'in_progress');
      }
    }

    return updated;
  },
};

export default DeliverablesService;
