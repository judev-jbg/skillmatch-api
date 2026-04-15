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
 * /assignments/me:
 *   get:
 *     tags:
 *       - Assignments
 *     summary: Listar mis assignments
 *     description: Devuelve todos los assignments del estudiante autenticado con datos básicos del proyecto.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Lista de assignments del estudiante
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Assignment'
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: No eres estudiante
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/me', verifyToken, requireRole('student'), AssignmentsController.getOwn);

/**
 * @openapi
 * /assignments:
 *   get:
 *     tags:
 *       - Assignments
 *     summary: Obtener el assignment de un proyecto (ONG)
 *     description: Devuelve el assignment del proyecto especificado. Solo accesible por la ONG propietaria.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: project_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID del proyecto
 *     responses:
 *       200:
 *         description: Assignment del proyecto
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Assignment'
 *       400:
 *         description: Falta el parámetro project_id
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
 *         description: El proyecto no pertenece a la ONG autenticada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Proyecto no encontrado o sin assignment
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', verifyToken, requireRole('ngo'), AssignmentsController.getByProject);

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
