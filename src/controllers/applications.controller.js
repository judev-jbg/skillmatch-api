import ApplicationsService from '../services/applications.service.js';

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
    const application = await ApplicationsService.create(req.user.id, { projectId: project_id });
    return res.status(201).json(application);
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
    const applications = await ApplicationsService.getByProject(project_id, req.user.id);
    return res.status(200).json(applications);
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
    const application = await ApplicationsService.updateStatus(req.params.id, req.user.id, { status });
    return res.status(200).json(application);
  },
};

export default ApplicationsController;
