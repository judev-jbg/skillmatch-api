import { describe, it, expect, vi, beforeEach } from 'vitest';
import AuthService from '../services/auth.service.js';
import UsersRepository from '../repositories/users.repository.js';
import pool from '../config/db.js';
import argon2 from 'argon2';

vi.mock('../repositories/users.repository.js');
vi.mock('../config/db.js', () => ({
  default: { connect: vi.fn() },
}));
vi.mock('argon2', () => ({
  default: { hash: vi.fn().mockResolvedValue('hashed_password') },
}));

describe('AuthService.register', () => {
  /** @type {{ query: import('vitest').MockInstance, release: import('vitest').MockInstance }} */
  let fakeClient;

  beforeEach(() => {
    vi.clearAllMocks();
    fakeClient = {
      query: vi.fn().mockResolvedValue({}),
      release: vi.fn(),
    };
    pool.connect.mockResolvedValue(fakeClient);
  });

  // CA1 – Rol inválido
  describe('CA1 – Validaciones de entrada', () => {
    it('lanza HttpError 400 si el rol no es student ni ngo', async () => {
      await expect(
        AuthService.register({ name: 'X', email: 'x@x.com', password: '123', role: 'admin' }),
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('lanza HttpError 400 si role=ngo y faltan organization_name y area', async () => {
      await expect(
        AuthService.register({ name: 'X', email: 'x@x.com', password: '123', role: 'ngo' }),
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('lanza HttpError 400 si role=ngo y falta area', async () => {
      await expect(
        AuthService.register({ name: 'X', email: 'x@x.com', password: '123', role: 'ngo', organizationName: 'ONG X' }),
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  // CA2 – Email duplicado
  describe('CA2 – Email duplicado', () => {
    it('lanza HttpError 409 si el email ya existe en la BD', async () => {
      UsersRepository.findByEmail.mockResolvedValue({ id: 'existing-id' });
      await expect(
        AuthService.register({ name: 'X', email: 'dup@x.com', password: '123', role: 'student' }),
      ).rejects.toMatchObject({ statusCode: 409 });
    });
  });

  // CA4 – Contraseña almacenada de forma segura
  describe('CA4 – Hash de contraseña', () => {
    it('llama a argon2.hash con la contraseña en texto plano', async () => {
      UsersRepository.findByEmail.mockResolvedValue(null);
      UsersRepository.create.mockResolvedValue({ id: 'u1', name: 'X', email: 'x@x.com', role: 'student', created_at: new Date() });
      UsersRepository.createStudentProfile.mockResolvedValue();

      await AuthService.register({ name: 'X', email: 'x@x.com', password: 'plaintext', role: 'student' });

      expect(argon2.hash).toHaveBeenCalledWith('plaintext');
    });

    it('no pasa la contraseña en texto plano al repositorio', async () => {
      UsersRepository.findByEmail.mockResolvedValue(null);
      UsersRepository.create.mockResolvedValue({ id: 'u1', role: 'student' });
      UsersRepository.createStudentProfile.mockResolvedValue();

      await AuthService.register({ name: 'X', email: 'x@x.com', password: 'plaintext', role: 'student' });

      expect(UsersRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ passwordHash: 'hashed_password' }),
        fakeClient,
      );
      expect(UsersRepository.create).not.toHaveBeenCalledWith(
        expect.objectContaining({ password: 'plaintext' }),
        fakeClient,
      );
    });
  });

  // CA5 – Rol asociado correctamente al perfil
  describe('CA5 – Perfil según rol', () => {
    it('crea student_profile y NO ngo_profile cuando role=student', async () => {
      UsersRepository.findByEmail.mockResolvedValue(null);
      UsersRepository.create.mockResolvedValue({ id: 'u1', role: 'student' });
      UsersRepository.createStudentProfile.mockResolvedValue();

      await AuthService.register({ name: 'X', email: 'x@x.com', password: '123', role: 'student' });

      expect(UsersRepository.createStudentProfile).toHaveBeenCalledWith('u1', fakeClient);
      expect(UsersRepository.createNgoProfile).not.toHaveBeenCalled();
    });

    it('crea ngo_profile y NO student_profile cuando role=ngo', async () => {
      UsersRepository.findByEmail.mockResolvedValue(null);
      UsersRepository.create.mockResolvedValue({ id: 'u2', role: 'ngo' });
      UsersRepository.createNgoProfile.mockResolvedValue();

      await AuthService.register({ name: 'ONG', email: 'o@o.com', password: '123', role: 'ngo', organizationName: 'ONG X', area: 'Salud' });

      expect(UsersRepository.createNgoProfile).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'u2', organizationName: 'ONG X', area: 'Salud' }),
        fakeClient,
      );
      expect(UsersRepository.createStudentProfile).not.toHaveBeenCalled();
    });

    it('retorna los datos del usuario sin password_hash', async () => {
      const fakeUser = { id: 'u1', name: 'X', email: 'x@x.com', role: 'student', created_at: new Date() };
      UsersRepository.findByEmail.mockResolvedValue(null);
      UsersRepository.create.mockResolvedValue(fakeUser);
      UsersRepository.createStudentProfile.mockResolvedValue();

      const result = await AuthService.register({ name: 'X', email: 'x@x.com', password: '123', role: 'student' });

      expect(result).toEqual(fakeUser);
      expect(result).not.toHaveProperty('password_hash');
    });
  });

  // Integridad transaccional
  describe('Transacción – Rollback ante fallo', () => {
    it('hace ROLLBACK y libera el cliente si falla la creación del perfil', async () => {
      UsersRepository.findByEmail.mockResolvedValue(null);
      UsersRepository.create.mockResolvedValue({ id: 'u1', role: 'student' });
      UsersRepository.createStudentProfile.mockRejectedValue(new Error('DB error'));

      await expect(
        AuthService.register({ name: 'X', email: 'x@x.com', password: '123', role: 'student' }),
      ).rejects.toThrow('DB error');

      expect(fakeClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(fakeClient.release).toHaveBeenCalled();
    });
  });
});
