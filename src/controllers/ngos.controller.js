import NgoService from '../services/ngos.service.js';
import { HttpError } from '../utils/errors.js';

/**
 * Controlador para el perfil de la ONG.
 * Todos los endpoints requieren autenticación (`verifyToken`) y rol `ngo`.
 */
const NgoController = {
  /**
   * GET /ngos/me
   * Devuelve el perfil completo de la ONG autenticada.
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async getMe(req, res) {
    try {
      const profile = await NgoService.getProfile(req.user.id);
      return res.status(200).json(profile);
    } catch (err) {
      if (err instanceof HttpError) {
        return res.status(err.statusCode).json({ message: err.message });
      }
      console.error('[NgoController.getMe]', err);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  },

  /**
   * PUT /ngos/me
   * Actualiza los datos institucionales de la ONG autenticada.
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async updateMe(req, res) {
    const { organization_name, description, area } = req.body;
    try {
      const profile = await NgoService.updateProfile(req.user.id, { organization_name, description, area });
      return res.status(200).json(profile);
    } catch (err) {
      if (err instanceof HttpError) {
        return res.status(err.statusCode).json({ message: err.message });
      }
      console.error('[NgoController.updateMe]', err);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  },
};

export default NgoController;
