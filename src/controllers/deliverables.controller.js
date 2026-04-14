import DeliverablesService from '../services/deliverables.service.js';

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
    const deliverable = await DeliverablesService.create(req.user.id, {
      assignmentId: assignment_id,
      title,
      description,
    });
    return res.status(201).json(deliverable);
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
    const deliverables = await DeliverablesService.getByAssignment(assignment_id, req.user.id);
    return res.status(200).json(deliverables);
  },

  /**
   * PUT /deliverables/:id/start
   * El estudiante empieza a trabajar en un entregable.
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async startWork(req, res) {
    const deliverable = await DeliverablesService.startWork(req.params.id, req.user.id);
    return res.status(200).json(deliverable);
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
    const deliverable = await DeliverablesService.submitForReview(req.params.id, req.user.id, {
      fileUrl: file_url,
      comment,
    });
    return res.status(200).json(deliverable);
  },

  /**
   * PUT /deliverables/:id/review
   * La ONG aprueba o rechaza un entregable.
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async review(req, res) {
    const { status } = req.body;
    const deliverable = await DeliverablesService.review(req.params.id, req.user.id, { status });
    return res.status(200).json(deliverable);
  },
};

export default DeliverablesController;
