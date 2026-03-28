import { describe, it, expect, vi, beforeEach } from 'vitest';
import AssignmentsService from '../services/assignments.service.js';
import AssignmentsRepository from '../repositories/assignments.repository.js';
import ApplicationsRepository from '../repositories/applications.repository.js';
import ProjectsRepository from '../repositories/projects.repository.js';
import pool from '../config/db.js';

vi.mock('../repositories/assignments.repository.js');
vi.mock('../repositories/applications.repository.js');
vi.mock('../repositories/projects.repository.js');
vi.mock('../config/db.js', () => ({
  default: { connect: vi.fn() },
}));

const FAKE_APPLICATION = {
  id: 'app-1',
  project_id: 'proj-1',
  student_id: 'student-1',
  compatibility_score: 100,
  status: 'pending',
};

const FAKE_PROJECT = {
  id: 'proj-1',
  ngo_id: 'ngo-1',
  title: 'App voluntarios',
  status: 'pending',
  skills: [],
};

const FAKE_ASSIGNMENT = {
  id: 'assign-1',
  project_id: 'proj-1',
  student_id: 'student-1',
  start_date: new Date(),
  end_date: null,
};

describe('AssignmentsService', () => {
  let fakeClient;

  beforeEach(() => {
    vi.clearAllMocks();
    fakeClient = { query: vi.fn().mockResolvedValue({}), release: vi.fn() };
    pool.connect.mockResolvedValue(fakeClient);
  });

  // ── create ──────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('lanza HttpError 400 si falta applicationId', async () => {
      await expect(AssignmentsService.create('ngo-1', {})).rejects.toMatchObject({ statusCode: 400 });
    });

    it('lanza HttpError 404 si la application no existe', async () => {
      ApplicationsRepository.findById.mockResolvedValue(null);
      await expect(
        AssignmentsService.create('ngo-1', { applicationId: 'bad-id' }),
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('lanza HttpError 400 si la application no esta en pending', async () => {
      ApplicationsRepository.findById.mockResolvedValue({ ...FAKE_APPLICATION, status: 'approved' });
      await expect(
        AssignmentsService.create('ngo-1', { applicationId: 'app-1' }),
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('lanza HttpError 404 si el proyecto no existe', async () => {
      ApplicationsRepository.findById.mockResolvedValue(FAKE_APPLICATION);
      ProjectsRepository.findById.mockResolvedValue(null);
      await expect(
        AssignmentsService.create('ngo-1', { applicationId: 'app-1' }),
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('lanza HttpError 403 si la ONG no es propietaria', async () => {
      ApplicationsRepository.findById.mockResolvedValue(FAKE_APPLICATION);
      ProjectsRepository.findById.mockResolvedValue(FAKE_PROJECT);
      await expect(
        AssignmentsService.create('otra-ngo', { applicationId: 'app-1' }),
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    it('lanza HttpError 400 si el proyecto no esta en pending', async () => {
      ApplicationsRepository.findById.mockResolvedValue(FAKE_APPLICATION);
      ProjectsRepository.findById.mockResolvedValue({ ...FAKE_PROJECT, status: 'assigned' });
      await expect(
        AssignmentsService.create('ngo-1', { applicationId: 'app-1' }),
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('crea el assignment en transaccion y retorna el resultado', async () => {
      ApplicationsRepository.findById.mockResolvedValue(FAKE_APPLICATION);
      ProjectsRepository.findById.mockResolvedValue(FAKE_PROJECT);
      ApplicationsRepository.updateStatus.mockResolvedValue();
      ApplicationsRepository.rejectAllExcept.mockResolvedValue();
      AssignmentsRepository.create.mockResolvedValue(FAKE_ASSIGNMENT);
      ProjectsRepository.updateStatus.mockResolvedValue();

      const result = await AssignmentsService.create('ngo-1', { applicationId: 'app-1' });

      // Verifica que se ejecuto la transaccion
      expect(fakeClient.query).toHaveBeenCalledWith('BEGIN');
      expect(fakeClient.query).toHaveBeenCalledWith('COMMIT');

      // Verifica que se aprobó la application
      expect(ApplicationsRepository.updateStatus).toHaveBeenCalledWith('app-1', 'approved', fakeClient);

      // Verifica que se rechazaron las demas
      expect(ApplicationsRepository.rejectAllExcept).toHaveBeenCalledWith('proj-1', 'app-1', fakeClient);

      // Verifica que se creo el assignment
      expect(AssignmentsRepository.create).toHaveBeenCalledWith(
        { projectId: 'proj-1', studentId: 'student-1' },
        fakeClient,
      );

      // Verifica que el proyecto paso a assigned
      expect(ProjectsRepository.updateStatus).toHaveBeenCalledWith('proj-1', 'assigned', fakeClient);

      expect(result).toEqual(FAKE_ASSIGNMENT);
    });

    it('hace ROLLBACK si falla la transaccion', async () => {
      ApplicationsRepository.findById.mockResolvedValue(FAKE_APPLICATION);
      ProjectsRepository.findById.mockResolvedValue(FAKE_PROJECT);
      ApplicationsRepository.updateStatus.mockRejectedValue(new Error('DB error'));

      await expect(
        AssignmentsService.create('ngo-1', { applicationId: 'app-1' }),
      ).rejects.toThrow('DB error');

      expect(fakeClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(fakeClient.release).toHaveBeenCalled();
    });
  });

  // ── getById ─────────────────────────────────────────────────────────────────

  describe('getById', () => {
    it('retorna el assignment si existe', async () => {
      AssignmentsRepository.findById.mockResolvedValue(FAKE_ASSIGNMENT);
      const result = await AssignmentsService.getById('assign-1');
      expect(result).toEqual(FAKE_ASSIGNMENT);
    });

    it('lanza HttpError 404 si no existe', async () => {
      AssignmentsRepository.findById.mockResolvedValue(null);
      await expect(AssignmentsService.getById('bad-id')).rejects.toMatchObject({ statusCode: 404 });
    });
  });
});
