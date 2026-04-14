import { describe, it, expect, vi, beforeEach } from 'vitest';
import ReviewsController from '../controllers/reviews.controller.js';
import ReviewsService from '../services/reviews.service.js';

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
  });

  describe('getByUser', () => {
    it('responde 200 con la lista de reviews', async () => {
      ReviewsService.getByUser.mockResolvedValue([FAKE_REVIEW]);
      const res = mockRes();
      await ReviewsController.getByUser(mockReq({ params: { user_id: 'ngo-1' } }), res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([FAKE_REVIEW]);
    });
  });
});
