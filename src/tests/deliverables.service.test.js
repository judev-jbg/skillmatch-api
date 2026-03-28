import { describe, it, expect, vi, beforeEach } from 'vitest';
import DeliverablesService from '../services/deliverables.service.js';
import DeliverablesRepository from '../repositories/deliverables.repository.js';
import AssignmentsRepository from '../repositories/assignments.repository.js';
import ProjectsRepository from '../repositories/projects.repository.js';

vi.mock('../repositories/deliverables.repository.js');
vi.mock('../repositories/assignments.repository.js');
vi.mock('../repositories/projects.repository.js');

const FAKE_ASSIGNMENT = {
  id: 'assign-1',
  project_id: 'proj-1',
  student_id: 'student-1',
};

const FAKE_PROJECT = {
  id: 'proj-1',
  ngo_id: 'ngo-1',
  status: 'in_progress',
};

const FAKE_DELIVERABLE = {
  id: 'del-1',
  assignment_id: 'assign-1',
  title: 'Diseno de la BD',
  description: 'Modelo ER',
  status: 'pending',
  file_url: null,
  comment: null,
};

describe('DeliverablesService', () => {
  beforeEach(() => vi.clearAllMocks());

  // ── create ──────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('lanza HttpError 400 si falta assignmentId', async () => {
      await expect(DeliverablesService.create('ngo-1', { title: 'Test' })).rejects.toMatchObject({ statusCode: 400 });
    });

    it('lanza HttpError 400 si falta title', async () => {
      await expect(DeliverablesService.create('ngo-1', { assignmentId: 'assign-1' })).rejects.toMatchObject({ statusCode: 400 });
    });

    it('lanza HttpError 404 si el assignment no existe', async () => {
      AssignmentsRepository.findById.mockResolvedValue(null);
      await expect(
        DeliverablesService.create('ngo-1', { assignmentId: 'bad', title: 'Test' }),
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('lanza HttpError 403 si la ONG no es propietaria', async () => {
      AssignmentsRepository.findById.mockResolvedValue(FAKE_ASSIGNMENT);
      ProjectsRepository.findById.mockResolvedValue(FAKE_PROJECT);
      await expect(
        DeliverablesService.create('otra-ngo', { assignmentId: 'assign-1', title: 'Test' }),
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    it('crea el entregable correctamente', async () => {
      AssignmentsRepository.findById.mockResolvedValue(FAKE_ASSIGNMENT);
      ProjectsRepository.findById.mockResolvedValue(FAKE_PROJECT);
      DeliverablesRepository.create.mockResolvedValue(FAKE_DELIVERABLE);

      const result = await DeliverablesService.create('ngo-1', { assignmentId: 'assign-1', title: 'Diseno de la BD', description: 'Modelo ER' });

      expect(DeliverablesRepository.create).toHaveBeenCalledWith({ assignmentId: 'assign-1', title: 'Diseno de la BD', description: 'Modelo ER' });
      expect(result).toEqual(FAKE_DELIVERABLE);
    });
  });

  // ── getByAssignment ─────────────────────────────────────────────────────────

  describe('getByAssignment', () => {
    it('lanza HttpError 400 si falta assignmentId', async () => {
      await expect(DeliverablesService.getByAssignment(undefined, 'ngo-1')).rejects.toMatchObject({ statusCode: 400 });
    });

    it('lanza HttpError 404 si el assignment no existe', async () => {
      AssignmentsRepository.findById.mockResolvedValue(null);
      await expect(DeliverablesService.getByAssignment('bad', 'ngo-1')).rejects.toMatchObject({ statusCode: 404 });
    });

    it('lanza HttpError 403 si no es ONG ni estudiante', async () => {
      AssignmentsRepository.findById.mockResolvedValue(FAKE_ASSIGNMENT);
      ProjectsRepository.findById.mockResolvedValue(FAKE_PROJECT);
      await expect(DeliverablesService.getByAssignment('assign-1', 'extraño')).rejects.toMatchObject({ statusCode: 403 });
    });

    it('devuelve entregables si es la ONG propietaria', async () => {
      AssignmentsRepository.findById.mockResolvedValue(FAKE_ASSIGNMENT);
      ProjectsRepository.findById.mockResolvedValue(FAKE_PROJECT);
      DeliverablesRepository.findByAssignment.mockResolvedValue([FAKE_DELIVERABLE]);

      const result = await DeliverablesService.getByAssignment('assign-1', 'ngo-1');
      expect(result).toEqual([FAKE_DELIVERABLE]);
    });

    it('devuelve entregables si es el estudiante asignado', async () => {
      AssignmentsRepository.findById.mockResolvedValue(FAKE_ASSIGNMENT);
      ProjectsRepository.findById.mockResolvedValue(FAKE_PROJECT);
      DeliverablesRepository.findByAssignment.mockResolvedValue([FAKE_DELIVERABLE]);

      const result = await DeliverablesService.getByAssignment('assign-1', 'student-1');
      expect(result).toEqual([FAKE_DELIVERABLE]);
    });
  });

  // ── startWork ───────────────────────────────────────────────────────────────

  describe('startWork', () => {
    it('lanza HttpError 404 si el entregable no existe', async () => {
      DeliverablesRepository.findById.mockResolvedValue(null);
      await expect(DeliverablesService.startWork('bad', 'student-1')).rejects.toMatchObject({ statusCode: 404 });
    });

    it('lanza HttpError 403 si no es el estudiante asignado', async () => {
      DeliverablesRepository.findById.mockResolvedValue(FAKE_DELIVERABLE);
      AssignmentsRepository.findById.mockResolvedValue(FAKE_ASSIGNMENT);
      await expect(DeliverablesService.startWork('del-1', 'otro')).rejects.toMatchObject({ statusCode: 403 });
    });

    it('lanza HttpError 400 si no esta en pending', async () => {
      DeliverablesRepository.findById.mockResolvedValue({ ...FAKE_DELIVERABLE, status: 'in_review' });
      AssignmentsRepository.findById.mockResolvedValue(FAKE_ASSIGNMENT);
      await expect(DeliverablesService.startWork('del-1', 'student-1')).rejects.toMatchObject({ statusCode: 400 });
    });

    it('lanza HttpError 400 si ya hay un entregable activo', async () => {
      DeliverablesRepository.findById.mockResolvedValue(FAKE_DELIVERABLE);
      AssignmentsRepository.findById.mockResolvedValue(FAKE_ASSIGNMENT);
      DeliverablesRepository.hasActiveDeliverable.mockResolvedValue(true);
      await expect(DeliverablesService.startWork('del-1', 'student-1')).rejects.toMatchObject({ statusCode: 400 });
    });

    it('transiciona a in_progress correctamente', async () => {
      const updated = { ...FAKE_DELIVERABLE, status: 'in_progress' };
      DeliverablesRepository.findById.mockResolvedValue(FAKE_DELIVERABLE);
      AssignmentsRepository.findById.mockResolvedValue(FAKE_ASSIGNMENT);
      DeliverablesRepository.hasActiveDeliverable.mockResolvedValue(false);
      DeliverablesRepository.update.mockResolvedValue(updated);

      const result = await DeliverablesService.startWork('del-1', 'student-1');

      expect(DeliverablesRepository.update).toHaveBeenCalledWith('del-1', { status: 'in_progress' });
      expect(result.status).toBe('in_progress');
    });
  });

  // ── submitForReview ─────────────────────────────────────────────────────────

  describe('submitForReview', () => {
    it('lanza HttpError 400 si falta fileUrl', async () => {
      await expect(
        DeliverablesService.submitForReview('del-1', 'student-1', {}),
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('lanza HttpError 404 si el entregable no existe', async () => {
      DeliverablesRepository.findById.mockResolvedValue(null);
      await expect(
        DeliverablesService.submitForReview('bad', 'student-1', { fileUrl: 'http://x.com/file.pdf' }),
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('lanza HttpError 403 si no es el estudiante asignado', async () => {
      DeliverablesRepository.findById.mockResolvedValue({ ...FAKE_DELIVERABLE, status: 'in_progress' });
      AssignmentsRepository.findById.mockResolvedValue(FAKE_ASSIGNMENT);
      await expect(
        DeliverablesService.submitForReview('del-1', 'otro', { fileUrl: 'http://x.com/file.pdf' }),
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    it('lanza HttpError 400 si no esta en in_progress', async () => {
      DeliverablesRepository.findById.mockResolvedValue(FAKE_DELIVERABLE); // status: pending
      AssignmentsRepository.findById.mockResolvedValue(FAKE_ASSIGNMENT);
      await expect(
        DeliverablesService.submitForReview('del-1', 'student-1', { fileUrl: 'http://x.com/file.pdf' }),
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('envia a revision y transiciona el proyecto a in_review', async () => {
      const inProgress = { ...FAKE_DELIVERABLE, status: 'in_progress' };
      const submitted = { ...FAKE_DELIVERABLE, status: 'in_review', file_url: 'http://x.com/file.pdf' };
      DeliverablesRepository.findById.mockResolvedValue(inProgress);
      AssignmentsRepository.findById.mockResolvedValue(FAKE_ASSIGNMENT);
      DeliverablesRepository.update.mockResolvedValue(submitted);
      ProjectsRepository.updateStatus.mockResolvedValue();

      const result = await DeliverablesService.submitForReview('del-1', 'student-1', { fileUrl: 'http://x.com/file.pdf', comment: 'Listo' });

      expect(DeliverablesRepository.update).toHaveBeenCalledWith('del-1', {
        fileUrl: 'http://x.com/file.pdf',
        comment: 'Listo',
        status: 'in_review',
      });
      expect(ProjectsRepository.updateStatus).toHaveBeenCalledWith('proj-1', 'in_review');
      expect(result.status).toBe('in_review');
    });
  });

  // ── review ──────────────────────────────────────────────────────────────────

  describe('review', () => {
    it('lanza HttpError 400 si status no es approved/rejected', async () => {
      await expect(
        DeliverablesService.review('del-1', 'ngo-1', { status: 'invalid' }),
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('lanza HttpError 400 si falta status', async () => {
      await expect(
        DeliverablesService.review('del-1', 'ngo-1', {}),
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('lanza HttpError 404 si el entregable no existe', async () => {
      DeliverablesRepository.findById.mockResolvedValue(null);
      await expect(
        DeliverablesService.review('bad', 'ngo-1', { status: 'approved' }),
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('lanza HttpError 400 si el entregable no esta en in_review', async () => {
      DeliverablesRepository.findById.mockResolvedValue(FAKE_DELIVERABLE); // status: pending
      await expect(
        DeliverablesService.review('del-1', 'ngo-1', { status: 'approved' }),
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('lanza HttpError 403 si la ONG no es propietaria', async () => {
      DeliverablesRepository.findById.mockResolvedValue({ ...FAKE_DELIVERABLE, status: 'in_review' });
      AssignmentsRepository.findById.mockResolvedValue(FAKE_ASSIGNMENT);
      ProjectsRepository.findById.mockResolvedValue(FAKE_PROJECT);
      await expect(
        DeliverablesService.review('del-1', 'otra-ngo', { status: 'approved' }),
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    it('rechaza el entregable y pasa el proyecto a rejected', async () => {
      const inReview = { ...FAKE_DELIVERABLE, status: 'in_review' };
      const rejected = { ...FAKE_DELIVERABLE, status: 'rejected' };
      DeliverablesRepository.findById.mockResolvedValue(inReview);
      AssignmentsRepository.findById.mockResolvedValue(FAKE_ASSIGNMENT);
      ProjectsRepository.findById.mockResolvedValue(FAKE_PROJECT);
      DeliverablesRepository.update.mockResolvedValue(rejected);
      ProjectsRepository.updateStatus.mockResolvedValue();

      const result = await DeliverablesService.review('del-1', 'ngo-1', { status: 'rejected' });

      expect(DeliverablesRepository.update).toHaveBeenCalledWith('del-1', { status: 'rejected' });
      expect(ProjectsRepository.updateStatus).toHaveBeenCalledWith('proj-1', 'rejected');
      expect(result.status).toBe('rejected');
    });

    it('aprueba el entregable y pasa proyecto a in_progress si quedan mas', async () => {
      const inReview = { ...FAKE_DELIVERABLE, status: 'in_review' };
      const approved = { ...FAKE_DELIVERABLE, status: 'approved' };
      DeliverablesRepository.findById.mockResolvedValue(inReview);
      AssignmentsRepository.findById.mockResolvedValue(FAKE_ASSIGNMENT);
      ProjectsRepository.findById.mockResolvedValue(FAKE_PROJECT);
      DeliverablesRepository.update.mockResolvedValue(approved);
      // Hay otro entregable pendiente
      DeliverablesRepository.findByAssignment.mockResolvedValue([
        approved,
        { ...FAKE_DELIVERABLE, id: 'del-2', status: 'pending' },
      ]);
      ProjectsRepository.updateStatus.mockResolvedValue();

      const result = await DeliverablesService.review('del-1', 'ngo-1', { status: 'approved' });

      expect(ProjectsRepository.updateStatus).toHaveBeenCalledWith('proj-1', 'in_progress');
      expect(result.status).toBe('approved');
    });

    it('aprueba el ultimo entregable y pasa proyecto a completed', async () => {
      const inReview = { ...FAKE_DELIVERABLE, status: 'in_review' };
      const approved = { ...FAKE_DELIVERABLE, status: 'approved' };
      DeliverablesRepository.findById.mockResolvedValue(inReview);
      AssignmentsRepository.findById.mockResolvedValue(FAKE_ASSIGNMENT);
      ProjectsRepository.findById.mockResolvedValue(FAKE_PROJECT);
      DeliverablesRepository.update.mockResolvedValue(approved);
      // Todos aprobados
      DeliverablesRepository.findByAssignment.mockResolvedValue([approved]);
      ProjectsRepository.updateStatus.mockResolvedValue();
      AssignmentsRepository.setEndDate.mockResolvedValue();

      const result = await DeliverablesService.review('del-1', 'ngo-1', { status: 'approved' });

      expect(ProjectsRepository.updateStatus).toHaveBeenCalledWith('proj-1', 'completed');
      expect(AssignmentsRepository.setEndDate).toHaveBeenCalledWith('assign-1');
      expect(result.status).toBe('approved');
    });
  });
});
