import { describe, it, expect, vi, beforeEach } from 'vitest';
import AuthController from '../controllers/auth.controller.js';
import AuthService from '../services/auth.service.js';
import { HttpError } from '../utils/errors.js';

vi.mock('../services/auth.service.js');

/**
 * Crea un objeto Request de Express simulado.
 * @param {object} body
 * @returns {{ body: object }}
 */
function mockReq(body) {
  return { body };
}

/**
 * Crea un objeto Response de Express simulado con spies encadenados y cookie spy.
 * @returns {{ status: import('vitest').MockInstance, json: import('vitest').MockInstance, cookie: import('vitest').MockInstance }}
 */
function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.cookie = vi.fn().mockReturnValue(res);
  return res;
}

describe('POST /auth/login — AuthController', () => {
  beforeEach(() => vi.clearAllMocks());

  // CA1 – Campos obligatorios
  describe('CA1 – Campos obligatorios', () => {
    it('responde 400 si falta email', async () => {
      const res = mockRes();
      await AuthController.login(mockReq({ password: '123' }), res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('requeridos') }));
    });

    it('responde 400 si falta password', async () => {
      const res = mockRes();
      await AuthController.login(mockReq({ email: 'ana@ong.org' }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // CA1 – Credenciales inválidas
  describe('CA1 – Credenciales inválidas', () => {
    it('responde 401 si el servicio lanza HttpError de credenciales inválidas', async () => {
      AuthService.login.mockRejectedValue(new HttpError('Credenciales inválidas', 401));
      const res = mockRes();
      await AuthController.login(mockReq({ email: 'x@x.com', password: 'wrong' }), res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Credenciales inválidas' }));
    });
  });

  // CA3 – Cookie HttpOnly establecida
  describe('CA3 – Cookie HttpOnly', () => {
    it('establece la cookie "token" con httpOnly=true en login exitoso', async () => {
      AuthService.login.mockResolvedValue({
        token: 'signed.jwt.token',
        user: { id: 'u1', name: 'Ana', email: 'ana@ong.org', role: 'student', created_at: new Date() },
      });
      const res = mockRes();
      await AuthController.login(mockReq({ email: 'ana@ong.org', password: 'pass' }), res);

      expect(res.cookie).toHaveBeenCalledWith(
        'token',
        'signed.jwt.token',
        expect.objectContaining({ httpOnly: true }),
      );
    });
  });

  // CA4 – Respuesta 200 con datos del usuario
  describe('CA4 – Login exitoso', () => {
    it('responde 200 con el objeto user en el payload', async () => {
      const fakeUser = { id: 'u1', name: 'Ana', email: 'ana@ong.org', role: 'student', created_at: new Date() };
      AuthService.login.mockResolvedValue({ token: 'jwt', user: fakeUser });
      const res = mockRes();

      await AuthController.login(mockReq({ email: 'ana@ong.org', password: 'pass' }), res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ user: expect.objectContaining({ role: 'student' }) }),
      );
    });

    it('no expone el token en el body de la respuesta', async () => {
      const fakeUser = { id: 'u1', name: 'Ana', email: 'ana@ong.org', role: 'student', created_at: new Date() };
      AuthService.login.mockResolvedValue({ token: 'jwt', user: fakeUser });
      const res = mockRes();

      await AuthController.login(mockReq({ email: 'ana@ong.org', password: 'pass' }), res);

      const body = res.json.mock.calls[0][0];
      expect(body).not.toHaveProperty('token');
    });
  });

  // Error inesperado → 500
  it('responde 500 ante un error inesperado del servicio', async () => {
    AuthService.login.mockRejectedValue(new Error('DB connection lost'));
    const res = mockRes();
    await AuthController.login(mockReq({ email: 'ana@ong.org', password: 'pass' }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
