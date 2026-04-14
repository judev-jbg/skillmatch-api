import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProjectsController from '../controllers/projects.controller.js';
import ProjectsService from '../services/projects.service.js';

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

  describe('create', () => {
    it('responde 201 con el proyecto creado', async () => {
      ProjectsService.create.mockResolvedValue(FAKE_PROJECT);
      const res = mockRes();
      await ProjectsController.create(mockReq({ body: { title: 'App voluntarios' } }), res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(FAKE_PROJECT);
    });

    it('delega ngoId desde req.user.id', async () => {
      ProjectsService.create.mockResolvedValue(FAKE_PROJECT);
      const res = mockRes();
      await ProjectsController.create(mockReq({ body: { title: 'Test' } }), res);
      expect(ProjectsService.create).toHaveBeenCalledWith('ngo-1', expect.any(Object));
    });
  });

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
  });

  describe('getById', () => {
    it('responde 200 con el proyecto', async () => {
      ProjectsService.getById.mockResolvedValue(FAKE_PROJECT);
      const res = mockRes();
      await ProjectsController.getById(mockReq({ params: { id: 'proj-1' } }), res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('update', () => {
    it('responde 200 con el proyecto actualizado', async () => {
      const updated = { ...FAKE_PROJECT, title: 'nuevo' };
      ProjectsService.update.mockResolvedValue(updated);
      const res = mockRes();
      await ProjectsController.update(mockReq({ params: { id: 'proj-1' }, body: { title: 'nuevo' } }), res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(updated);
    });

    it('delega projectId y ngoId correctamente', async () => {
      ProjectsService.update.mockResolvedValue(FAKE_PROJECT);
      const res = mockRes();
      await ProjectsController.update(mockReq({ params: { id: 'proj-1' }, body: { title: 'x' } }), res);
      expect(ProjectsService.update).toHaveBeenCalledWith('proj-1', 'ngo-1', expect.any(Object));
    });
  });

  describe('updateSkills', () => {
    const skills = [{ skill_id: 'sk-1', required_level: 'basic' }];

    it('responde 200 con el proyecto actualizado', async () => {
      const updated = { ...FAKE_PROJECT, skills };
      ProjectsService.updateSkills.mockResolvedValue(updated);
      const res = mockRes();
      await ProjectsController.updateSkills(mockReq({ params: { id: 'proj-1' }, body: { skills } }), res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(updated);
    });

    it('delega projectId y ngoId correctamente', async () => {
      ProjectsService.updateSkills.mockResolvedValue(FAKE_PROJECT);
      const res = mockRes();
      await ProjectsController.updateSkills(mockReq({ params: { id: 'proj-1' }, body: { skills } }), res);
      expect(ProjectsService.updateSkills).toHaveBeenCalledWith('proj-1', 'ngo-1', skills);
    });
  });

  describe('transitionStatus', () => {
    it('responde 200 con el proyecto actualizado', async () => {
      const updated = { ...FAKE_PROJECT, status: 'assigned' };
      ProjectsService.transitionStatus.mockResolvedValue(updated);
      const res = mockRes();
      await ProjectsController.transitionStatus(mockReq({ params: { id: 'proj-1' }, body: { status: 'assigned' } }), res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(updated);
    });

    it('delega id, status y userId correctamente', async () => {
      ProjectsService.transitionStatus.mockResolvedValue(FAKE_PROJECT);
      const res = mockRes();
      await ProjectsController.transitionStatus(mockReq({ params: { id: 'proj-1' }, body: { status: 'assigned' } }), res);
      expect(ProjectsService.transitionStatus).toHaveBeenCalledWith('proj-1', 'assigned', 'ngo-1');
    });
  });

  describe('cancel', () => {
    it('responde 200 con el proyecto cancelado', async () => {
      const cancelled = { ...FAKE_PROJECT, status: 'cancelled' };
      ProjectsService.cancel.mockResolvedValue(cancelled);
      const res = mockRes();
      await ProjectsController.cancel(mockReq({ params: { id: 'proj-1' } }), res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(cancelled);
    });

    it('delega id y userId correctamente', async () => {
      ProjectsService.cancel.mockResolvedValue(FAKE_PROJECT);
      const res = mockRes();
      await ProjectsController.cancel(mockReq({ params: { id: 'proj-1' } }), res);
      expect(ProjectsService.cancel).toHaveBeenCalledWith('proj-1', 'ngo-1');
    });
  });
});
