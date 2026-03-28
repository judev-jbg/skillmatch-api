import DeliverablesService from '../services/deliverables.service.js';
import { HttpError } from '../utils/errors.js';

/**
 * Controlador para la gestión de entregables.
 */
const DeliverablesController = {
  /**
   * POST /deliverables
   * La ONG crea un entregable para un assignment.
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async create(req, res) {
    const { assignment_id, title, description } = req.body;
    try {
      const deliverable = await DeliverablesService.create(req.user.id, {
        assignmentId: assignment_id,
        title,
        description,
      });
      return res.status(201).json(deliverable);
    } catch (err) {
      if (err instanceof HttpError) {
        return res.status(err.statusCode).json({ message: err.message });
      }
      console.error('[DeliverablesController.create]', err);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  },

  /**
   * GET /deliverables?assignment_id=
   * Lista entregables de un assignment.
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async getByAssignment(req, res) {
    const { assignment_id } = req.query;
    try {
      const deliverables = await DeliverablesService.getByAssignment(assignment_id, req.user.id);
      return res.status(200).json(deliverables);
    } catch (err) {
      if (err instanceof HttpError) {
        return res.status(err.statusCode).json({ message: err.message });
      }
      console.error('[DeliverablesController.getByAssignment]', err);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  },

  /**
   * PUT /deliverables/:id/start
   * El estudiante empieza a trabajar en un entregable.
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async startWork(req, res) {
    try {
      const deliverable = await DeliverablesService.startWork(req.params.id, req.user.id);
      return res.status(200).json(deliverable);
    } catch (err) {
      if (err instanceof HttpError) {
        return res.status(err.statusCode).json({ message: err.message });
      }
      console.error('[DeliverablesController.startWork]', err);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  },

  /**
   * PUT /deliverables/:id/submit
   * El estudiante envía un entregable a revisión.
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async submitForReview(req, res) {
    const { file_url, comment } = req.body;
    try {
      const deliverable = await DeliverablesService.submitForReview(req.params.id, req.user.id, {
        fileUrl: file_url,
        comment,
      });
      return res.status(200).json(deliverable);
    } catch (err) {
      if (err instanceof HttpError) {
        return res.status(err.statusCode).json({ message: err.message });
      }
      console.error('[DeliverablesController.submitForReview]', err);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  },
};

export default DeliverablesController;
