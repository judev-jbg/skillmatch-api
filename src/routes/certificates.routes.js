import { Router } from 'express';
import CertificatesController from '../controllers/certificates.controller.js';
import { verifyToken, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * @openapi
 * /certificates/{id}:
 *   get:
 *     tags:
 *       - Certificates
 *     summary: Descargar certificado PDF
 *     description: >
 *       Devuelve el archivo PDF del certificado. Solo accesible por el estudiante
 *       al que pertenece el certificado.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID del certificado
 *     responses:
 *       200:
 *         description: Archivo PDF del certificado
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: No eres el estudiante propietario del certificado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Certificado no encontrado o archivo no disponible
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', verifyToken, requireRole('student'), CertificatesController.download);

export default router;
