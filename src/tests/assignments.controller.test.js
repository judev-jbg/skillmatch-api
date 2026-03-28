import { describe, it, expect, vi, beforeEach } from 'vitest';
import AssignmentsController from '../controllers/assignments.controller.js';
import AssignmentsService from '../services/assignments.service.js';
import { HttpError } from '../utils/errors.js';

vi.mock('../services/assignments.service.js');

function mockReq({ body = {}, query = {}, params = {}, user = { id: 'ngo-1', role: 'ngo' } } = {}) {
  return { body, query, params, user };
}

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

const FAKE_ASSIGNMENT = {
  id: 'assign-1',
  project_id: 'proj-1',
  student_id: 'student-1',
  start_date: new Date(),
  end_date: null,
};

describe('AssignmentsController', () => {
  beforeEach(() => vi.clearAllMocks());

  // ── create ──────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('responde 201 con el assignment creado', async () => {
      AssignmentsService.create.mockResolvedValue(FAKE_ASSIGNMENT);
      const res = mockRes();
      await AssignmentsController.create(mockReq({ body: { application_id: 'app-1' } }), res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(FAKE_ASSIGNMENT);
    });

    it('delega applicationId y ngoId correctamente', async () => {
      AssignmentsService.create.mockResolvedValue(FAKE_ASSIGNMENT);
      const res = mockRes();
      await AssignmentsController.create(mockReq({ body: { application_id: 'app-1' } }), res);
      expect(AssignmentsService.create).toHaveBeenCalledWith('ngo-1', { applicationId: 'app-1' });
    });

    it('responde 400 si la validacion falla', async () => {
      AssignmentsService.create.mockRejectedValue(new HttpError('application no pending', 400));
      const res = mockRes();
      await AssignmentsController.create(mockReq({ body: { application_id: 'app-1' } }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('responde 403 si no es propietario', async () => {
      AssignmentsService.create.mockRejectedValue(new HttpError('no tienes permiso', 403));
      const res = mockRes();
      await AssignmentsController.create(mockReq({ body: { application_id: 'app-1' } }), res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('responde 404 si no existe', async () => {
      AssignmentsService.create.mockRejectedValue(new HttpError('no encontrada', 404));
      const res = mockRes();
      await AssignmentsController.create(mockReq({ body: { application_id: 'bad' } }), res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('responde 500 ante error inesperado', async () => {
      AssignmentsService.create.mockRejectedValue(new Error('db fail'));
      const res = mockRes();
      await AssignmentsController.create(mockReq({ body: { application_id: 'app-1' } }), res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ── getById ─────────────────────────────────────────────────────────────────

  describe('getById', () => {
    it('responde 200 con el assignment', async () => {
      AssignmentsService.getById.mockResolvedValue(FAKE_ASSIGNMENT);
      const res = mockRes();
      await AssignmentsController.getById(mockReq({ params: { id: 'assign-1' } }), res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(FAKE_ASSIGNMENT);
    });

    it('responde 404 si no existe', async () => {
      AssignmentsService.getById.mockRejectedValue(new HttpError('no encontrada', 404));
      const res = mockRes();
      await AssignmentsController.getById(mockReq({ params: { id: 'bad' } }), res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('responde 500 ante error inesperado', async () => {
      AssignmentsService.getById.mockRejectedValue(new Error('db fail'));
      const res = mockRes();
      await AssignmentsController.getById(mockReq({ params: { id: 'assign-1' } }), res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ── accept ──────────────────────────────────────────────────────────────────

  describe('accept', () => {
    it('responde 200 con el assignment aceptado', async () => {
      AssignmentsService.accept.mockResolvedValue(FAKE_ASSIGNMENT);
      const res = mockRes();
      await AssignmentsController.accept(mockReq({ params: { id: 'assign-1' }, user: { id: 'student-1', role: 'student' } }), res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(FAKE_ASSIGNMENT);
    });

    it('delega assignmentId y studentId correctamente', async () => {
      AssignmentsService.accept.mockResolvedValue(FAKE_ASSIGNMENT);
      const res = mockRes();
      await AssignmentsController.accept(mockReq({ params: { id: 'assign-1' }, user: { id: 'student-1', role: 'student' } }), res);
      expect(AssignmentsService.accept).toHaveBeenCalledWith('assign-1', 'student-1');
    });

    it('responde 403 si no es el estudiante asignado', async () => {
      AssignmentsService.accept.mockRejectedValue(new HttpError('no tienes permiso', 403));
      const res = mockRes();
      await AssignmentsController.accept(mockReq({ params: { id: 'assign-1' }, user: { id: 'otro', role: 'student' } }), res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('responde 400 si el proyecto no esta en assigned', async () => {
      AssignmentsService.accept.mockRejectedValue(new HttpError('no esta en assigned', 400));
      const res = mockRes();
      await AssignmentsController.accept(mockReq({ params: { id: 'assign-1' }, user: { id: 'student-1', role: 'student' } }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('responde 404 si no existe', async () => {
      AssignmentsService.accept.mockRejectedValue(new HttpError('no encontrada', 404));
      const res = mockRes();
      await AssignmentsController.accept(mockReq({ params: { id: 'bad' }, user: { id: 'student-1', role: 'student' } }), res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('responde 500 ante error inesperado', async () => {
      AssignmentsService.accept.mockRejectedValue(new Error('db fail'));
      const res = mockRes();
      await AssignmentsController.accept(mockReq({ params: { id: 'assign-1' }, user: { id: 'student-1', role: 'student' } }), res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
