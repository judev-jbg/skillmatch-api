import { describe, it, expect, vi, beforeEach } from 'vitest';
import UsersController from '../controllers/users.controller.js';
import UsersService from '../services/users.service.js';
import { HttpError } from '../utils/errors.js';

vi.mock('../services/users.service.js');

function mockReq({ body = {}, user = { id: 'user-1', role: 'student' } } = {}) {
  return { body, user };
}

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

const FAKE_USER = {
  id: 'user-1',
  name: 'Juan',
  email: 'juan@test.com',
  role: 'student',
  created_at: new Date(),
};

describe('UsersController', () => {
  beforeEach(() => vi.clearAllMocks());

  // ── getMe ─────────────────────────────────────────────────────────────────

  describe('getMe', () => {
    it('responde 200 con los datos del usuario', async () => {
      UsersService.getMe.mockResolvedValue(FAKE_USER);
      const res = mockRes();
      await UsersController.getMe(mockReq(), res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(FAKE_USER);
    });

    it('delega userId desde req.user.id', async () => {
      UsersService.getMe.mockResolvedValue(FAKE_USER);
      const res = mockRes();
      await UsersController.getMe(mockReq({ user: { id: 'user-1', role: 'student' } }), res);
      expect(UsersService.getMe).toHaveBeenCalledWith('user-1');
    });

    it('responde 404 si el usuario no existe', async () => {
      UsersService.getMe.mockRejectedValue(new HttpError('no encontrado', 404));
      const res = mockRes();
      await UsersController.getMe(mockReq(), res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('responde 500 ante error inesperado', async () => {
      UsersService.getMe.mockRejectedValue(new Error('db fail'));
      const res = mockRes();
      await UsersController.getMe(mockReq(), res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ── updateMe ──────────────────────────────────────────────────────────────

  describe('updateMe', () => {
    it('responde 200 con el usuario actualizado', async () => {
      const updated = { ...FAKE_USER, name: 'Pedro' };
      UsersService.updateMe.mockResolvedValue(updated);
      const res = mockRes();
      await UsersController.updateMe(mockReq({ body: { name: 'Pedro' } }), res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(updated);
    });

    it('delega userId y datos correctamente', async () => {
      UsersService.updateMe.mockResolvedValue(FAKE_USER);
      const res = mockRes();
      await UsersController.updateMe(mockReq({ body: { name: 'Pedro', email: 'p@test.com' } }), res);
      expect(UsersService.updateMe).toHaveBeenCalledWith('user-1', { name: 'Pedro', email: 'p@test.com' });
    });

    it('responde 400 si no hay campos', async () => {
      UsersService.updateMe.mockRejectedValue(new HttpError('al menos un campo', 400));
      const res = mockRes();
      await UsersController.updateMe(mockReq({ body: {} }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('responde 409 si el email ya está en uso', async () => {
      UsersService.updateMe.mockRejectedValue(new HttpError('email en uso', 409));
      const res = mockRes();
      await UsersController.updateMe(mockReq({ body: { email: 'otro@test.com' } }), res);
      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('responde 500 ante error inesperado', async () => {
      UsersService.updateMe.mockRejectedValue(new Error('db fail'));
      const res = mockRes();
      await UsersController.updateMe(mockReq({ body: { name: 'x' } }), res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
