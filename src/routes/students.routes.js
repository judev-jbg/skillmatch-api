import { Router } from 'express';
import StudentController from '../controllers/students.controller.js';
import { verifyToken, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyToken, requireRole('student'));

/**
 * @openapi
 * /students/me:
 *   get:
 *     tags:
 *       - Students
 *     summary: Obtener perfil del estudiante autenticado
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Perfil completo del estudiante con habilidades
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StudentProfile'
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
 *         description: Perfil no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/me', StudentController.getMe);

/**
 * @openapi
 * /students/me:
 *   put:
 *     tags:
 *       - Students
 *     summary: Actualizar disponibilidad y/o portfolio del estudiante
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               availability:
 *                 type: boolean
 *                 example: true
 *               portfolio_url:
 *                 type: string
 *                 format: uri
 *                 example: https://github.com/ana
 *     responses:
 *       200:
 *         description: Perfil actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StudentProfile'
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
router.put('/me', StudentController.updateMe);

/**
 * @openapi
 * /students/me/skills:
 *   put:
 *     tags:
 *       - Students
 *     summary: Reemplazar habilidades del estudiante
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - skills
 *             properties:
 *               skills:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - skill_id
 *                     - level
 *                   properties:
 *                     skill_id:
 *                       type: string
 *                       format: uuid
 *                     level:
 *                       type: string
 *                       enum: [basic, intermediate, advanced]
 *     responses:
 *       200:
 *         description: Perfil con habilidades actualizadas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StudentProfile'
 *       400:
 *         description: Validación fallida (skills no es array, campos faltantes o nivel inválido)
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
router.put('/me/skills', StudentController.updateSkills);

export default router;
