import ReviewsService from '../services/reviews.service.js';

/**
 * Controlador para valoraciones.
 */
const ReviewsController = {
  /**
   * POST /reviews
   * Crear una valoración.
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async create(req, res) {
    const { assignment_id, rating, comment } = req.body;
    const review = await ReviewsService.create(req.user.id, {
      assignmentId: assignment_id,
      rating,
      comment,
    });
    return res.status(201).json(review);
  },

  /**
   * GET /reviews/:user_id
   * Listar valoraciones recibidas por un usuario.
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async getByUser(req, res) {
    const reviews = await ReviewsService.getByUser(req.params.user_id);
    return res.status(200).json(reviews);
  },
};

export default ReviewsController;
