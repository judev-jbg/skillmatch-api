import { describe, it, expect, vi, beforeEach } from 'vitest';
import AuthService from '../services/auth.service.js';
import UsersRepository from '../repositories/users.repository.js';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';

vi.mock('../repositories/users.repository.js');
vi.mock('resend', () => ({
  Resend: vi.fn(function () {
    this.emails = { send: vi.fn().mockResolvedValue({ id: 'email-1' }) };
  }),
}));
vi.mock('argon2', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed_password'),
    verify: vi.fn(),
  },
}));
vi.mock('jsonwebtoken', () => ({
  default: { sign: vi.fn().mockReturnValue('signed.jwt.token') },
}));
vi.mock('../config/db.js', () => ({
  default: { connect: vi.fn() },
}));

const FAKE_USER = {
  id: 'uuid-1',
  name: 'Ana',
  email: 'ana@ong.org',
  role: 'student',
  password_hash: '$argon2...',
  created_at: new Date(),
};

describe('AuthService.login', () => {
  beforeEach(() => vi.clearAllMocks());

  // CA1 – Credenciales inválidas: usuario no existe
  it('lanza HttpError 401 si el email no está registrado', async () => {
    UsersRepository.findByEmail.mockResolvedValue(null);

    await expect(
      AuthService.login({ email: 'noexiste@x.com', password: '123' }),
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  // CA1 – Credenciales inválidas: contraseña incorrecta
  it('lanza HttpError 401 si la contraseña no coincide', async () => {
    UsersRepository.findByEmail.mockResolvedValue(FAKE_USER);
    argon2.verify.mockResolvedValue(false);

    await expect(
      AuthService.login({ email: 'ana@ong.org', password: 'wrongpass' }),
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  // CA2 – Mensaje genérico (no revela si el email existe)
  it('devuelve el mismo mensaje 401 tanto si no existe el usuario como si la contraseña es incorrecta', async () => {
    UsersRepository.findByEmail.mockResolvedValue(null);
    const errNoUser = await AuthService.login({ email: 'no@x.com', password: '123' }).catch(e => e);

    UsersRepository.findByEmail.mockResolvedValue(FAKE_USER);
    argon2.verify.mockResolvedValue(false);
    const errBadPass = await AuthService.login({ email: 'ana@ong.org', password: 'wrong' }).catch(e => e);

    expect(errNoUser.message).toBe(errBadPass.message);
  });

  // CA3 – JWT firmado y retornado
  it('llama a jwt.sign con sub=userId y role cuando las credenciales son válidas', async () => {
    UsersRepository.findByEmail.mockResolvedValue(FAKE_USER);
    argon2.verify.mockResolvedValue(true);

    await AuthService.login({ email: 'ana@ong.org', password: 'correct' });

    const [payload, , options] = jwt.sign.mock.calls[0];
    expect(payload).toEqual({ sub: FAKE_USER.id, role: FAKE_USER.role });
    expect(options).toMatchObject({ expiresIn: expect.anything() });
  });

  it('retorna el token JWT generado', async () => {
    UsersRepository.findByEmail.mockResolvedValue(FAKE_USER);
    argon2.verify.mockResolvedValue(true);

    const result = await AuthService.login({ email: 'ana@ong.org', password: 'correct' });

    expect(result.token).toBe('signed.jwt.token');
  });

  // CA4 – password_hash no expuesto
  it('no incluye password_hash en el objeto user retornado', async () => {
    UsersRepository.findByEmail.mockResolvedValue(FAKE_USER);
    argon2.verify.mockResolvedValue(true);

    const result = await AuthService.login({ email: 'ana@ong.org', password: 'correct' });

    expect(result.user).not.toHaveProperty('password_hash');
  });

  it('incluye id, name, email y role en el objeto user retornado', async () => {
    UsersRepository.findByEmail.mockResolvedValue(FAKE_USER);
    argon2.verify.mockResolvedValue(true);

    const result = await AuthService.login({ email: 'ana@ong.org', password: 'correct' });

    expect(result.user).toMatchObject({
      id: FAKE_USER.id,
      name: FAKE_USER.name,
      email: FAKE_USER.email,
      role: FAKE_USER.role,
    });
  });

  // CA5 – argon2.verify llamado con el hash correcto
  it('llama a argon2.verify con el hash almacenado y la contraseña recibida', async () => {
    UsersRepository.findByEmail.mockResolvedValue(FAKE_USER);
    argon2.verify.mockResolvedValue(true);

    await AuthService.login({ email: 'ana@ong.org', password: 'mypassword' });

    expect(argon2.verify).toHaveBeenCalledWith(FAKE_USER.password_hash, 'mypassword');
  });
});
