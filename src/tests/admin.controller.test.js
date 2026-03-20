import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdminController from '../controllers/admin.controller.js';
import NgosService from '../services/ngos.service.js';
import { HttpError } from '../utils/errors.js';

vi.mock('../services/ngos.service.js');

function mockReq({ body = {}, query = {}, params = {}, user = { id: 'admin-1', role: 'admin' } } = {}) {
  return { body, query, params, user };
}

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

const FAKE_PROFILE = {
  id: 'ngo-1',
  name: 'ONG Test',
  email: 'ong@test.com',
  role: 'ngo',
  verified: true,
};

describe('AdminController', () => {
  beforeEach(() => vi.clearAllMocks());

  // ── verifyNgo ─────────────────────────────────────────────────────────────

  describe('verifyNgo', () => {
    it('responde 200 con el perfil verificado', async () => {
      NgosService.verify.mockResolvedValue(FAKE_PROFILE);
      const res = mockRes();
      await AdminController.verifyNgo(mockReq({ params: { user_id: 'ngo-1' } }), res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(FAKE_PROFILE);
    });

    it('responde 404 si la ONG no existe', async () => {
      NgosService.verify.mockRejectedValue(new HttpError('no encontrada', 404));
      const res = mockRes();
      await AdminController.verifyNgo(mockReq({ params: { user_id: 'bad' } }), res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('responde 500 ante error inesperado', async () => {
      NgosService.verify.mockRejectedValue(new Error('db fail'));
      const res = mockRes();
      await AdminController.verifyNgo(mockReq({ params: { user_id: 'ngo-1' } }), res);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('delega user_id correctamente', async () => {
      NgosService.verify.mockResolvedValue(FAKE_PROFILE);
      const res = mockRes();
      await AdminController.verifyNgo(mockReq({ params: { user_id: 'ngo-1' } }), res);
      expect(NgosService.verify).toHaveBeenCalledWith('ngo-1');
    });
  });
});
