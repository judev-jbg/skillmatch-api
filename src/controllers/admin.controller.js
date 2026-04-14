import NgosService from '../services/ngos.service.js';

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
    const profile = await NgosService.verify(req.params.user_id);
    return res.status(200).json(profile);
  },
};

export default AdminController;
