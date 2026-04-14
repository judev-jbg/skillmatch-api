import { describe, it, expect, vi, beforeEach } from 'vitest';
import AssignmentsController from '../controllers/assignments.controller.js';
import AssignmentsService from '../services/assignments.service.js';

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
  });

  describe('getById', () => {
    it('responde 200 con el assignment', async () => {
      AssignmentsService.getById.mockResolvedValue(FAKE_ASSIGNMENT);
      const res = mockRes();
      await AssignmentsController.getById(mockReq({ params: { id: 'assign-1' } }), res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(FAKE_ASSIGNMENT);
    });
  });

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
  });
});
