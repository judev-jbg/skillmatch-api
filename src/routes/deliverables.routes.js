import { Router } from 'express';
import DeliverablesController from '../controllers/deliverables.controller.js';
import { verifyToken, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * @openapi
 * /deliverables:
 *   post:
 *     tags:
 *       - Deliverables
 *     summary: Crear un entregable
 *     description: La ONG define un entregable (hito) para un assignment.
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
 *               - title
 *             properties:
 *               assignment_id:
 *                 type: string
 *                 format: uuid
 *               title:
 *                 type: string
 *                 example: Diseno de la base de datos
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Entregable creado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Deliverable'
 *       400:
 *         description: Validacion fallida
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
 *         description: Assignment no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', verifyToken, requireRole('ngo'), DeliverablesController.create);

/**
 * @openapi
 * /deliverables:
 *   get:
 *     tags:
 *       - Deliverables
 *     summary: Listar entregables de un assignment
 *     description: Accesible por la ONG propietaria o el estudiante asignado.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: assignment_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Lista de entregables
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Deliverable'
 *       400:
 *         description: Falta assignment_id
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
 *         description: No tienes permiso
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
router.get('/', verifyToken, DeliverablesController.getByAssignment);

/**
 * @openapi
 * /deliverables/{id}:
 *   get:
 *     tags:
 *       - Deliverables
 *     summary: Obtener detalle de un entregable
 *     description: Accesible por la ONG propietaria del proyecto o el estudiante asignado.
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
 *         description: Detalle del entregable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Deliverable'
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: No tienes permiso para ver este entregable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Entregable no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', verifyToken, DeliverablesController.getById);

/**
 * @openapi
 * /deliverables/{id}/start:
 *   put:
 *     tags:
 *       - Deliverables
 *     summary: Empezar a trabajar en un entregable
 *     description: >
 *       El estudiante empieza un entregable (pending -> in_progress).
 *       Tambien permite reintentar un entregable rechazado (rejected -> in_progress),
 *       en cuyo caso el proyecto vuelve a in_progress. Solo uno activo a la vez.
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
 *         description: Entregable en progreso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Deliverable'
 *       400:
 *         description: No esta en pending ni rejected, o ya hay un entregable activo
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
 *         description: Entregable no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id/start', verifyToken, requireRole('student'), DeliverablesController.startWork);

/**
 * @openapi
 * /deliverables/{id}/submit:
 *   put:
 *     tags:
 *       - Deliverables
 *     summary: Enviar entregable a revision
 *     description: El estudiante sube el archivo y envia a revision (in_progress -> in_review). El proyecto pasa a in_review.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - file_url
 *             properties:
 *               file_url:
 *                 type: string
 *                 format: uri
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Entregable enviado a revision
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Deliverable'
 *       400:
 *         description: No esta en in_progress o falta file_url
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
 *         description: Entregable no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id/submit', verifyToken, requireRole('student'), DeliverablesController.submitForReview);

/**
 * @openapi
 * /deliverables/{id}/review:
 *   put:
 *     tags:
 *       - Deliverables
 *     summary: Aprobar o rechazar un entregable
 *     description: >
 *       La ONG revisa un entregable. Si aprueba y es el ultimo, el proyecto pasa a completed.
 *       Si rechaza, el proyecto pasa a rejected.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [approved, rejected]
 *     responses:
 *       200:
 *         description: Entregable revisado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Deliverable'
 *       400:
 *         description: Status invalido o entregable no esta en in_review
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
 *         description: Entregable no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id/review', verifyToken, requireRole('ngo'), DeliverablesController.review);

export default router;
