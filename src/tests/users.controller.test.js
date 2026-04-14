import { describe, it, expect, vi, beforeEach } from 'vitest';
import UsersController from '../controllers/users.controller.js';
import UsersService from '../services/users.service.js';

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
  });

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
  });
});
