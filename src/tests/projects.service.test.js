import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProjectsService from '../services/projects.service.js';
import ProjectsRepository from '../repositories/projects.repository.js';
import pool from '../config/db.js';

vi.mock('../repositories/projects.repository.js');
vi.mock('../config/db.js', () => ({
  default: { connect: vi.fn() },
}));

const FAKE_PROJECT = {
  id: 'proj-1',
  ngo_id: 'ngo-1',
  title: 'App voluntarios',
  description: null,
  objectives: null,
  estimated_hours: null,
  deadline: null,
  modality: null,
  status: 'pending',
  created_at: new Date(),
  skills: [],
};

describe('ProjectsService', () => {
  let fakeClient;

  beforeEach(() => {
    vi.clearAllMocks();
    fakeClient = { query: vi.fn().mockResolvedValue({}), release: vi.fn() };
    pool.connect.mockResolvedValue(fakeClient);
  });

  // ── create ──────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('lanza HttpError 400 si falta title', async () => {
      await expect(ProjectsService.create('ngo-1', {})).rejects.toMatchObject({ statusCode: 400 });
    });

    it('lanza HttpError 400 si skills no es array', async () => {
      await expect(
        ProjectsService.create('ngo-1', { title: 'Test', skills: 'bad' }),
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('lanza HttpError 400 si una skill tiene required_level inválido', async () => {
      await expect(
        ProjectsService.create('ngo-1', { title: 'Test', skills: [{ skill_id: 'x', required_level: 'expert' }] }),
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('crea el proyecto y retorna con findById', async () => {
      ProjectsRepository.create.mockResolvedValue({ id: 'proj-1' });
      ProjectsRepository.findById.mockResolvedValue(FAKE_PROJECT);

      const result = await ProjectsService.create('ngo-1', { title: 'App voluntarios' });

      expect(ProjectsRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ ngoId: 'ngo-1', title: 'App voluntarios' }),
        fakeClient,
      );
      expect(result).toEqual(FAKE_PROJECT);
    });

    it('llama a upsertSkills si se proveen skills', async () => {
      const skills = [{ skill_id: 'sk-1', required_level: 'basic' }];
      ProjectsRepository.create.mockResolvedValue({ id: 'proj-1' });
      ProjectsRepository.upsertSkills.mockResolvedValue();
      ProjectsRepository.findById.mockResolvedValue({ ...FAKE_PROJECT, skills });

      await ProjectsService.create('ngo-1', { title: 'Test', skills });

      expect(ProjectsRepository.upsertSkills).toHaveBeenCalledWith('proj-1', skills, fakeClient);
    });

    it('hace ROLLBACK si falla el insert', async () => {
      ProjectsRepository.create.mockRejectedValue(new Error('DB error'));

      await expect(
        ProjectsService.create('ngo-1', { title: 'Test' }),
      ).rejects.toThrow('DB error');

      expect(fakeClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(fakeClient.release).toHaveBeenCalled();
    });
  });

  // ── getAll ──────────────────────────────────────────────────────────────────

  describe('getAll', () => {
    it('devuelve la lista de proyectos', async () => {
      ProjectsRepository.findAll.mockResolvedValue([FAKE_PROJECT]);
      const result = await ProjectsService.getAll();
      expect(result).toEqual([FAKE_PROJECT]);
    });

    it('lanza HttpError 400 si status es inválido', async () => {
      await expect(ProjectsService.getAll({ status: 'invalid' })).rejects.toMatchObject({ statusCode: 400 });
    });

    it('pasa los filtros al repositorio', async () => {
      ProjectsRepository.findAll.mockResolvedValue([]);
      await ProjectsService.getAll({ status: 'pending', skill_id: 'sk-1' });
      expect(ProjectsRepository.findAll).toHaveBeenCalledWith({ status: 'pending', skillId: 'sk-1' });
    });
  });

  // ── getById ─────────────────────────────────────────────────────────────────

  describe('getById', () => {
    it('retorna el proyecto si existe', async () => {
      ProjectsRepository.findById.mockResolvedValue(FAKE_PROJECT);
      const result = await ProjectsService.getById('proj-1');
      expect(result).toEqual(FAKE_PROJECT);
    });

    it('lanza HttpError 404 si no existe', async () => {
      ProjectsRepository.findById.mockResolvedValue(null);
      await expect(ProjectsService.getById('bad-id')).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ── update ──────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('lanza HttpError 400 si no se provee ningún campo', async () => {
      await expect(ProjectsService.update('proj-1', 'ngo-1', {})).rejects.toMatchObject({ statusCode: 400 });
    });

    it('lanza HttpError 404 si el proyecto no existe', async () => {
      ProjectsRepository.findById.mockResolvedValue(null);
      await expect(
        ProjectsService.update('bad-id', 'ngo-1', { title: 'nuevo' }),
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('lanza HttpError 403 si la ONG no es propietaria', async () => {
      ProjectsRepository.findById.mockResolvedValue({ ...FAKE_PROJECT, ngo_id: 'otra-ngo' });
      await expect(
        ProjectsService.update('proj-1', 'ngo-1', { title: 'nuevo' }),
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    it('actualiza y retorna el proyecto actualizado', async () => {
      const updated = { ...FAKE_PROJECT, title: 'nuevo' };
      ProjectsRepository.findById
        .mockResolvedValueOnce(FAKE_PROJECT)
        .mockResolvedValueOnce(updated);
      ProjectsRepository.update.mockResolvedValue();

      const result = await ProjectsService.update('proj-1', 'ngo-1', { title: 'nuevo' });

      expect(ProjectsRepository.update).toHaveBeenCalledWith(
        'proj-1',
        expect.objectContaining({ title: 'nuevo' }),
        fakeClient,
      );
      expect(result).toEqual(updated);
    });
  });

  // ── updateSkills ──────────────────────────────────────────────────────────

  describe('updateSkills', () => {
    const skills = [{ skill_id: 'sk-1', required_level: 'basic' }];

    it('lanza HttpError 400 si skills no es un array', async () => {
      await expect(ProjectsService.updateSkills('proj-1', 'ngo-1', 'bad')).rejects.toMatchObject({ statusCode: 400 });
    });

    it('lanza HttpError 404 si el proyecto no existe', async () => {
      ProjectsRepository.findById.mockResolvedValue(null);
      await expect(
        ProjectsService.updateSkills('bad-id', 'ngo-1', skills),
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('lanza HttpError 403 si la ONG no es propietaria', async () => {
      ProjectsRepository.findById.mockResolvedValue({ ...FAKE_PROJECT, ngo_id: 'otra-ngo' });
      await expect(
        ProjectsService.updateSkills('proj-1', 'ngo-1', skills),
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    it('reemplaza skills y retorna el proyecto actualizado', async () => {
      const updated = { ...FAKE_PROJECT, skills };
      ProjectsRepository.findById
        .mockResolvedValueOnce(FAKE_PROJECT)
        .mockResolvedValueOnce(updated);
      ProjectsRepository.upsertSkills.mockResolvedValue();

      const result = await ProjectsService.updateSkills('proj-1', 'ngo-1', skills);

      expect(ProjectsRepository.upsertSkills).toHaveBeenCalledWith('proj-1', skills, fakeClient);
      expect(result).toEqual(updated);
    });

    it('hace ROLLBACK si falla upsertSkills', async () => {
      ProjectsRepository.findById.mockResolvedValue(FAKE_PROJECT);
      ProjectsRepository.upsertSkills.mockRejectedValue(new Error('DB error'));

      await expect(
        ProjectsService.updateSkills('proj-1', 'ngo-1', skills),
      ).rejects.toThrow('DB error');

      expect(fakeClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(fakeClient.release).toHaveBeenCalled();
    });
  });
});
