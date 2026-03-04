import { describe, it, expect, vi, beforeEach } from 'vitest';
import NgoService from '../services/ngos.service.js';
import NgoRepository from '../repositories/ngos.repository.js';
import pool from '../config/db.js';

vi.mock('../repositories/ngos.repository.js');
vi.mock('../config/db.js', () => ({
  default: { connect: vi.fn() },
}));

const FAKE_PROFILE = {
  id: 'uuid-1',
  name: 'ONG Test',
  email: 'ong@test.com',
  role: 'ngo',
  created_at: new Date(),
  organization_name: 'ONG Test',
  description: null,
  area: 'Educación',
  verified: false,
};

describe('NgoService', () => {
  let fakeClient;

  beforeEach(() => {
    vi.clearAllMocks();
    fakeClient = { query: vi.fn().mockResolvedValue({}), release: vi.fn() };
    pool.connect.mockResolvedValue(fakeClient);
  });

  // ── getProfile ──────────────────────────────────────────────────────────────

  describe('getProfile', () => {
    it('retorna el perfil si existe', async () => {
      NgoRepository.findByUserId.mockResolvedValue(FAKE_PROFILE);
      const result = await NgoService.getProfile('uuid-1');
      expect(result).toEqual(FAKE_PROFILE);
    });

    it('lanza HttpError 404 si el perfil no existe', async () => {
      NgoRepository.findByUserId.mockResolvedValue(null);
      await expect(NgoService.getProfile('uuid-x')).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ── updateProfile ────────────────────────────────────────────────────────────

  describe('updateProfile', () => {
    it('lanza HttpError 400 si no se provee ningún campo', async () => {
      await expect(NgoService.updateProfile('uuid-1', {})).rejects.toMatchObject({ statusCode: 400 });
    });

    it('lanza HttpError 404 si el perfil no existe', async () => {
      NgoRepository.findByUserId.mockResolvedValue(null);
      await expect(
        NgoService.updateProfile('uuid-x', { area: 'Salud' }),
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('llama a NgoRepository.update con los campos correctos', async () => {
      const updated = { ...FAKE_PROFILE, area: 'Salud' };
      NgoRepository.findByUserId
        .mockResolvedValueOnce(FAKE_PROFILE)
        .mockResolvedValueOnce(updated);
      NgoRepository.update.mockResolvedValue();

      const result = await NgoService.updateProfile('uuid-1', { area: 'Salud' });

      expect(NgoRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'uuid-1', area: 'Salud' }),
        fakeClient,
      );
      expect(result).toEqual(updated);
    });

    it('hace ROLLBACK y relanza si falla el update', async () => {
      NgoRepository.findByUserId.mockResolvedValue(FAKE_PROFILE);
      NgoRepository.update.mockRejectedValue(new Error('DB error'));

      await expect(
        NgoService.updateProfile('uuid-1', { description: 'nueva desc' }),
      ).rejects.toThrow('DB error');

      expect(fakeClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(fakeClient.release).toHaveBeenCalled();
    });

    it('permite actualizar solo description', async () => {
      const updated = { ...FAKE_PROFILE, description: 'nueva desc' };
      NgoRepository.findByUserId
        .mockResolvedValueOnce(FAKE_PROFILE)
        .mockResolvedValueOnce(updated);
      NgoRepository.update.mockResolvedValue();

      const result = await NgoService.updateProfile('uuid-1', { description: 'nueva desc' });
      expect(result.description).toBe('nueva desc');
    });
  });
});
