import { Router } from 'express';
import AuthController from '../controllers/auth.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Registrar un nuevo usuario
 *     description: >
 *       Registra un estudiante u ONG. Los campos `organization_name` y `area`
 *       son obligatorios cuando `role` es `ngo`.
 *       Los administradores solo pueden ser creados por otro admin (endpoint separado).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *                 example: Ana García
 *               email:
 *                 type: string
 *                 format: email
 *                 example: ana@ong.org
 *               password:
 *                 type: string
 *                 format: password
 *                 example: s3cur3P@ss
 *               role:
 *                 type: string
 *                 enum: [student, ngo]
 *                 example: ngo
 *               organization_name:
 *                 type: string
 *                 example: ONG Educación Sin Fronteras
 *               area:
 *                 type: string
 *                 example: Educación
 *     responses:
 *       201:
 *         description: Usuario registrado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Usuario registrado correctamente
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Campos faltantes, formato de email inválido, rol inválido o campos de ONG faltantes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: El email ya está registrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', AuthController.register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Iniciar sesión
 *     description: >
 *       Autentica al usuario con email y contraseña.
 *       Si las credenciales son válidas, establece una cookie HttpOnly `token` con el JWT firmado.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: ana@ong.org
 *               password:
 *                 type: string
 *                 format: password
 *                 example: s3cur3P@ss
 *     responses:
 *       200:
 *         description: Autenticación exitosa. Cookie `token` establecida.
 *         headers:
 *           Set-Cookie:
 *             description: Cookie HttpOnly con el JWT
 *             schema:
 *               type: string
 *               example: token=eyJ...; HttpOnly; SameSite=Lax
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Autenticación exitosa
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Campos email o password faltantes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Credenciales inválidas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', AuthController.login);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Cerrar sesión
 *     description: >
 *       Invalida la sesión del usuario limpiando la cookie HttpOnly `token`.
 *       Requiere autenticación.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Sesión cerrada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Sesión cerrada correctamente
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/logout', verifyToken, AuthController.logout);

export default router;
