import ApplicationsService from '../services/applications.service.js';
import { HttpError } from '../utils/errors.js';

/**
 * Controlador para la gestión de aplicaciones a proyectos.
 */
const ApplicationsController = {
  /**
   * POST /applications
   * Crea una aplicación. Solo rol `student`.
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async create(req, res) {
    const { project_id } = req.body;
    try {
      const application = await ApplicationsService.create(req.user.id, { project_id });
      return res.status(201).json(application);
    } catch (err) {
      if (err instanceof HttpError) {
        return res.status(err.statusCode).json({ message: err.message });
      }
      console.error('[ApplicationsController.create]', err);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  },

  /**
   * GET /applications?project_id=xxx
   * Lista aplicaciones de un proyecto. Solo rol `ngo` propietaria.
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async getByProject(req, res) {
    const { project_id } = req.query;
    try {
      const applications = await ApplicationsService.getByProject(project_id, req.user.id);
      return res.status(200).json(applications);
    } catch (err) {
      if (err instanceof HttpError) {
        return res.status(err.statusCode).json({ message: err.message });
      }
      console.error('[ApplicationsController.getByProject]', err);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  },

  /**
   * PUT /applications/:id
   * Actualiza el estado de una aplicación. Solo rol `ngo` propietaria.
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async updateStatus(req, res) {
    const { status } = req.body;
    try {
      const application = await ApplicationsService.updateStatus(req.params.id, req.user.id, { status });
      return res.status(200).json(application);
    } catch (err) {
      if (err instanceof HttpError) {
        return res.status(err.statusCode).json({ message: err.message });
      }
      console.error('[ApplicationsController.updateStatus]', err);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  },
};

export default ApplicationsController;
