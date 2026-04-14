import StudentsService from '../services/students.service.js';

/**
 * Controlador para el perfil del estudiante.
 * Todos los endpoints requieren autenticación (`verifyToken`) y rol `student`.
 */
const StudentsController = {
  /**
   * GET /students/me
   * Devuelve el perfil completo del estudiante autenticado.
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async getMe(req, res) {
    const profile = await StudentsService.getProfile(req.user.id);
    return res.status(200).json(profile);
  },

  /**
   * PUT /students/me
   * Actualiza disponibilidad y/o portfolio_url del estudiante autenticado.
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async updateMe(req, res) {
    const { availability, portfolio_url } = req.body;
    const profile = await StudentsService.updateProfile(req.user.id, { availability, portfolioUrl: portfolio_url });
    return res.status(200).json(profile);
  },

  /**
   * PUT /students/me/skills
   * Reemplaza las habilidades del estudiante autenticado.
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async updateSkills(req, res) {
    const { skills } = req.body;
    const profile = await StudentsService.updateSkills(req.user.id, skills);
    return res.status(200).json(profile);
  },
};

export default StudentsController;
