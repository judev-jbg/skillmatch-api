import { describe, it, expect, vi, beforeEach } from 'vitest';
import DeliverablesController from '../controllers/deliverables.controller.js';
import DeliverablesService from '../services/deliverables.service.js';

vi.mock('../services/deliverables.service.js');

function mockReq({ body = {}, query = {}, params = {}, user = { id: 'ngo-1', role: 'ngo' } } = {}) {
  return { body, query, params, user };
}

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

const FAKE_DELIVERABLE = {
  id: 'del-1',
  assignment_id: 'assign-1',
  title: 'Diseno de la BD',
  status: 'pending',
};

describe('DeliverablesController', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('create', () => {
    it('responde 201 con el entregable creado', async () => {
      DeliverablesService.create.mockResolvedValue(FAKE_DELIVERABLE);
      const res = mockRes();
      await DeliverablesController.create(mockReq({ body: { assignment_id: 'assign-1', title: 'Diseno de la BD' } }), res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(FAKE_DELIVERABLE);
    });

    it('delega correctamente con conversion snake_case a camelCase', async () => {
      DeliverablesService.create.mockResolvedValue(FAKE_DELIVERABLE);
      const res = mockRes();
      await DeliverablesController.create(mockReq({ body: { assignment_id: 'assign-1', title: 'Test', description: 'Desc' } }), res);
      expect(DeliverablesService.create).toHaveBeenCalledWith('ngo-1', { assignmentId: 'assign-1', title: 'Test', description: 'Desc' });
    });
  });

  describe('getByAssignment', () => {
    it('responde 200 con lista de entregables', async () => {
      DeliverablesService.getByAssignment.mockResolvedValue([FAKE_DELIVERABLE]);
      const res = mockRes();
      await DeliverablesController.getByAssignment(mockReq({ query: { assignment_id: 'assign-1' } }), res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([FAKE_DELIVERABLE]);
    });
  });

  describe('startWork', () => {
    it('responde 200 con el entregable en progreso', async () => {
      const started = { ...FAKE_DELIVERABLE, status: 'in_progress' };
      DeliverablesService.startWork.mockResolvedValue(started);
      const res = mockRes();
      await DeliverablesController.startWork(mockReq({ params: { id: 'del-1' }, user: { id: 'student-1', role: 'student' } }), res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(started);
    });
  });

  describe('submitForReview', () => {
    it('responde 200 con el entregable enviado', async () => {
      const submitted = { ...FAKE_DELIVERABLE, status: 'in_review', file_url: 'http://x.com/f.pdf' };
      DeliverablesService.submitForReview.mockResolvedValue(submitted);
      const res = mockRes();
      await DeliverablesController.submitForReview(
        mockReq({ params: { id: 'del-1' }, body: { file_url: 'http://x.com/f.pdf' }, user: { id: 'student-1', role: 'student' } }),
        res,
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(submitted);
    });

    it('delega con conversion snake_case a camelCase', async () => {
      DeliverablesService.submitForReview.mockResolvedValue(FAKE_DELIVERABLE);
      const res = mockRes();
      await DeliverablesController.submitForReview(
        mockReq({ params: { id: 'del-1' }, body: { file_url: 'http://x.com/f.pdf', comment: 'Listo' }, user: { id: 'student-1', role: 'student' } }),
        res,
      );
      expect(DeliverablesService.submitForReview).toHaveBeenCalledWith('del-1', 'student-1', { fileUrl: 'http://x.com/f.pdf', comment: 'Listo' });
    });
  });

  describe('review', () => {
    it('responde 200 con el entregable revisado', async () => {
      const approved = { ...FAKE_DELIVERABLE, status: 'approved' };
      DeliverablesService.review.mockResolvedValue(approved);
      const res = mockRes();
      await DeliverablesController.review(mockReq({ params: { id: 'del-1' }, body: { status: 'approved' } }), res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(approved);
    });

    it('delega correctamente', async () => {
      DeliverablesService.review.mockResolvedValue(FAKE_DELIVERABLE);
      const res = mockRes();
      await DeliverablesController.review(mockReq({ params: { id: 'del-1' }, body: { status: 'rejected' } }), res);
      expect(DeliverablesService.review).toHaveBeenCalledWith('del-1', 'ngo-1', { status: 'rejected' });
    });
  });
});
