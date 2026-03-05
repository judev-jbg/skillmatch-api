import UsersService from '../services/users.service.js';
import { HttpError } from '../utils/errors.js';

/**
 * Controlador para el perfil genérico del usuario autenticado.
 */
const UsersController = {
  /**
   * GET /users/me
   * Retorna datos básicos del usuario autenticado.
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async getMe(req, res) {
    try {
      const user = await UsersService.getMe(req.user.id);
      return res.status(200).json(user);
    } catch (err) {
      if (err instanceof HttpError) {
        return res.status(err.statusCode).json({ message: err.message });
      }
      console.error('[UsersController.getMe]', err);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  },

  /**
   * PUT /users/me
   * Actualiza name y/o email del usuario autenticado.
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async updateMe(req, res) {
    const { name, email } = req.body;
    try {
      const user = await UsersService.updateMe(req.user.id, { name, email });
      return res.status(200).json(user);
    } catch (err) {
      if (err instanceof HttpError) {
        return res.status(err.statusCode).json({ message: err.message });
      }
      console.error('[UsersController.updateMe]', err);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  },
};

export default UsersController;
