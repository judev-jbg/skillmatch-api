import { describe, it, expect, vi, beforeEach } from 'vitest';
import NgosController from '../controllers/ngos.controller.js';
import NgosService from '../services/ngos.service.js';

vi.mock('../services/ngos.service.js');

function mockReq(body = {}, user = { id: 'uuid-1', role: 'ngo' }) {
  return { body, user };
}

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

const FAKE_PROFILE = {
  id: 'uuid-1',
  name: 'ONG Test',
  email: 'ong@test.com',
  role: 'ngo',
  organization_name: 'ONG Test',
  description: null,
  area: 'Educación',
  verified: false,
};

describe('NgosController', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('getMe', () => {
    it('responde 200 con el perfil de la ONG', async () => {
      NgosService.getProfile.mockResolvedValue(FAKE_PROFILE);
      const res = mockRes();
      await NgosController.getMe(mockReq(), res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(FAKE_PROFILE);
    });
  });

  describe('updateMe', () => {
    it('responde 200 con el perfil actualizado', async () => {
      const updated = { ...FAKE_PROFILE, area: 'Salud' };
      NgosService.updateProfile.mockResolvedValue(updated);
      const res = mockRes();
      await NgosController.updateMe(mockReq({ area: 'Salud' }), res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(updated);
    });

    it('delega userId desde req.user.id', async () => {
      NgosService.updateProfile.mockResolvedValue(FAKE_PROFILE);
      const res = mockRes();
      await NgosController.updateMe(mockReq({ organization_name: 'Nueva ONG' }), res);
      expect(NgosService.updateProfile).toHaveBeenCalledWith(
        'uuid-1',
        expect.objectContaining({ organizationName: 'Nueva ONG' }),
      );
    });
  });
});
