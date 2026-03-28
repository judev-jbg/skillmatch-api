import { describe, it, expect, vi, beforeEach } from 'vitest';
import ReviewsController from '../controllers/reviews.controller.js';
import ReviewsService from '../services/reviews.service.js';
import { HttpError } from '../utils/errors.js';

vi.mock('../services/reviews.service.js');

function mockReq({ body = {}, query = {}, params = {}, user = { id: 'student-1', role: 'student' } } = {}) {
  return { body, query, params, user };
}

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

const FAKE_REVIEW = {
  id: 'rev-1',
  assignment_id: 'assign-1',
  from_user: 'student-1',
  to_user: 'ngo-1',
  rating: 4.5,
  comment: 'Buen proyecto',
};

describe('ReviewsController', () => {
  beforeEach(() => vi.clearAllMocks());

  // ── create ──────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('responde 201 con la review creada', async () => {
      ReviewsService.create.mockResolvedValue(FAKE_REVIEW);
      const res = mockRes();
      await ReviewsController.create(mockReq({ body: { assignment_id: 'assign-1', rating: 4.5, comment: 'Buen proyecto' } }), res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(FAKE_REVIEW);
    });

    it('delega con conversion snake_case a camelCase', async () => {
      ReviewsService.create.mockResolvedValue(FAKE_REVIEW);
      const res = mockRes();
      await ReviewsController.create(mockReq({ body: { assignment_id: 'assign-1', rating: 4.5, comment: 'Test' } }), res);
      expect(ReviewsService.create).toHaveBeenCalledWith('student-1', { assignmentId: 'assign-1', rating: 4.5, comment: 'Test' });
    });

    it('responde 400 si la validacion falla', async () => {
      ReviewsService.create.mockRejectedValue(new HttpError('rating requerido', 400));
      const res = mockRes();
      await ReviewsController.create(mockReq({ body: {} }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('responde 403 si no participo en el proyecto', async () => {
      ReviewsService.create.mockRejectedValue(new HttpError('no participaste', 403));
      const res = mockRes();
      await ReviewsController.create(mockReq({ body: { assignment_id: 'a', rating: 4 } }), res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('responde 409 si ya valoro', async () => {
      ReviewsService.create.mockRejectedValue(new HttpError('ya has valorado', 409));
      const res = mockRes();
      await ReviewsController.create(mockReq({ body: { assignment_id: 'a', rating: 4 } }), res);
      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('responde 500 ante error inesperado', async () => {
      ReviewsService.create.mockRejectedValue(new Error('db fail'));
      const res = mockRes();
      await ReviewsController.create(mockReq({ body: { assignment_id: 'a', rating: 4 } }), res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ── getByUser ───────────────────────────────────────────────────────────────

  describe('getByUser', () => {
    it('responde 200 con la lista de reviews', async () => {
      ReviewsService.getByUser.mockResolvedValue([FAKE_REVIEW]);
      const res = mockRes();
      await ReviewsController.getByUser(mockReq({ params: { user_id: 'ngo-1' } }), res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([FAKE_REVIEW]);
    });

    it('responde 500 ante error inesperado', async () => {
      ReviewsService.getByUser.mockRejectedValue(new Error('db fail'));
      const res = mockRes();
      await ReviewsController.getByUser(mockReq({ params: { user_id: 'ngo-1' } }), res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
