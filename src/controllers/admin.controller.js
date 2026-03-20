import NgosService from '../services/ngos.service.js';
import { HttpError } from '../utils/errors.js';

/**
 * Controlador para operaciones de administración.
 */
const AdminController = {
  /**
   * PUT /admin/verify-ngo/:user_id
   * Marca una ONG como verificada.
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async verifyNgo(req, res) {
    try {
      const profile = await NgosService.verify(req.params.user_id);
      return res.status(200).json(profile);
    } catch (err) {
      if (err instanceof HttpError) {
        return res.status(err.statusCode).json({ message: err.message });
      }
      console.error('[AdminController.verifyNgo]', err);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  },
};

export default AdminController;
