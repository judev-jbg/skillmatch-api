import { describe, it, expect, vi, beforeEach } from 'vitest';
import UsersService from '../services/users.service.js';
import UsersRepository from '../repositories/users.repository.js';
import pool from '../config/db.js';

vi.mock('../repositories/users.repository.js');
vi.mock('../config/db.js', () => ({
  default: { connect: vi.fn() },
}));

const FAKE_USER = {
  id: 'user-1',
  name: 'Juan',
  email: 'juan@test.com',
  role: 'student',
  created_at: new Date(),
  password_hash: 'hashed',
};

describe('UsersService', () => {
  let fakeClient;

  beforeEach(() => {
    vi.clearAllMocks();
    fakeClient = { query: vi.fn().mockResolvedValue({}), release: vi.fn() };
    pool.connect.mockResolvedValue(fakeClient);
  });

  // ── getMe ─────────────────────────────────────────────────────────────────

  describe('getMe', () => {
    it('retorna el usuario sin password_hash', async () => {
      UsersRepository.findById.mockResolvedValue(FAKE_USER);
      const result = await UsersService.getMe('user-1');
      expect(result).not.toHaveProperty('password_hash');
      expect(result).toMatchObject({ id: 'user-1', name: 'Juan' });
    });

    it('lanza HttpError 404 si el usuario no existe', async () => {
      UsersRepository.findById.mockResolvedValue(null);
      await expect(UsersService.getMe('bad-id')).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ── updateMe ──────────────────────────────────────────────────────────────

  describe('updateMe', () => {
    it('lanza HttpError 400 si no se provee ningún campo', async () => {
      await expect(UsersService.updateMe('user-1', {})).rejects.toMatchObject({ statusCode: 400 });
    });

    it('lanza HttpError 409 si el email ya está en uso por otro usuario', async () => {
      UsersRepository.findByEmail.mockResolvedValue({ ...FAKE_USER, id: 'otro-user' });
      await expect(
        UsersService.updateMe('user-1', { email: 'juan@test.com' }),
      ).rejects.toMatchObject({ statusCode: 409 });
    });

    it('no lanza 409 si el email pertenece al mismo usuario', async () => {
      UsersRepository.findByEmail.mockResolvedValue(FAKE_USER);
      const updated = { ...FAKE_USER, email: 'juan@test.com' };
      UsersRepository.update.mockResolvedValue(updated);

      const result = await UsersService.updateMe('user-1', { email: 'juan@test.com' });
      expect(result).toEqual(updated);
    });

    it('actualiza y retorna el usuario', async () => {
      UsersRepository.findByEmail.mockResolvedValue(null);
      const updated = { ...FAKE_USER, name: 'Pedro' };
      UsersRepository.update.mockResolvedValue(updated);

      const result = await UsersService.updateMe('user-1', { name: 'Pedro' });

      expect(UsersRepository.update).toHaveBeenCalledWith(
        { userId: 'user-1', name: 'Pedro', email: undefined },
        fakeClient,
      );
      expect(result).toEqual(updated);
    });

    it('hace ROLLBACK si falla el update', async () => {
      UsersRepository.findByEmail.mockResolvedValue(null);
      UsersRepository.update.mockRejectedValue(new Error('DB error'));

      await expect(
        UsersService.updateMe('user-1', { name: 'Pedro' }),
      ).rejects.toThrow('DB error');

      expect(fakeClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(fakeClient.release).toHaveBeenCalled();
    });
  });
});
