import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProjectsService from '../services/projects.service.js';
import ProjectsRepository from '../repositories/projects.repository.js';
import AssignmentsRepository from '../repositories/assignments.repository.js';
import CertificatesService from '../services/certificates.service.js';
import pool from '../config/db.js';

vi.mock('../repositories/projects.repository.js');
vi.mock('../repositories/assignments.repository.js');
vi.mock('../services/certificates.service.js');
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
      await ProjectsService.getAll({ status: 'pending', skillId: 'sk-1' });
      expect(ProjectsRepository.findAll).toHaveBeenCalledWith({ status: 'pending', skillId: 'sk-1' });
    });
  });

  // ── getOwn ──────────────────────────────────────────────────────────────────

  describe('getOwn', () => {
    it('devuelve los proyectos de la ONG autenticada', async () => {
      ProjectsRepository.findAll.mockResolvedValue([FAKE_PROJECT]);
      const result = await ProjectsService.getOwn('ngo-1');
      expect(result).toEqual([FAKE_PROJECT]);
    });

    it('pasa ngoId y filtros al repositorio', async () => {
      ProjectsRepository.findAll.mockResolvedValue([]);
      await ProjectsService.getOwn('ngo-1', { status: 'pending', skillId: 'sk-1' });
      expect(ProjectsRepository.findAll).toHaveBeenCalledWith({ ngoId: 'ngo-1', status: 'pending', skillId: 'sk-1' });
    });

    it('lanza HttpError 400 si status es inválido', async () => {
      await expect(ProjectsService.getOwn('ngo-1', { status: 'invalid' })).rejects.toMatchObject({ statusCode: 400 });
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

  // ── transitionStatus ──────────────────────────────────────────────────────

  describe('transitionStatus', () => {
    it('lanza HttpError 404 si el proyecto no existe', async () => {
      ProjectsRepository.findByIdForUpdate.mockResolvedValue(null);
      await expect(
        ProjectsService.transitionStatus('bad-id', 'assigned', 'ngo-1'),
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('lanza HttpError 403 si no es la ONG propietaria', async () => {
      ProjectsRepository.findByIdForUpdate.mockResolvedValue(FAKE_PROJECT);
      await expect(
        ProjectsService.transitionStatus('proj-1', 'assigned', 'otra-ngo'),
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    it('lanza HttpError 400 si la transicion no es valida', async () => {
      ProjectsRepository.findByIdForUpdate.mockResolvedValue(FAKE_PROJECT); // status: pending
      await expect(
        ProjectsService.transitionStatus('proj-1', 'completed', 'ngo-1'),
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('lanza HttpError 400 si el proyecto esta en completed', async () => {
      ProjectsRepository.findByIdForUpdate.mockResolvedValue({ ...FAKE_PROJECT, status: 'completed' });
      await expect(
        ProjectsService.transitionStatus('proj-1', 'in_progress', 'ngo-1'),
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('lanza HttpError 400 si el proyecto esta en cancelled', async () => {
      ProjectsRepository.findByIdForUpdate.mockResolvedValue({ ...FAKE_PROJECT, status: 'cancelled' });
      await expect(
        ProjectsService.transitionStatus('proj-1', 'pending', 'ngo-1'),
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('transiciona pending -> assigned correctamente', async () => {
      const updated = { ...FAKE_PROJECT, status: 'assigned' };
      ProjectsRepository.findByIdForUpdate.mockResolvedValue(FAKE_PROJECT);
      ProjectsRepository.updateStatus.mockResolvedValue(updated);

      const result = await ProjectsService.transitionStatus('proj-1', 'assigned', 'ngo-1');

      expect(ProjectsRepository.updateStatus).toHaveBeenCalledWith('proj-1', 'assigned', fakeClient);
      expect(result).toEqual(updated);
    });

    it('transiciona pending -> cancelled correctamente', async () => {
      const updated = { ...FAKE_PROJECT, status: 'cancelled' };
      ProjectsRepository.findByIdForUpdate.mockResolvedValue(FAKE_PROJECT);
      ProjectsRepository.updateStatus.mockResolvedValue(updated);

      const result = await ProjectsService.transitionStatus('proj-1', 'cancelled', 'ngo-1');

      expect(ProjectsRepository.updateStatus).toHaveBeenCalledWith('proj-1', 'cancelled', fakeClient);
      expect(result).toEqual(updated);
    });

    it('transiciona in_review -> rejected correctamente', async () => {
      const inReview = { ...FAKE_PROJECT, status: 'in_review' };
      const rejected = { ...FAKE_PROJECT, status: 'rejected' };
      ProjectsRepository.findByIdForUpdate.mockResolvedValue(inReview);
      ProjectsRepository.updateStatus.mockResolvedValue(rejected);

      const result = await ProjectsService.transitionStatus('proj-1', 'rejected', 'ngo-1');

      expect(result.status).toBe('rejected');
    });

    it('usa el client externo si se pasa, sin abrir transaccion propia', async () => {
      const updated = { ...FAKE_PROJECT, status: 'assigned' };
      const externalClient = { query: vi.fn(), release: vi.fn() };
      ProjectsRepository.findByIdForUpdate.mockResolvedValue(FAKE_PROJECT);
      ProjectsRepository.updateStatus.mockResolvedValue(updated);

      await ProjectsService.transitionStatus('proj-1', 'assigned', 'ngo-1', externalClient);

      expect(pool.connect).not.toHaveBeenCalled();
      expect(ProjectsRepository.findByIdForUpdate).toHaveBeenCalledWith('proj-1', externalClient);
      expect(ProjectsRepository.updateStatus).toHaveBeenCalledWith('proj-1', 'assigned', externalClient);
    });

    it('CA6 — transiciona in_review -> completed: setEndDate, certificado y estado en transaccion', async () => {
      const inReview = { ...FAKE_PROJECT, status: 'in_review' };
      const completed = { ...FAKE_PROJECT, status: 'completed' };
      const fakeAssignmentData = {
        assignment_id: 'assign-1',
        student_name: 'Ana García',
        ngo_name: 'ONG Educación',
        project_title: 'App voluntarios',
        start_date: new Date('2025-01-01'),
        end_date: null,
      };
      ProjectsRepository.findByIdForUpdate.mockResolvedValue(inReview);
      AssignmentsRepository.findByProjectWithDetails.mockResolvedValue(fakeAssignmentData);
      AssignmentsRepository.setEndDate.mockResolvedValue();
      CertificatesService.generate.mockResolvedValue({ id: 'cert-1' });
      ProjectsRepository.updateStatus.mockResolvedValue(completed);

      const result = await ProjectsService.transitionStatus('proj-1', 'completed', 'ngo-1');

      expect(fakeClient.query).toHaveBeenCalledWith('BEGIN');
      expect(AssignmentsRepository.setEndDate).toHaveBeenCalledWith('assign-1', fakeClient);
      expect(CertificatesService.generate).toHaveBeenCalledWith(
        expect.objectContaining({ assignment_id: 'assign-1' }),
        fakeClient,
      );
      expect(ProjectsRepository.updateStatus).toHaveBeenCalledWith('proj-1', 'completed', fakeClient);
      expect(fakeClient.query).toHaveBeenCalledWith('COMMIT');
      expect(result).toEqual(completed);
    });

    it('lanza HttpError 404 si no hay assignment al transicionar a completed', async () => {
      const inReview = { ...FAKE_PROJECT, status: 'in_review' };
      ProjectsRepository.findByIdForUpdate.mockResolvedValue(inReview);
      AssignmentsRepository.findByProjectWithDetails.mockResolvedValue(null);

      await expect(
        ProjectsService.transitionStatus('proj-1', 'completed', 'ngo-1'),
      ).rejects.toMatchObject({ statusCode: 404 });

      expect(fakeClient.query).toHaveBeenCalledWith('ROLLBACK');
    });

    it('CA7 — hace ROLLBACK si falla la generacion del certificado al completar', async () => {
      const inReview = { ...FAKE_PROJECT, status: 'in_review' };
      const fakeAssignmentData = {
        assignment_id: 'assign-1',
        student_name: 'Ana García',
        ngo_name: 'ONG Educación',
        project_title: 'App voluntarios',
        start_date: new Date('2025-01-01'),
        end_date: null,
      };
      ProjectsRepository.findByIdForUpdate.mockResolvedValue(inReview);
      AssignmentsRepository.findByProjectWithDetails.mockResolvedValue(fakeAssignmentData);
      AssignmentsRepository.setEndDate.mockResolvedValue();
      CertificatesService.generate.mockRejectedValue(new Error('PDF error'));

      await expect(
        ProjectsService.transitionStatus('proj-1', 'completed', 'ngo-1'),
      ).rejects.toThrow('PDF error');

      expect(fakeClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(fakeClient.release).toHaveBeenCalled();
    });
  });

  // ── cancel ──────────────────────────────────────────────────────────────────

  describe('cancel', () => {
    it('lanza HttpError 404 si el proyecto no existe', async () => {
      ProjectsRepository.findById.mockResolvedValue(null);
      await expect(ProjectsService.cancel('bad', 'ngo-1')).rejects.toMatchObject({ statusCode: 404 });
    });

    it('lanza HttpError 400 si el proyecto esta en completed', async () => {
      ProjectsRepository.findById.mockResolvedValue({ ...FAKE_PROJECT, status: 'completed' });
      await expect(ProjectsService.cancel('proj-1', 'ngo-1')).rejects.toMatchObject({ statusCode: 400 });
    });

    it('lanza HttpError 400 si el proyecto ya esta cancelado', async () => {
      ProjectsRepository.findById.mockResolvedValue({ ...FAKE_PROJECT, status: 'cancelled' });
      await expect(ProjectsService.cancel('proj-1', 'ngo-1')).rejects.toMatchObject({ statusCode: 400 });
    });

    it('lanza HttpError 403 si no es ONG ni estudiante asignado', async () => {
      ProjectsRepository.findById.mockResolvedValue(FAKE_PROJECT);
      AssignmentsRepository.findByProject.mockResolvedValue({ student_id: 'student-1' });
      await expect(ProjectsService.cancel('proj-1', 'extraño')).rejects.toMatchObject({ statusCode: 403 });
    });

    it('permite cancelar a la ONG propietaria', async () => {
      const cancelled = { ...FAKE_PROJECT, status: 'cancelled' };
      ProjectsRepository.findById
        .mockResolvedValueOnce(FAKE_PROJECT)
        .mockResolvedValueOnce(cancelled);
      AssignmentsRepository.findByProject.mockResolvedValue(null);
      ProjectsRepository.updateStatus.mockResolvedValue();

      const result = await ProjectsService.cancel('proj-1', 'ngo-1');

      expect(ProjectsRepository.updateStatus).toHaveBeenCalledWith('proj-1', 'cancelled');
      expect(result.status).toBe('cancelled');
    });

    it('permite cancelar al estudiante asignado', async () => {
      const cancelled = { ...FAKE_PROJECT, status: 'cancelled' };
      ProjectsRepository.findById
        .mockResolvedValueOnce(FAKE_PROJECT)
        .mockResolvedValueOnce(cancelled);
      AssignmentsRepository.findByProject.mockResolvedValue({ id: 'assign-1', student_id: 'student-1', end_date: null });
      ProjectsRepository.updateStatus.mockResolvedValue();
      AssignmentsRepository.setEndDate.mockResolvedValue();

      const result = await ProjectsService.cancel('proj-1', 'student-1');

      expect(ProjectsRepository.updateStatus).toHaveBeenCalledWith('proj-1', 'cancelled');
      expect(AssignmentsRepository.setEndDate).toHaveBeenCalledWith('assign-1');
      expect(result.status).toBe('cancelled');
    });
  });
});
