import { Router } from 'express';
import ApplicationsController from '../controllers/applications.controller.js';
import { verifyToken, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * @openapi
 * /applications:
 *   post:
 *     tags:
 *       - Applications
 *     summary: Aplicar a un proyecto
 *     description: Solo estudiantes autenticados. No se permite aplicar dos veces al mismo proyecto.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - project_id
 *             properties:
 *               project_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Aplicación creada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Application'
 *       400:
 *         description: Falta project_id
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
 *         description: Acceso denegado (no es estudiante)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Proyecto no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Ya existe una aplicación para este proyecto
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', verifyToken, requireRole('student'), ApplicationsController.create);

/**
 * @openapi
 * /applications:
 *   get:
 *     tags:
 *       - Applications
 *     summary: Listar aplicaciones de un proyecto
 *     description: Solo la ONG propietaria del proyecto puede consultar.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: project_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Lista de aplicaciones con datos del estudiante
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Application'
 *       400:
 *         description: Falta project_id
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
 *         description: Proyecto no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', verifyToken, requireRole('ngo'), ApplicationsController.getByProject);

/**
 * @openapi
 * /applications/me:
 *   get:
 *     tags:
 *       - Applications
 *     summary: Listar mis aplicaciones (estudiante)
 *     description: Devuelve todas las aplicaciones del estudiante autenticado, incluyendo título y estado del proyecto. Solo rol student.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Lista de aplicaciones del estudiante
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Application'
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Acceso denegado (no es estudiante)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/me', verifyToken, requireRole('student'), ApplicationsController.getOwn);

/**
 * @openapi
 * /applications/{id}:
 *   put:
 *     tags:
 *       - Applications
 *     summary: Actualizar estado de una aplicación
 *     description: Solo la ONG propietaria del proyecto puede aprobar o rechazar aplicaciones.
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
 *                 enum: [pending, approved, rejected]
 *     responses:
 *       200:
 *         description: Aplicación actualizada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Application'
 *       400:
 *         description: Status inválido o faltante
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
 *         description: Aplicación no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', verifyToken, requireRole('ngo'), ApplicationsController.updateStatus);

export default router;
