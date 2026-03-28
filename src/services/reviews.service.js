import ReviewsRepository from '../repositories/reviews.repository.js';
import AssignmentsRepository from '../repositories/assignments.repository.js';
import ProjectsRepository from '../repositories/projects.repository.js';
import { HttpError } from '../utils/errors.js';

/**
 * Lógica de negocio para valoraciones.
 */
const ReviewsService = {
  /**
   * Crea una valoración.
   * Solo se puede valorar si hay un assignment completado entre los dos usuarios.
   * Solo una valoración por usuario por assignment.
   *
   * @param {string} fromUserId - UUID del usuario que valora
   * @param {{ assignmentId: string, rating: number, comment?: string }} data
   * @returns {Promise<object>} Review creada
   * @throws {HttpError} 400 si faltan campos o rating fuera de rango
   * @throws {HttpError} 404 si el assignment no existe
   * @throws {HttpError} 400 si el proyecto no está en completed
   * @throws {HttpError} 403 si el usuario no participó en el assignment
   * @throws {HttpError} 409 si ya valoró en este assignment
   */
  async create(fromUserId, { assignmentId, rating, comment }) {
    if (!assignmentId) {
      throw new HttpError('El campo assignment_id es requerido', 400);
    }
    if (rating === undefined || rating === null) {
      throw new HttpError('El campo rating es requerido', 400);
    }
    if (rating < 1 || rating > 5) {
      throw new HttpError('El rating debe estar entre 1.0 y 5.0', 400);
    }

    // Verificar que el assignment existe
    const assignment = await AssignmentsRepository.findById(assignmentId);
    if (!assignment) {
      throw new HttpError('Asignación no encontrada', 404);
    }

    // Verificar que el proyecto está en completed
    const project = await ProjectsRepository.findById(assignment.project_id);
    if (!project || project.status !== 'completed') {
      throw new HttpError('Solo se puede valorar en proyectos completados', 400);
    }

    // Verificar que el usuario participó en el assignment
    const isStudent = assignment.student_id === fromUserId;
    const isNgo = project.ngo_id === fromUserId;
    if (!isStudent && !isNgo) {
      throw new HttpError('No participaste en este proyecto', 403);
    }

    // Determinar a quién se valora (la otra parte)
    const toUserId = isStudent ? project.ngo_id : assignment.student_id;

    // Verificar que no haya valorado ya
    const existing = await ReviewsRepository.findByAssignmentAndUser(assignmentId, fromUserId);
    if (existing) {
      throw new HttpError('Ya has valorado en este proyecto', 409);
    }

    return ReviewsRepository.create({
      assignmentId,
      fromUser: fromUserId,
      toUser: toUserId,
      rating,
      comment,
    });
  },

  /**
   * Devuelve las valoraciones recibidas por un usuario.
   *
   * @param {string} userId
   * @returns {Promise<object[]>}
   * @throws {HttpError} 400 si falta userId
   */
  async getByUser(userId) {
    if (!userId) {
      throw new HttpError('El parámetro user_id es requerido', 400);
    }
    return ReviewsRepository.findByUser(userId);
  },
};

export default ReviewsService;
