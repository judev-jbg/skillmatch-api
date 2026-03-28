import { Router } from 'express';
import AssignmentsController from '../controllers/assignments.controller.js';
import { verifyToken, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * @openapi
 * /assignments:
 *   post:
 *     tags:
 *       - Assignments
 *     summary: Seleccionar candidato y crear asignacion
 *     description: >
 *       Aprueba la application seleccionada, rechaza el resto,
 *       crea el assignment y pasa el proyecto a 'assigned'.
 *       Solo la ONG propietaria del proyecto.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - application_id
 *             properties:
 *               application_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Assignment creado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Assignment'
 *       400:
 *         description: Validacion fallida (application no pending, proyecto no pending)
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
 *         description: No eres propietario del proyecto
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Application o proyecto no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', verifyToken, requireRole('ngo'), AssignmentsController.create);

/**
 * @openapi
 * /assignments/{id}:
 *   get:
 *     tags:
 *       - Assignments
 *     summary: Obtener detalle de una asignacion
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Detalle del assignment
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Assignment'
 *       401:
 *         description: No autenticado
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
 */
router.get('/:id', verifyToken, AssignmentsController.getById);

/**
 * @openapi
 * /assignments/{id}/accept:
 *   put:
 *     tags:
 *       - Assignments
 *     summary: Aceptar asignacion y empezar a trabajar
 *     description: El estudiante asignado acepta y el proyecto pasa de 'assigned' a 'in_progress'.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Asignacion aceptada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Assignment'
 *       400:
 *         description: Proyecto no esta en estado assigned
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
 *         description: No eres el estudiante asignado
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
 */
router.put('/:id/accept', verifyToken, requireRole('student'), AssignmentsController.accept);

export default router;
