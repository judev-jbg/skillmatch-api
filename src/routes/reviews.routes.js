import { Router } from 'express';
import ReviewsController from '../controllers/reviews.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * @openapi
 * /reviews:
 *   post:
 *     tags:
 *       - Reviews
 *     summary: Crear una valoracion
 *     description: >
 *       Valorar a la otra parte de un proyecto completado.
 *       El estudiante valora a la ONG, o la ONG valora al estudiante.
 *       Solo una valoracion por usuario por proyecto.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - assignment_id
 *               - rating
 *             properties:
 *               assignment_id:
 *                 type: string
 *                 format: uuid
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 4.5
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Valoracion creada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Review'
 *       400:
 *         description: Validacion fallida (campos, rating, proyecto no completado)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: No participaste en este proyecto
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Assignment no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Ya has valorado en este proyecto
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', verifyToken, ReviewsController.create);

/**
 * @openapi
 * /reviews/{user_id}:
 *   get:
 *     tags:
 *       - Reviews
 *     summary: Listar valoraciones recibidas por un usuario
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Lista de valoraciones
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Review'
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:user_id', verifyToken, ReviewsController.getByUser);

export default router;
