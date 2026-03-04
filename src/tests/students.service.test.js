import { describe, it, expect, vi, beforeEach } from 'vitest';
import StudentService from '../services/students.service.js';
import StudentRepository from '../repositories/students.repository.js';
import pool from '../config/db.js';

vi.mock('../repositories/students.repository.js');
vi.mock('../config/db.js', () => ({
  default: { connect: vi.fn() },
}));

const FAKE_PROFILE = {
  id: 'uuid-1',
  name: 'Ana',
  email: 'ana@test.com',
  role: 'student',
  availability: false,
  portfolio_url: null,
  skills: [],
};

describe('StudentService', () => {
  let fakeClient;

  beforeEach(() => {
    vi.clearAllMocks();
    fakeClient = { query: vi.fn().mockResolvedValue({}), release: vi.fn() };
    pool.connect.mockResolvedValue(fakeClient);
  });

  // ── getProfile ──────────────────────────────────────────────────────────────

  describe('getProfile', () => {
    it('retorna el perfil si existe', async () => {
      StudentRepository.findByUserId.mockResolvedValue(FAKE_PROFILE);
      const result = await StudentService.getProfile('uuid-1');
      expect(result).toEqual(FAKE_PROFILE);
    });

    it('lanza HttpError 404 si el perfil no existe', async () => {
      StudentRepository.findByUserId.mockResolvedValue(null);
      await expect(StudentService.getProfile('uuid-x')).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ── updateProfile ────────────────────────────────────────────────────────────

  describe('updateProfile', () => {
    it('lanza HttpError 400 si no se provee ningún campo', async () => {
      await expect(StudentService.updateProfile('uuid-1', {})).rejects.toMatchObject({ statusCode: 400 });
    });

    it('lanza HttpError 404 si el perfil no existe', async () => {
      StudentRepository.findByUserId.mockResolvedValue(null);
      await expect(
        StudentService.updateProfile('uuid-x', { availability: true }),
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('llama a StudentRepository.update y retorna el perfil actualizado', async () => {
      const updated = { ...FAKE_PROFILE, availability: true };
      StudentRepository.findByUserId
        .mockResolvedValueOnce(FAKE_PROFILE)  // verificación existencia
        .mockResolvedValueOnce(updated);       // resultado final
      StudentRepository.update.mockResolvedValue();

      const result = await StudentService.updateProfile('uuid-1', { availability: true });

      expect(StudentRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'uuid-1', availability: true }),
        fakeClient,
      );
      expect(result).toEqual(updated);
    });

    it('hace ROLLBACK y relanza si falla el update', async () => {
      StudentRepository.findByUserId.mockResolvedValue(FAKE_PROFILE);
      StudentRepository.update.mockRejectedValue(new Error('DB error'));

      await expect(
        StudentService.updateProfile('uuid-1', { availability: true }),
      ).rejects.toThrow('DB error');

      expect(fakeClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(fakeClient.release).toHaveBeenCalled();
    });
  });

  // ── updateSkills ─────────────────────────────────────────────────────────────

  describe('updateSkills', () => {
    it('lanza HttpError 400 si skills no es un array', async () => {
      await expect(StudentService.updateSkills('uuid-1', 'bad')).rejects.toMatchObject({ statusCode: 400 });
    });

    it('lanza HttpError 400 si una habilidad no tiene skill_id o level', async () => {
      await expect(
        StudentService.updateSkills('uuid-1', [{ skill_id: 'x' }]),
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('lanza HttpError 400 si el level no es válido', async () => {
      await expect(
        StudentService.updateSkills('uuid-1', [{ skill_id: 'x', level: 'expert' }]),
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('lanza HttpError 404 si el perfil no existe', async () => {
      StudentRepository.findByUserId.mockResolvedValue(null);
      await expect(
        StudentService.updateSkills('uuid-x', [{ skill_id: 'x', level: 'basic' }]),
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('permite skills vacío (limpiar habilidades)', async () => {
      StudentRepository.findByUserId.mockResolvedValue(FAKE_PROFILE);
      StudentRepository.upsertSkills.mockResolvedValue();
      StudentRepository.findByUserId.mockResolvedValueOnce(FAKE_PROFILE).mockResolvedValueOnce({ ...FAKE_PROFILE, skills: [] });

      const result = await StudentService.updateSkills('uuid-1', []);
      expect(StudentRepository.upsertSkills).toHaveBeenCalledWith('uuid-1', [], fakeClient);
    });

    it('llama a upsertSkills y retorna el perfil actualizado', async () => {
      const skills = [{ skill_id: 'sk-1', level: 'intermediate' }];
      const updated = { ...FAKE_PROFILE, skills };
      StudentRepository.findByUserId
        .mockResolvedValueOnce(FAKE_PROFILE)
        .mockResolvedValueOnce(updated);
      StudentRepository.upsertSkills.mockResolvedValue();

      const result = await StudentService.updateSkills('uuid-1', skills);

      expect(StudentRepository.upsertSkills).toHaveBeenCalledWith('uuid-1', skills, fakeClient);
      expect(result).toEqual(updated);
    });
  });
});
