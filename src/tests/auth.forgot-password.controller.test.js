import { describe, it, expect, vi, beforeEach } from 'vitest';
import AuthController from '../controllers/auth.controller.js';
import AuthService from '../services/auth.service.js';

vi.mock('../services/auth.service.js');

function mockReq(body) {
  return { body };
}

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('POST /auth/forgot-password — AuthController', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('CA3 — campo email faltante', () => {
    it('responde 400 si falta email', async () => {
      const res = mockRes();
      await AuthController.forgotPassword(mockReq({}), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('CA1 — siempre responde 200', () => {
    it('responde 200 aunque el email no exista', async () => {
      AuthService.forgotPassword.mockResolvedValue(undefined);
      const res = mockRes();
      await AuthController.forgotPassword(mockReq({ email: 'noexiste@test.com' }), res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.any(String) }));
    });

    it('responde 200 cuando el email sí existe', async () => {
      AuthService.forgotPassword.mockResolvedValue(undefined);
      const res = mockRes();
      await AuthController.forgotPassword(mockReq({ email: 'ana@test.com' }), res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});

describe('POST /auth/reset-password — AuthController', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('CA3 — campos faltantes', () => {
    it('responde 400 si falta token', async () => {
      const res = mockRes();
      await AuthController.resetPassword(mockReq({ password: 'nueva123' }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('responde 400 si falta password', async () => {
      const res = mockRes();
      await AuthController.resetPassword(mockReq({ token: 'abc123' }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('CA5 — token válido', () => {
    it('responde 200 si el token es válido', async () => {
      AuthService.resetPassword.mockResolvedValue(undefined);
      const res = mockRes();
      await AuthController.resetPassword(mockReq({ token: 'abc123', password: 'nueva123' }), res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Contraseña actualizada correctamente' });
    });
  });
});
