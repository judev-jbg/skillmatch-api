import NgosService from '../services/ngos.service.js';

/**
 * Controlador para el perfil de la ONG.
 * Todos los endpoints requieren autenticación (`verifyToken`) y rol `ngo`.
 */
const NgosController = {
  /**
   * GET /ngos/me
   * Devuelve el perfil completo de la ONG autenticada.
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async getMe(req, res) {
    const profile = await NgosService.getProfile(req.user.id);
    return res.status(200).json(profile);
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
    const profile = await NgosService.updateProfile(req.user.id, { organizationName: organization_name, description, area });
    return res.status(200).json(profile);
  },
};

export default NgosController;
