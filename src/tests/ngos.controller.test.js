import { describe, it, expect, vi, beforeEach } from 'vitest';
import NgoController from '../controllers/ngos.controller.js';
import NgoService from '../services/ngos.service.js';
import { HttpError } from '../utils/errors.js';

vi.mock('../services/ngos.service.js');

/**
 * Crea un Request simulado con user inyectado por verifyToken.
 * @param {object} body
 * @param {object} user
 */
function mockReq(body = {}, user = { id: 'uuid-1', role: 'ngo' }) {
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
  id: 'uuid-1',
  name: 'ONG Test',
  email: 'ong@test.com',
  role: 'ngo',
  organization_name: 'ONG Test',
  description: null,
  area: 'Educación',
  verified: false,
};

describe('NgoController', () => {
  beforeEach(() => vi.clearAllMocks());

  // ── getMe ──────────────────────────────────────────────────────────────────

  describe('getMe', () => {
    it('responde 200 con el perfil de la ONG', async () => {
      NgoService.getProfile.mockResolvedValue(FAKE_PROFILE);
      const res = mockRes();
      await NgoController.getMe(mockReq(), res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(FAKE_PROFILE);
    });

    it('responde 404 si el servicio lanza HttpError 404', async () => {
      NgoService.getProfile.mockRejectedValue(new HttpError('no encontrado', 404));
      const res = mockRes();
      await NgoController.getMe(mockReq(), res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('responde 500 ante error inesperado', async () => {
      NgoService.getProfile.mockRejectedValue(new Error('db fail'));
      const res = mockRes();
      await NgoController.getMe(mockReq(), res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ── updateMe ───────────────────────────────────────────────────────────────

  describe('updateMe', () => {
    it('responde 200 con el perfil actualizado', async () => {
      const updated = { ...FAKE_PROFILE, area: 'Salud' };
      NgoService.updateProfile.mockResolvedValue(updated);
      const res = mockRes();
      await NgoController.updateMe(mockReq({ area: 'Salud' }), res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(updated);
    });

    it('responde 400 si el servicio lanza HttpError 400', async () => {
      NgoService.updateProfile.mockRejectedValue(new HttpError('debe proporcionar al menos un campo', 400));
      const res = mockRes();
      await NgoController.updateMe(mockReq({}), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('delega userId desde req.user.id', async () => {
      NgoService.updateProfile.mockResolvedValue(FAKE_PROFILE);
      const res = mockRes();
      await NgoController.updateMe(mockReq({ organization_name: 'Nueva ONG' }), res);
      expect(NgoService.updateProfile).toHaveBeenCalledWith(
        'uuid-1',
        expect.objectContaining({ organization_name: 'Nueva ONG' }),
      );
    });

    it('responde 500 ante error inesperado', async () => {
      NgoService.updateProfile.mockRejectedValue(new Error('db fail'));
      const res = mockRes();
      await NgoController.updateMe(mockReq({ area: 'Salud' }), res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
