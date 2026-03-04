import StudentService from '../services/students.service.js';
import { HttpError } from '../utils/errors.js';

/**
 * Controlador para el perfil del estudiante.
 * Todos los endpoints requieren autenticación (`verifyToken`) y rol `student`.
 */
const StudentController = {
  /**
   * GET /students/me
   * Devuelve el perfil completo del estudiante autenticado.
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async getMe(req, res) {
    try {
      const profile = await StudentService.getProfile(req.user.id);
      return res.status(200).json(profile);
    } catch (err) {
      if (err instanceof HttpError) {
        return res.status(err.statusCode).json({ message: err.message });
      }
      console.error('[StudentController.getMe]', err);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
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
    try {
      const profile = await StudentService.updateProfile(req.user.id, { availability, portfolio_url });
      return res.status(200).json(profile);
    } catch (err) {
      if (err instanceof HttpError) {
        return res.status(err.statusCode).json({ message: err.message });
      }
      console.error('[StudentController.updateMe]', err);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
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
    try {
      const profile = await StudentService.updateSkills(req.user.id, skills);
      return res.status(200).json(profile);
    } catch (err) {
      if (err instanceof HttpError) {
        return res.status(err.statusCode).json({ message: err.message });
      }
      console.error('[StudentController.updateSkills]', err);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  },
};

export default StudentController;
