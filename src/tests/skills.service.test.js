import { describe, it, expect, vi, beforeEach } from 'vitest';
import SkillsService from '../services/skills.service.js';
import SkillsRepository from '../repositories/skills.repository.js';

vi.mock('../repositories/skills.repository.js');

const FAKE_SKILL = {
  id: 'sk-1',
  name: 'JavaScript',
  category: 'Desarrollo',
};

describe('SkillsService', () => {
  beforeEach(() => vi.clearAllMocks());

  // ── create ──────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('lanza HttpError 400 si falta name', async () => {
      await expect(SkillsService.create(null, 'Desarrollo')).rejects.toMatchObject({ statusCode: 400 });
    });

    it('lanza HttpError 400 si falta category', async () => {
      await expect(SkillsService.create('JavaScript', null)).rejects.toMatchObject({ statusCode: 400 });
    });

    it('lanza HttpError 400 si category es inválida', async () => {
      await expect(SkillsService.create('JavaScript', 'Inventada')).rejects.toMatchObject({ statusCode: 400 });
    });

    it('crea la skill y la retorna', async () => {
      SkillsRepository.create.mockResolvedValue(FAKE_SKILL);

      const result = await SkillsService.create('JavaScript', 'Desarrollo');

      expect(SkillsRepository.create).toHaveBeenCalledWith({ name: 'JavaScript', category: 'Desarrollo' });
      expect(result).toEqual(FAKE_SKILL);
    });
  });

  // ── getAll ──────────────────────────────────────────────────────────────────

  describe('getAll', () => {
    it('devuelve la lista de skills', async () => {
      SkillsRepository.findAll.mockResolvedValue([FAKE_SKILL]);

      const result = await SkillsService.getAll();

      expect(result).toEqual([FAKE_SKILL]);
    });

    it('pasa el filtro de categoría al repositorio', async () => {
      SkillsRepository.findAll.mockResolvedValue([]);

      await SkillsService.getAll({ category: 'Desarrollo' });

      expect(SkillsRepository.findAll).toHaveBeenCalledWith({ category: 'Desarrollo' });
    });
  });

  // ── update ──────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('lanza HttpError 400 si no se provee ningún campo', async () => {
      await expect(SkillsService.update('sk-1', {})).rejects.toMatchObject({ statusCode: 400 });
    });

    it('lanza HttpError 400 si category es inválida', async () => {
      await expect(SkillsService.update('sk-1', { category: 'Inventada' })).rejects.toMatchObject({ statusCode: 400 });
    });

    it('lanza HttpError 404 si la skill no existe', async () => {
      SkillsRepository.findById.mockResolvedValue(null);

      await expect(SkillsService.update('bad-id', { name: 'React' })).rejects.toMatchObject({ statusCode: 404 });
    });

    it('actualiza y retorna la skill', async () => {
      const updated = { ...FAKE_SKILL, name: 'React' };
      SkillsRepository.findById.mockResolvedValue(FAKE_SKILL);
      SkillsRepository.update.mockResolvedValue(updated);

      const result = await SkillsService.update('sk-1', { name: 'React' });

      expect(SkillsRepository.update).toHaveBeenCalledWith('sk-1', { name: 'React', category: undefined });
      expect(result).toEqual(updated);
    });
  });

  // ── remove ──────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('lanza HttpError 404 si la skill no existe', async () => {
      SkillsRepository.findById.mockResolvedValue(null);

      await expect(SkillsService.remove('bad-id')).rejects.toMatchObject({ statusCode: 404 });
    });

    it('elimina la skill correctamente', async () => {
      SkillsRepository.findById.mockResolvedValue(FAKE_SKILL);
      SkillsRepository.remove.mockResolvedValue();

      await SkillsService.remove('sk-1');

      expect(SkillsRepository.remove).toHaveBeenCalledWith('sk-1');
    });
  });
});
