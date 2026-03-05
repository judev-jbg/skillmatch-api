import { describe, it, expect, vi, beforeEach } from 'vitest';
import ApplicationsController from '../controllers/applications.controller.js';
import ApplicationsService from '../services/applications.service.js';
import { HttpError } from '../utils/errors.js';

vi.mock('../services/applications.service.js');

function mockReq({ body = {}, query = {}, params = {}, user = { id: 'user-1', role: 'student' } } = {}) {
  return { body, query, params, user };
}

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

const FAKE_APPLICATION = {
  id: 'app-1',
  project_id: 'proj-1',
  student_id: 'student-1',
  compatibility_score: null,
  status: 'pending',
};

describe('ApplicationsController', () => {
  beforeEach(() => vi.clearAllMocks());

  // ── create ────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('responde 201 con la aplicación creada', async () => {
      ApplicationsService.create.mockResolvedValue(FAKE_APPLICATION);
      const res = mockRes();
      await ApplicationsController.create(mockReq({ body: { project_id: 'proj-1' } }), res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(FAKE_APPLICATION);
    });

    it('delega studentId desde req.user.id', async () => {
      ApplicationsService.create.mockResolvedValue(FAKE_APPLICATION);
      const res = mockRes();
      await ApplicationsController.create(
        mockReq({ body: { project_id: 'proj-1' }, user: { id: 'student-1', role: 'student' } }),
        res,
      );
      expect(ApplicationsService.create).toHaveBeenCalledWith('student-1', expect.any(Object));
    });

    it('responde 400 si falta project_id', async () => {
      ApplicationsService.create.mockRejectedValue(new HttpError('project_id requerido', 400));
      const res = mockRes();
      await ApplicationsController.create(mockReq({ body: {} }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('responde 404 si el proyecto no existe', async () => {
      ApplicationsService.create.mockRejectedValue(new HttpError('Proyecto no encontrado', 404));
      const res = mockRes();
      await ApplicationsController.create(mockReq({ body: { project_id: 'bad' } }), res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('responde 409 si ya existe la aplicación', async () => {
      ApplicationsService.create.mockRejectedValue(new HttpError('Ya has aplicado', 409));
      const res = mockRes();
      await ApplicationsController.create(mockReq({ body: { project_id: 'proj-1' } }), res);
      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('responde 500 ante error inesperado', async () => {
      ApplicationsService.create.mockRejectedValue(new Error('db fail'));
      const res = mockRes();
      await ApplicationsController.create(mockReq({ body: { project_id: 'proj-1' } }), res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ── getByProject ──────────────────────────────────────────────────────────

  describe('getByProject', () => {
    it('responde 200 con lista de aplicaciones', async () => {
      ApplicationsService.getByProject.mockResolvedValue([FAKE_APPLICATION]);
      const res = mockRes();
      await ApplicationsController.getByProject(
        mockReq({ query: { project_id: 'proj-1' }, user: { id: 'ngo-1', role: 'ngo' } }),
        res,
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([FAKE_APPLICATION]);
    });

    it('delega projectId y ngoId correctamente', async () => {
      ApplicationsService.getByProject.mockResolvedValue([]);
      const res = mockRes();
      await ApplicationsController.getByProject(
        mockReq({ query: { project_id: 'proj-1' }, user: { id: 'ngo-1', role: 'ngo' } }),
        res,
      );
      expect(ApplicationsService.getByProject).toHaveBeenCalledWith('proj-1', 'ngo-1');
    });

    it('responde 400 si falta project_id', async () => {
      ApplicationsService.getByProject.mockRejectedValue(new HttpError('project_id requerido', 400));
      const res = mockRes();
      await ApplicationsController.getByProject(mockReq({ query: {}, user: { id: 'ngo-1', role: 'ngo' } }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('responde 403 si la ONG no es propietaria', async () => {
      ApplicationsService.getByProject.mockRejectedValue(new HttpError('No tienes permiso', 403));
      const res = mockRes();
      await ApplicationsController.getByProject(
        mockReq({ query: { project_id: 'proj-1' }, user: { id: 'otra-ngo', role: 'ngo' } }),
        res,
      );
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  // ── updateStatus ──────────────────────────────────────────────────────────

  describe('updateStatus', () => {
    it('responde 200 con la aplicación actualizada', async () => {
      const updated = { ...FAKE_APPLICATION, status: 'approved' };
      ApplicationsService.updateStatus.mockResolvedValue(updated);
      const res = mockRes();
      await ApplicationsController.updateStatus(
        mockReq({ params: { id: 'app-1' }, body: { status: 'approved' }, user: { id: 'ngo-1', role: 'ngo' } }),
        res,
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(updated);
    });

    it('delega id y ngoId correctamente', async () => {
      ApplicationsService.updateStatus.mockResolvedValue(FAKE_APPLICATION);
      const res = mockRes();
      await ApplicationsController.updateStatus(
        mockReq({ params: { id: 'app-1' }, body: { status: 'rejected' }, user: { id: 'ngo-1', role: 'ngo' } }),
        res,
      );
      expect(ApplicationsService.updateStatus).toHaveBeenCalledWith('app-1', 'ngo-1', expect.any(Object));
    });

    it('responde 400 si status es inválido', async () => {
      ApplicationsService.updateStatus.mockRejectedValue(new HttpError('Status inválido', 400));
      const res = mockRes();
      await ApplicationsController.updateStatus(
        mockReq({ params: { id: 'app-1' }, body: { status: 'bad' }, user: { id: 'ngo-1', role: 'ngo' } }),
        res,
      );
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('responde 403 si la ONG no es propietaria', async () => {
      ApplicationsService.updateStatus.mockRejectedValue(new HttpError('No tienes permiso', 403));
      const res = mockRes();
      await ApplicationsController.updateStatus(
        mockReq({ params: { id: 'app-1' }, body: { status: 'approved' }, user: { id: 'otra-ngo', role: 'ngo' } }),
        res,
      );
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('responde 404 si la aplicación no existe', async () => {
      ApplicationsService.updateStatus.mockRejectedValue(new HttpError('Aplicación no encontrada', 404));
      const res = mockRes();
      await ApplicationsController.updateStatus(
        mockReq({ params: { id: 'bad' }, body: { status: 'approved' }, user: { id: 'ngo-1', role: 'ngo' } }),
        res,
      );
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('responde 500 ante error inesperado', async () => {
      ApplicationsService.updateStatus.mockRejectedValue(new Error('db fail'));
      const res = mockRes();
      await ApplicationsController.updateStatus(
        mockReq({ params: { id: 'app-1' }, body: { status: 'approved' }, user: { id: 'ngo-1', role: 'ngo' } }),
        res,
      );
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
