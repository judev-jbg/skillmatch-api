import ProjectsService from '../services/projects.service.js';
import { HttpError } from '../utils/errors.js';

/**
 * Controlador para la gestión de proyectos.
 */
const ProjectsController = {
  /**
   * POST /projects
   * Crea un nuevo proyecto. Solo rol `ngo`.
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async create(req, res) {
    const { title, description, objectives, estimated_hours, deadline, modality, skills } = req.body;
    try {
      const project = await ProjectsService.create(req.user.id, {
        title,
        description,
        objectives,
        estimatedHours: estimated_hours,
        deadline,
        modality,
        skills,
      });
      return res.status(201).json(project);
    } catch (err) {
      if (err instanceof HttpError) {
        return res.status(err.statusCode).json({ message: err.message });
      }
      console.error('[ProjectsController.create]', err);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  },

  /**
   * GET /projects
   * Lista proyectos con filtros opcionales por status y skill_id.
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async getAll(req, res) {
    const { status, skill_id } = req.query;
    try {
      const projects = await ProjectsService.getAll({ status, skillId: skill_id });
      return res.status(200).json(projects);
    } catch (err) {
      if (err instanceof HttpError) {
        return res.status(err.statusCode).json({ message: err.message });
      }
      console.error('[ProjectsController.getAll]', err);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  },

  /**
   * GET /projects/:id
   * Devuelve un proyecto por ID.
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async getById(req, res) {
    try {
      const project = await ProjectsService.getById(req.params.id);
      return res.status(200).json(project);
    } catch (err) {
      if (err instanceof HttpError) {
        return res.status(err.statusCode).json({ message: err.message });
      }
      console.error('[ProjectsController.getById]', err);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  },

  /**
   * PUT /projects/:id
   * Actualiza un proyecto. Solo la ONG propietaria.
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async update(req, res) {
    const { title, description, objectives, estimated_hours, deadline, modality } = req.body;
    try {
      const project = await ProjectsService.update(req.params.id, req.user.id, {
        title,
        description,
        objectives,
        estimatedHours: estimated_hours,
        deadline,
        modality,
      });
      return res.status(200).json(project);
    } catch (err) {
      if (err instanceof HttpError) {
        return res.status(err.statusCode).json({ message: err.message });
      }
      console.error('[ProjectsController.update]', err);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  },

  /**
   * PUT /projects/:id/skills
   * Reemplaza las skills requeridas de un proyecto.
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async updateSkills(req, res) {
    const { skills } = req.body;
    try {
      const project = await ProjectsService.updateSkills(req.params.id, req.user.id, skills);
      return res.status(200).json(project);
    } catch (err) {
      if (err instanceof HttpError) {
        return res.status(err.statusCode).json({ message: err.message });
      }
      console.error('[ProjectsController.updateSkills]', err);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  },
};

export default ProjectsController;
