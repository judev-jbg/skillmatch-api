import AssignmentsService from '../services/assignments.service.js';

/**
 * Controlador para la gestión de asignaciones.
 */
const AssignmentsController = {
  /**
   * POST /assignments
   * Selecciona un candidato y crea la asignación.
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async create(req, res) {
    const { application_id } = req.body;
    const assignment = await AssignmentsService.create(req.user.id, { applicationId: application_id });
    return res.status(201).json(assignment);
  },

  /**
   * PUT /assignments/:id/accept
   * El estudiante acepta la asignación y empieza a trabajar.
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async accept(req, res) {
    const assignment = await AssignmentsService.accept(req.params.id, req.user.id);
    return res.status(200).json(assignment);
  },

  async getById(req, res) {
    const assignment = await AssignmentsService.getById(req.params.id);
    return res.status(200).json(assignment);
  },
};

export default AssignmentsController;
