import { describe, it, expect, vi, beforeEach } from 'vitest';
import StudentsController from '../controllers/students.controller.js';
import StudentsService from '../services/students.service.js';

vi.mock('../services/students.service.js');

function mockReq(body = {}, user = { id: 'uuid-1', role: 'student' }) {
  return { body, user };
}

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

  describe('getMe', () => {
    it('responde 200 con el perfil del estudiante', async () => {
      StudentsService.getProfile.mockResolvedValue(FAKE_PROFILE);
      const res = mockRes();
      await StudentsController.getMe(mockReq(), res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(FAKE_PROFILE);
    });
  });

  describe('updateMe', () => {
    it('responde 200 con el perfil actualizado', async () => {
      const updated = { ...FAKE_PROFILE, availability: true };
      StudentsService.updateProfile.mockResolvedValue(updated);
      const res = mockRes();
      await StudentsController.updateMe(mockReq({ availability: true }), res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(updated);
    });

    it('delega userId desde req.user.id', async () => {
      StudentsService.updateProfile.mockResolvedValue(FAKE_PROFILE);
      const res = mockRes();
      await StudentsController.updateMe(mockReq({ portfolio_url: 'https://x.com' }), res);
      expect(StudentsService.updateProfile).toHaveBeenCalledWith('uuid-1', expect.objectContaining({ portfolioUrl: 'https://x.com' }));
    });
  });

  describe('updateSkills', () => {
    it('responde 200 con el perfil actualizado con skills', async () => {
      const skills = [{ skill_id: 'sk-1', level: 'basic' }];
      StudentsService.updateSkills.mockResolvedValue({ ...FAKE_PROFILE, skills });
      const res = mockRes();
      await StudentsController.updateSkills(mockReq({ skills }), res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
