import { describe, it, expect, vi, beforeEach } from 'vitest';
import StudentsController from '../controllers/students.controller.js';
import StudentsService from '../services/students.service.js';
import { HttpError } from '../utils/errors.js';

vi.mock('../services/students.service.js');

/**
 * Crea un Request simulado con user inyectado por verifyToken.
 * @param {object} body
 * @param {object} user
 */
function mockReq(body = {}, user = { id: 'uuid-1', role: 'student' }) {
  return { body, user };
}

/**
 * Crea un Response simulado con spies encadenados.
 */
function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

const FAKE_PROFILE = {
  id: 'uuid-1', name: 'Ana', email: 'ana@test.com', role: 'student',
  availability: false, portfolio_url: null, skills: [],
};

describe('StudentsController', () => {
  beforeEach(() => vi.clearAllMocks());

  // ── getMe ──────────────────────────────────────────────────────────────────

  describe('getMe', () => {
    it('responde 200 con el perfil del estudiante', async () => {
      StudentsService.getProfile.mockResolvedValue(FAKE_PROFILE);
      const res = mockRes();
      await StudentsController.getMe(mockReq(), res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(FAKE_PROFILE);
    });

    it('responde 404 si el servicio lanza HttpError', async () => {
      StudentsService.getProfile.mockRejectedValue(new HttpError('no encontrado', 404));
      const res = mockRes();
      await StudentsController.getMe(mockReq(), res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('responde 500 ante error inesperado', async () => {
      StudentsService.getProfile.mockRejectedValue(new Error('db fail'));
      const res = mockRes();
      await StudentsController.getMe(mockReq(), res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ── updateMe ───────────────────────────────────────────────────────────────

  describe('updateMe', () => {
    it('responde 200 con el perfil actualizado', async () => {
      const updated = { ...FAKE_PROFILE, availability: true };
      StudentsService.updateProfile.mockResolvedValue(updated);
      const res = mockRes();
      await StudentsController.updateMe(mockReq({ availability: true }), res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(updated);
    });

    it('responde 400 si el servicio lanza HttpError 400', async () => {
      StudentsService.updateProfile.mockRejectedValue(new HttpError('debe proporcionar al menos un campo', 400));
      const res = mockRes();
      await StudentsController.updateMe(mockReq({}), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('delega userId desde req.user.id', async () => {
      StudentsService.updateProfile.mockResolvedValue(FAKE_PROFILE);
      const res = mockRes();
      await StudentsController.updateMe(mockReq({ portfolio_url: 'https://x.com' }), res);
      expect(StudentsService.updateProfile).toHaveBeenCalledWith('uuid-1', expect.objectContaining({ portfolioUrl: 'https://x.com' }));
    });
  });

  // ── updateSkills ───────────────────────────────────────────────────────────

  describe('updateSkills', () => {
    it('responde 200 con el perfil actualizado con skills', async () => {
      const skills = [{ skill_id: 'sk-1', level: 'basic' }];
      StudentsService.updateSkills.mockResolvedValue({ ...FAKE_PROFILE, skills });
      const res = mockRes();
      await StudentsController.updateSkills(mockReq({ skills }), res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('responde 400 si el servicio lanza HttpError de validación', async () => {
      StudentsService.updateSkills.mockRejectedValue(new HttpError('skills debe ser un array', 400));
      const res = mockRes();
      await StudentsController.updateSkills(mockReq({ skills: 'bad' }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('responde 500 ante error inesperado', async () => {
      StudentsService.updateSkills.mockRejectedValue(new Error('db fail'));
      const res = mockRes();
      await StudentsController.updateSkills(mockReq({ skills: [] }), res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
