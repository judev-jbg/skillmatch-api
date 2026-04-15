import { describe, it, expect, vi, beforeEach } from 'vitest';
import ApplicationsService from '../services/applications.service.js';
import ApplicationsRepository from '../repositories/applications.repository.js';
import ProjectsRepository from '../repositories/projects.repository.js';
import StudentsRepository from '../repositories/students.repository.js';
import pool from '../config/db.js';

vi.mock('../repositories/applications.repository.js');
vi.mock('../repositories/projects.repository.js');
vi.mock('../repositories/students.repository.js');
vi.mock('../config/db.js', () => ({
  default: { connect: vi.fn() },
}));

const FAKE_PROJECT = {
  id: 'proj-1',
  ngo_id: 'ngo-1',
  title: 'App voluntarios',
  status: 'pending',
  created_at: new Date(),
  skills: [],
};

const FAKE_STUDENT = {
  id: 'student-1',
  name: 'Laura',
  skills: [{ skill_id: 'sk-1', level: 'intermediate' }],
};

const FAKE_APPLICATION = {
  id: 'app-1',
  project_id: 'proj-1',
  student_id: 'student-1',
  compatibility_score: 100,
  status: 'pending',
};

describe('ApplicationsService', () => {
  let fakeClient;

  beforeEach(() => {
    vi.clearAllMocks();
    fakeClient = { query: vi.fn().mockResolvedValue({}), release: vi.fn() };
    pool.connect.mockResolvedValue(fakeClient);
  });

  // ── create ────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('lanza HttpError 400 si falta project_id', async () => {
      await expect(ApplicationsService.create('student-1', {})).rejects.toMatchObject({ statusCode: 400 });
    });

    it('lanza HttpError 404 si el proyecto no existe', async () => {
      ProjectsRepository.findById.mockResolvedValue(null);
      await expect(
        ApplicationsService.create('student-1', { projectId: 'bad-id' }),
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('lanza HttpError 409 si el estudiante ya aplicó', async () => {
      ProjectsRepository.findById.mockResolvedValue(FAKE_PROJECT);
      StudentsRepository.findByUserId.mockResolvedValue(FAKE_STUDENT);
      ApplicationsRepository.findByProjectAndStudent.mockResolvedValue(FAKE_APPLICATION);
      await expect(
        ApplicationsService.create('student-1', { projectId: 'proj-1' }),
      ).rejects.toMatchObject({ statusCode: 409 });
    });

    it('crea la aplicación con score y retorna el resultado', async () => {
      ProjectsRepository.findById.mockResolvedValue(FAKE_PROJECT);
      StudentsRepository.findByUserId.mockResolvedValue(FAKE_STUDENT);
      ApplicationsRepository.findByProjectAndStudent.mockResolvedValue(null);
      ApplicationsRepository.create.mockResolvedValue(FAKE_APPLICATION);

      const result = await ApplicationsService.create('student-1', { projectId: 'proj-1' });

      expect(ApplicationsRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ projectId: 'proj-1', studentId: 'student-1', compatibilityScore: expect.any(Number) }),
        fakeClient,
      );
      expect(result).toEqual(FAKE_APPLICATION);
    });

    it('hace ROLLBACK si falla el insert', async () => {
      ProjectsRepository.findById.mockResolvedValue(FAKE_PROJECT);
      StudentsRepository.findByUserId.mockResolvedValue(FAKE_STUDENT);
      ApplicationsRepository.findByProjectAndStudent.mockResolvedValue(null);
      ApplicationsRepository.create.mockRejectedValue(new Error('DB error'));

      await expect(
        ApplicationsService.create('student-1', { projectId: 'proj-1' }),
      ).rejects.toThrow('DB error');

      expect(fakeClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(fakeClient.release).toHaveBeenCalled();
    });
  });

  // ── getByProject ──────────────────────────────────────────────────────────

  describe('getByProject', () => {
    it('lanza HttpError 400 si falta projectId', async () => {
      await expect(ApplicationsService.getByProject(undefined, 'ngo-1')).rejects.toMatchObject({ statusCode: 400 });
    });

    it('lanza HttpError 404 si el proyecto no existe', async () => {
      ProjectsRepository.findById.mockResolvedValue(null);
      await expect(ApplicationsService.getByProject('bad-id', 'ngo-1')).rejects.toMatchObject({ statusCode: 404 });
    });

    it('lanza HttpError 403 si la ONG no es propietaria', async () => {
      ProjectsRepository.findById.mockResolvedValue({ ...FAKE_PROJECT, ngo_id: 'otra-ngo' });
      await expect(ApplicationsService.getByProject('proj-1', 'ngo-1')).rejects.toMatchObject({ statusCode: 403 });
    });

    it('retorna las aplicaciones del proyecto', async () => {
      ProjectsRepository.findById.mockResolvedValue(FAKE_PROJECT);
      ApplicationsRepository.findByProject.mockResolvedValue([FAKE_APPLICATION]);

      const result = await ApplicationsService.getByProject('proj-1', 'ngo-1');

      expect(ApplicationsRepository.findByProject).toHaveBeenCalledWith('proj-1');
      expect(result).toEqual([FAKE_APPLICATION]);
    });
  });

  // ── getOwn ────────────────────────────────────────────────────────────────

  describe('getOwn', () => {
    it('devuelve las aplicaciones del estudiante', async () => {
      ApplicationsRepository.findByStudent.mockResolvedValue([FAKE_APPLICATION]);
      const result = await ApplicationsService.getOwn('student-1');
      expect(result).toEqual([FAKE_APPLICATION]);
    });

    it('pasa studentId al repositorio', async () => {
      ApplicationsRepository.findByStudent.mockResolvedValue([]);
      await ApplicationsService.getOwn('student-1');
      expect(ApplicationsRepository.findByStudent).toHaveBeenCalledWith('student-1');
    });
  });

  // ── updateStatus ──────────────────────────────────────────────────────────

  describe('updateStatus', () => {
    it('lanza HttpError 400 si falta status', async () => {
      await expect(
        ApplicationsService.updateStatus('app-1', 'ngo-1', {}),
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('lanza HttpError 400 si status es inválido', async () => {
      await expect(
        ApplicationsService.updateStatus('app-1', 'ngo-1', { status: 'invalid' }),
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('lanza HttpError 404 si la aplicación no existe', async () => {
      ApplicationsRepository.findById.mockResolvedValue(null);
      await expect(
        ApplicationsService.updateStatus('bad-id', 'ngo-1', { status: 'approved' }),
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('lanza HttpError 404 si el proyecto no existe', async () => {
      ApplicationsRepository.findById.mockResolvedValue(FAKE_APPLICATION);
      ProjectsRepository.findById.mockResolvedValue(null);
      await expect(
        ApplicationsService.updateStatus('app-1', 'ngo-1', { status: 'approved' }),
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('lanza HttpError 403 si la ONG no es propietaria', async () => {
      ApplicationsRepository.findById.mockResolvedValue(FAKE_APPLICATION);
      ProjectsRepository.findById.mockResolvedValue({ ...FAKE_PROJECT, ngo_id: 'otra-ngo' });
      await expect(
        ApplicationsService.updateStatus('app-1', 'ngo-1', { status: 'approved' }),
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    it('actualiza y retorna la aplicación', async () => {
      const updated = { ...FAKE_APPLICATION, status: 'approved' };
      ApplicationsRepository.findById.mockResolvedValue(FAKE_APPLICATION);
      ProjectsRepository.findById.mockResolvedValue(FAKE_PROJECT);
      ApplicationsRepository.updateStatus.mockResolvedValue(updated);

      const result = await ApplicationsService.updateStatus('app-1', 'ngo-1', { status: 'approved' });

      expect(ApplicationsRepository.updateStatus).toHaveBeenCalledWith('app-1', 'approved', fakeClient);
      expect(result).toEqual(updated);
    });

    it('hace ROLLBACK si falla el update', async () => {
      ApplicationsRepository.findById.mockResolvedValue(FAKE_APPLICATION);
      ProjectsRepository.findById.mockResolvedValue(FAKE_PROJECT);
      ApplicationsRepository.updateStatus.mockRejectedValue(new Error('DB error'));

      await expect(
        ApplicationsService.updateStatus('app-1', 'ngo-1', { status: 'approved' }),
      ).rejects.toThrow('DB error');

      expect(fakeClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(fakeClient.release).toHaveBeenCalled();
    });
  });
});
