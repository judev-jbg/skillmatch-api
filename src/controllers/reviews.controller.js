import ReviewsService from '../services/reviews.service.js';
import { HttpError } from '../utils/errors.js';

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
    try {
      const review = await ReviewsService.create(req.user.id, {
        assignmentId: assignment_id,
        rating,
        comment,
      });
      return res.status(201).json(review);
    } catch (err) {
      if (err instanceof HttpError) {
        return res.status(err.statusCode).json({ message: err.message });
      }
      console.error('[ReviewsController.create]', err);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  },

  /**
   * GET /reviews/:user_id
   * Listar valoraciones recibidas por un usuario.
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async getByUser(req, res) {
    try {
      const reviews = await ReviewsService.getByUser(req.params.user_id);
      return res.status(200).json(reviews);
    } catch (err) {
      if (err instanceof HttpError) {
        return res.status(err.statusCode).json({ message: err.message });
      }
      console.error('[ReviewsController.getByUser]', err);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  },
};

export default ReviewsController;
