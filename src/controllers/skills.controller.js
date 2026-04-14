import SkillsService from '../services/skills.service.js';

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
    const skill = await SkillsService.create(name, category);
    return res.status(201).json(skill);
  },

  /**
   * GET /skills
   * Lista skills con filtros opcionales por categoría.
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async getAll(req, res) {
    const { category } = req.query;
    const skills = await SkillsService.getAll({ category });
    return res.status(200).json(skills);
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
    const skill = await SkillsService.update(req.params.id, { name, category });
    return res.status(200).json(skill);
  },

  /**
   * DELETE /admin/skills/:id
   * Elimina una skill.
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async remove(req, res) {
    await SkillsService.remove(req.params.id);
    return res.status(204).send();
  },
};

export default SkillsController;
