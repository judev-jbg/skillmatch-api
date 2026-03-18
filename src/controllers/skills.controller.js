import SkillsService from '../services/skills.service.js';
import { HttpError } from '../utils/errors.js';

/**
 * Controlador para la gestión de skills (admin).
 */
const SkillsController = {
  /**
   * POST /admin/skills
   * Crea una nueva skill.
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async create(req, res) {
    const { name, category } = req.body;
    try {
      const skill = await SkillsService.create(name, category);
      return res.status(201).json(skill);
    } catch (err) {
      if (err instanceof HttpError) {
        return res.status(err.statusCode).json({ message: err.message });
      }
      console.error('[SkillsController.create]', err);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  },

  /**
   * PUT /admin/skills/:id
   * Actualiza una skill existente.
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async update(req, res) {
    const { name, category } = req.body;
    try {
      const skill = await SkillsService.update(req.params.id, { name, category });
      return res.status(200).json(skill);
    } catch (err) {
      if (err instanceof HttpError) {
        return res.status(err.statusCode).json({ message: err.message });
      }
      console.error('[SkillsController.update]', err);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  },

  /**
   * DELETE /admin/skills/:id
   * Elimina una skill.
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async remove(req, res) {
    try {
      await SkillsService.remove(req.params.id);
      return res.status(204).send();
    } catch (err) {
      if (err instanceof HttpError) {
        return res.status(err.statusCode).json({ message: err.message });
      }
      console.error('[SkillsController.remove]', err);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  },
};

export default SkillsController;
