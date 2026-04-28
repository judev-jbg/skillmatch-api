import { Router } from 'express';
import SkillsController from '../controllers/skills.controller.js';
import AdminController from '../controllers/admin.controller.js';
import { verifyToken, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * @openapi
 * /admin/skills:
 *   post:
 *     tags:
 *       - Admin - Skills
 *     summary: Crear una nueva skill
 *     description: Solo accesible para administradores.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *                 example: JavaScript
 *               category:
 *                 type: string
 *                 enum: [Desarrollo, Diseno, CMS, Marketing]
 *                 example: Desarrollo
 *     responses:
 *       201:
 *         description: Skill creada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Skill'
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
 *         description: Acceso denegado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/skills', verifyToken, requireRole('admin'), SkillsController.create);

/**
 * @openapi
 * /admin/skills/{id}:
 *   put:
 *     tags:
 *       - Admin - Skills
 *     summary: Actualizar una skill
 *     description: Solo accesible para administradores.
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
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [Desarrollo, Diseno, CMS, Marketing]
 *     responses:
 *       200:
 *         description: Skill actualizada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Skill'
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
 *         description: Acceso denegado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Skill no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/skills/:id', verifyToken, requireRole('admin'), SkillsController.update);

/**
 * @openapi
 * /admin/skills/{id}:
 *   delete:
 *     tags:
 *       - Admin - Skills
 *     summary: Eliminar una skill
 *     description: Solo accesible para administradores. Elimina la skill y sus referencias por CASCADE.
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
 *       204:
 *         description: Skill eliminada
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Acceso denegado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Skill no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/skills/:id', verifyToken, requireRole('admin'), SkillsController.remove);

/**
 * @openapi
 * /admin/verify-ngo/{user_id}:
 *   put:
 *     tags:
 *       - Admin - NGOs
 *     summary: Verificar una ONG
 *     description: Marca una ONG como verificada. Solo accesible para administradores.
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
 *         description: ONG verificada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NgoProfile'
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Acceso denegado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: ONG no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/verify-ngo/:user_id', verifyToken, requireRole('admin'), AdminController.verifyNgo);

/**
 * @openapi
 * /admin/ngos:
 *   get:
 *     tags:
 *       - Admin - NGOs
 *     summary: Listar todas las ONGs con estado de verificación
 *     description: Solo accesible para administradores.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Lista de ONGs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/NgoProfile'
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Acceso denegado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/ngos', verifyToken, requireRole('admin'), AdminController.listNgos);

export default router;
