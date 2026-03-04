import { Router } from 'express';
import NgoController from '../controllers/ngos.controller.js';
import { verifyToken, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyToken, requireRole('ngo'));

/**
 * @openapi
 * /ngos/me:
 *   get:
 *     tags:
 *       - NGOs
 *     summary: Obtener perfil de la ONG autenticada
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Perfil completo de la ONG
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
 *         description: Acceso denegado (no es ONG)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Perfil no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/me', NgoController.getMe);

/**
 * @openapi
 * /ngos/me:
 *   put:
 *     tags:
 *       - NGOs
 *     summary: Actualizar datos institucionales de la ONG
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               organization_name:
 *                 type: string
 *                 example: ONG Educación Global
 *               description:
 *                 type: string
 *                 example: Organización dedicada a la educación inclusiva
 *               area:
 *                 type: string
 *                 example: Educación
 *     responses:
 *       200:
 *         description: Perfil actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NgoProfile'
 *       400:
 *         description: No se proveyó ningún campo para actualizar
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
router.put('/me', NgoController.updateMe);

export default router;
