import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProjectsController from '../controllers/projects.controller.js';
import ProjectsService from '../services/projects.service.js';
import { HttpError } from '../utils/errors.js';

vi.mock('../services/projects.service.js');

function mockReq({ body = {}, query = {}, params = {}, user = { id: 'ngo-1', role: 'ngo' } } = {}) {
  return { body, query, params, user };
}

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

const FAKE_PROJECT = {
  id: 'proj-1', ngo_id: 'ngo-1', title: 'App voluntarios',
  status: 'pending', created_at: new Date(), skills: [],
};

describe('ProjectsController', () => {
  beforeEach(() => vi.clearAllMocks());

  // ── create ──────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('responde 201 con el proyecto creado', async () => {
      ProjectsService.create.mockResolvedValue(FAKE_PROJECT);
      const res = mockRes();
      await ProjectsController.create(mockReq({ body: { title: 'App voluntarios' } }), res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(FAKE_PROJECT);
    });

    it('responde 400 si el servicio lanza HttpError 400', async () => {
      ProjectsService.create.mockRejectedValue(new HttpError('title requerido', 400));
      const res = mockRes();
      await ProjectsController.create(mockReq({ body: {} }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('delega ngoId desde req.user.id', async () => {
      ProjectsService.create.mockResolvedValue(FAKE_PROJECT);
      const res = mockRes();
      await ProjectsController.create(mockReq({ body: { title: 'Test' } }), res);
      expect(ProjectsService.create).toHaveBeenCalledWith('ngo-1', expect.any(Object));
    });

    it('responde 500 ante error inesperado', async () => {
      ProjectsService.create.mockRejectedValue(new Error('db fail'));
      const res = mockRes();
      await ProjectsController.create(mockReq({ body: { title: 'Test' } }), res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ── getAll ──────────────────────────────────────────────────────────────────

  describe('getAll', () => {
    it('responde 200 con lista de proyectos', async () => {
      ProjectsService.getAll.mockResolvedValue([FAKE_PROJECT]);
      const res = mockRes();
      await ProjectsController.getAll(mockReq({ query: {} }), res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([FAKE_PROJECT]);
    });

    it('pasa los query params al servicio', async () => {
      ProjectsService.getAll.mockResolvedValue([]);
      const res = mockRes();
      await ProjectsController.getAll(mockReq({ query: { status: 'pending', skill_id: 'sk-1' } }), res);
      expect(ProjectsService.getAll).toHaveBeenCalledWith({ status: 'pending', skillId: 'sk-1' });
    });

    it('responde 400 si status es inválido', async () => {
      ProjectsService.getAll.mockRejectedValue(new HttpError('status inválido', 400));
      const res = mockRes();
      await ProjectsController.getAll(mockReq({ query: { status: 'bad' } }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ── getById ─────────────────────────────────────────────────────────────────

  describe('getById', () => {
    it('responde 200 con el proyecto', async () => {
      ProjectsService.getById.mockResolvedValue(FAKE_PROJECT);
      const res = mockRes();
      await ProjectsController.getById(mockReq({ params: { id: 'proj-1' } }), res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('responde 404 si no existe', async () => {
      ProjectsService.getById.mockRejectedValue(new HttpError('no encontrado', 404));
      const res = mockRes();
      await ProjectsController.getById(mockReq({ params: { id: 'bad' } }), res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ── update ──────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('responde 200 con el proyecto actualizado', async () => {
      const updated = { ...FAKE_PROJECT, title: 'nuevo' };
      ProjectsService.update.mockResolvedValue(updated);
      const res = mockRes();
      await ProjectsController.update(mockReq({ params: { id: 'proj-1' }, body: { title: 'nuevo' } }), res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(updated);
    });

    it('responde 403 si no es propietario', async () => {
      ProjectsService.update.mockRejectedValue(new HttpError('no tienes permiso', 403));
      const res = mockRes();
      await ProjectsController.update(mockReq({ params: { id: 'proj-1' }, body: { title: 'x' } }), res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('responde 400 si no hay campos', async () => {
      ProjectsService.update.mockRejectedValue(new HttpError('al menos un campo', 400));
      const res = mockRes();
      await ProjectsController.update(mockReq({ params: { id: 'proj-1' }, body: {} }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('delega projectId y ngoId correctamente', async () => {
      ProjectsService.update.mockResolvedValue(FAKE_PROJECT);
      const res = mockRes();
      await ProjectsController.update(mockReq({ params: { id: 'proj-1' }, body: { title: 'x' } }), res);
      expect(ProjectsService.update).toHaveBeenCalledWith('proj-1', 'ngo-1', expect.any(Object));
    });
  });

  // ── updateSkills ─────────────────────────────────────────────────────────────────
  describe('updateSkills', () => {
    const skills = [{ skill_id: 'sk-1', required_level: 'basic' }];
    it('responde 200 con el proyecto actualizado', async () => {
      const updated = { ...FAKE_PROJECT, skills };
      ProjectsService.updateSkills.mockResolvedValue(updated);
      const res = mockRes();
      await ProjectsController.updateSkills(mockReq({ params: { id: 'proj-1' }, body: { skills }}), res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(updated);
    });

    it('responde 403 si no es propietario', async () => {
      ProjectsService.updateSkills.mockRejectedValue(new HttpError('no tienes permiso', 403));
      const res = mockRes();
      await ProjectsController.updateSkills(mockReq({ params: { id: 'proj-1' }, body: { skills } }), res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('responde 500 ante error inesperado', async () => {
      ProjectsService.updateSkills.mockRejectedValue(new Error('db fail'));
      const res = mockRes();
      await ProjectsController.updateSkills(mockReq({ params: { id: 'proj-1' }, body: { skills } }), res);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('delega projectId y ngoId correctamente', async () => {
      ProjectsService.updateSkills.mockResolvedValue(FAKE_PROJECT);
      const res = mockRes();
      await ProjectsController.updateSkills(mockReq({ params: { id: 'proj-1' }, body: { skills } }), res);
      expect(ProjectsService.updateSkills).toHaveBeenCalledWith('proj-1', 'ngo-1', skills);
    });
  });

  // ── transitionStatus ──────────────────────────────────────────────────────

  describe('transitionStatus', () => {
    it('responde 200 con el proyecto actualizado', async () => {
      const updated = { ...FAKE_PROJECT, status: 'assigned' };
      ProjectsService.transitionStatus.mockResolvedValue(updated);
      const res = mockRes();
      await ProjectsController.transitionStatus(mockReq({ params: { id: 'proj-1' }, body: { status: 'assigned' } }), res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(updated);
    });

    it('responde 400 si la transicion no es valida', async () => {
      ProjectsService.transitionStatus.mockRejectedValue(new HttpError('Transicion no permitida', 400));
      const res = mockRes();
      await ProjectsController.transitionStatus(mockReq({ params: { id: 'proj-1' }, body: { status: 'completed' } }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('responde 403 si no es propietario', async () => {
      ProjectsService.transitionStatus.mockRejectedValue(new HttpError('No tienes permiso', 403));
      const res = mockRes();
      await ProjectsController.transitionStatus(mockReq({ params: { id: 'proj-1' }, body: { status: 'assigned' } }), res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('responde 404 si no existe', async () => {
      ProjectsService.transitionStatus.mockRejectedValue(new HttpError('Proyecto no encontrado', 404));
      const res = mockRes();
      await ProjectsController.transitionStatus(mockReq({ params: { id: 'bad' }, body: { status: 'assigned' } }), res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('responde 500 ante error inesperado', async () => {
      ProjectsService.transitionStatus.mockRejectedValue(new Error('db fail'));
      const res = mockRes();
      await ProjectsController.transitionStatus(mockReq({ params: { id: 'proj-1' }, body: { status: 'assigned' } }), res);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('delega id, status y userId correctamente', async () => {
      ProjectsService.transitionStatus.mockResolvedValue(FAKE_PROJECT);
      const res = mockRes();
      await ProjectsController.transitionStatus(mockReq({ params: { id: 'proj-1' }, body: { status: 'assigned' } }), res);
      expect(ProjectsService.transitionStatus).toHaveBeenCalledWith('proj-1', 'assigned', 'ngo-1');
    });
  });
});
