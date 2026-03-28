import AssignmentsService from '../services/assignments.service.js';
import { HttpError } from '../utils/errors.js';

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
    try {
      const assignment = await AssignmentsService.create(req.user.id, { applicationId: application_id });
      return res.status(201).json(assignment);
    } catch (err) {
      if (err instanceof HttpError) {
        return res.status(err.statusCode).json({ message: err.message });
      }
      console.error('[AssignmentsController.create]', err);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  },

  /**
   * GET /assignments/:id
   * Devuelve el detalle de una asignación.
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  /**
   * PUT /assignments/:id/accept
   * El estudiante acepta la asignación y empieza a trabajar.
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async accept(req, res) {
    try {
      const assignment = await AssignmentsService.accept(req.params.id, req.user.id);
      return res.status(200).json(assignment);
    } catch (err) {
      if (err instanceof HttpError) {
        return res.status(err.statusCode).json({ message: err.message });
      }
      console.error('[AssignmentsController.accept]', err);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  },

  async getById(req, res) {
    try {
      const assignment = await AssignmentsService.getById(req.params.id);
      return res.status(200).json(assignment);
    } catch (err) {
      if (err instanceof HttpError) {
        return res.status(err.statusCode).json({ message: err.message });
      }
      console.error('[AssignmentsController.getById]', err);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  },
};

export default AssignmentsController;
