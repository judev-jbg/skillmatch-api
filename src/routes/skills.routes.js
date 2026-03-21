import { Router } from 'express';
import SkillsController from '../controllers/skills.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * @openapi
 * /skills:
 *   get:
 *     tags:
 *       - Skills
 *     summary: Listar skills
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [Desarrollo, Diseno, CMS, Marketing]
 *     responses:
 *       200:
 *         description: Lista de skills
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Skill'
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', verifyToken, SkillsController.getAll);

export default router;
