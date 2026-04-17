import { describe, it, expect, vi, beforeEach } from 'vitest';
import AuthService from '../services/auth.service.js';
import UsersRepository from '../repositories/users.repository.js';
import PasswordResetRepository from '../repositories/password-reset.repository.js';
import argon2 from 'argon2';

vi.mock('../repositories/users.repository.js');
vi.mock('../repositories/password-reset.repository.js');
vi.mock('argon2', () => ({
  default: { hash: vi.fn().mockResolvedValue('hashed_new_password') },
}));
vi.mock('resend', () => ({
  Resend: vi.fn(function () {
    this.emails = { send: vi.fn().mockResolvedValue({ id: 'email-1' }) };
  }),
}));

const FAKE_USER = { id: 'user-1', name: 'Ana', email: 'ana@test.com', password_hash: 'hash' };
const FAKE_TOKEN_RECORD = { id: 'token-1', user_id: 'user-1', token: 'abc123' };

describe('AuthService.forgotPassword', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('CA1 — email no registrado', () => {
    it('no lanza error y no crea token si el email no existe', async () => {
      UsersRepository.findByEmail.mockResolvedValue(null);

      await expect(AuthService.forgotPassword('noexiste@test.com')).resolves.toBeUndefined();
      expect(PasswordResetRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('CA2 — email registrado', () => {
    it('borra tokens anteriores, crea token nuevo y envía email', async () => {
      UsersRepository.findByEmail.mockResolvedValue(FAKE_USER);
      PasswordResetRepository.deleteByUserId.mockResolvedValue();
      PasswordResetRepository.create.mockResolvedValue(FAKE_TOKEN_RECORD);

      await AuthService.forgotPassword('ana@test.com');

      expect(PasswordResetRepository.deleteByUserId).toHaveBeenCalledWith('user-1');
      expect(PasswordResetRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-1', token: expect.any(String), expiresAt: expect.any(Date) }),
      );
    });

    it('el token generado tiene 64 caracteres hexadecimales', async () => {
      UsersRepository.findByEmail.mockResolvedValue(FAKE_USER);
      PasswordResetRepository.deleteByUserId.mockResolvedValue();
      PasswordResetRepository.create.mockResolvedValue(FAKE_TOKEN_RECORD);

      await AuthService.forgotPassword('ana@test.com');

      const call = PasswordResetRepository.create.mock.calls[0][0];
      expect(call.token).toMatch(/^[a-f0-9]{64}$/);
    });

    it('la fecha de expiración es aproximadamente 1h en el futuro', async () => {
      UsersRepository.findByEmail.mockResolvedValue(FAKE_USER);
      PasswordResetRepository.deleteByUserId.mockResolvedValue();
      PasswordResetRepository.create.mockResolvedValue(FAKE_TOKEN_RECORD);

      const before = Date.now();
      await AuthService.forgotPassword('ana@test.com');
      const after = Date.now();

      const call = PasswordResetRepository.create.mock.calls[0][0];
      const expiresMs = call.expiresAt.getTime();
      expect(expiresMs).toBeGreaterThanOrEqual(before + 59 * 60 * 1000);
      expect(expiresMs).toBeLessThanOrEqual(after + 61 * 60 * 1000);
    });
  });
});

describe('AuthService.resetPassword', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('CA4 — token inválido o expirado', () => {
    it('lanza HttpError 400 si el token no existe o ha expirado', async () => {
      PasswordResetRepository.findByToken.mockResolvedValue(null);

      await expect(
        AuthService.resetPassword({ token: 'invalido', password: 'nueva123' }),
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe('CA5 — token válido', () => {
    it('actualiza la contraseña con argon2 y borra el token', async () => {
      PasswordResetRepository.findByToken.mockResolvedValue(FAKE_TOKEN_RECORD);
      UsersRepository.updatePassword.mockResolvedValue();
      PasswordResetRepository.deleteByUserId.mockResolvedValue();

      await AuthService.resetPassword({ token: 'abc123', password: 'nueva123' });

      expect(argon2.hash).toHaveBeenCalledWith('nueva123');
      expect(UsersRepository.updatePassword).toHaveBeenCalledWith('user-1', 'hashed_new_password');
      expect(PasswordResetRepository.deleteByUserId).toHaveBeenCalledWith('user-1');
    });
  });
});
