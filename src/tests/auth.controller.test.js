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

describe('POST /auth/register — AuthController', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('CA1 – Campos obligatorios', () => {
    it('responde 400 si falta name', async () => {
      const res = mockRes();
      await AuthController.register(mockReq({ email: 'a@b.com', password: '123', role: 'student' }), res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('requeridos') }));
    });

    it('responde 400 si falta email', async () => {
      const res = mockRes();
      await AuthController.register(mockReq({ name: 'Ana', password: '123', role: 'student' }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('responde 400 si falta password', async () => {
      const res = mockRes();
      await AuthController.register(mockReq({ name: 'Ana', email: 'a@b.com', role: 'student' }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('responde 400 si falta role', async () => {
      const res = mockRes();
      await AuthController.register(mockReq({ name: 'Ana', email: 'a@b.com', password: '123' }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('CA3 – Formato de email', () => {
    it('responde 400 si el email no tiene @', async () => {
      const res = mockRes();
      await AuthController.register(mockReq({ name: 'Ana', email: 'noesvalido', password: '123', role: 'student' }), res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('email') }));
    });

    it('responde 400 si el email no tiene dominio', async () => {
      const res = mockRes();
      await AuthController.register(mockReq({ name: 'Ana', email: 'ana@', password: '123', role: 'student' }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('acepta un email con formato válido y delega al servicio', async () => {
      AuthService.register.mockResolvedValue({ id: '1', name: 'Ana', email: 'ana@ong.org', role: 'student', created_at: new Date() });
      const res = mockRes();
      await AuthController.register(mockReq({ name: 'Ana', email: 'ana@ong.org', password: '123', role: 'student' }), res);
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('CA5 – Registro exitoso', () => {
    it('responde 201 con role=student en el payload', async () => {
      const fakeUser = { id: 'uuid-1', name: 'Ana', email: 'ana@test.com', role: 'student', created_at: new Date() };
      AuthService.register.mockResolvedValue(fakeUser);
      const res = mockRes();
      await AuthController.register(mockReq({ name: 'Ana', email: 'ana@test.com', password: 'pass123', role: 'student' }), res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ user: expect.objectContaining({ role: 'student' }) }));
    });

    it('responde 201 con role=ngo en el payload', async () => {
      const fakeUser = { id: 'uuid-2', name: 'Org', email: 'org@ngo.com', role: 'ngo', created_at: new Date() };
      AuthService.register.mockResolvedValue(fakeUser);
      const res = mockRes();
      await AuthController.register(mockReq({ name: 'Org', email: 'org@ngo.com', password: 'pass123', role: 'ngo', organization_name: 'ONG X', area: 'Educación' }), res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ user: expect.objectContaining({ role: 'ngo' }) }));
    });
  });
});
