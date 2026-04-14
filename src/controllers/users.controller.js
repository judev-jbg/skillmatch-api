import UsersService from '../services/users.service.js';

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
    const user = await UsersService.getMe(req.user.id);
    return res.status(200).json(user);
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
    const user = await UsersService.updateMe(req.user.id, { name, email });
    return res.status(200).json(user);
  },
};

export default UsersController;
