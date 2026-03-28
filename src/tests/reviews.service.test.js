import { describe, it, expect, vi, beforeEach } from 'vitest';
import ReviewsService from '../services/reviews.service.js';
import ReviewsRepository from '../repositories/reviews.repository.js';
import AssignmentsRepository from '../repositories/assignments.repository.js';
import ProjectsRepository from '../repositories/projects.repository.js';

vi.mock('../repositories/reviews.repository.js');
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
  status: 'completed',
};

const FAKE_REVIEW = {
  id: 'rev-1',
  assignment_id: 'assign-1',
  from_user: 'student-1',
  to_user: 'ngo-1',
  rating: 4.5,
  comment: 'Buen proyecto',
};

describe('ReviewsService', () => {
  beforeEach(() => vi.clearAllMocks());

  // ── create ──────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('lanza HttpError 400 si falta assignmentId', async () => {
      await expect(
        ReviewsService.create('student-1', { rating: 4 }),
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('lanza HttpError 400 si falta rating', async () => {
      await expect(
        ReviewsService.create('student-1', { assignmentId: 'assign-1' }),
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('lanza HttpError 400 si rating es menor que 1', async () => {
      await expect(
        ReviewsService.create('student-1', { assignmentId: 'assign-1', rating: 0 }),
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('lanza HttpError 400 si rating es mayor que 5', async () => {
      await expect(
        ReviewsService.create('student-1', { assignmentId: 'assign-1', rating: 6 }),
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('lanza HttpError 404 si el assignment no existe', async () => {
      AssignmentsRepository.findById.mockResolvedValue(null);
      await expect(
        ReviewsService.create('student-1', { assignmentId: 'bad', rating: 4 }),
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('lanza HttpError 400 si el proyecto no esta en completed', async () => {
      AssignmentsRepository.findById.mockResolvedValue(FAKE_ASSIGNMENT);
      ProjectsRepository.findById.mockResolvedValue({ ...FAKE_PROJECT, status: 'in_progress' });
      await expect(
        ReviewsService.create('student-1', { assignmentId: 'assign-1', rating: 4 }),
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('lanza HttpError 403 si el usuario no participo en el proyecto', async () => {
      AssignmentsRepository.findById.mockResolvedValue(FAKE_ASSIGNMENT);
      ProjectsRepository.findById.mockResolvedValue(FAKE_PROJECT);
      await expect(
        ReviewsService.create('extraño', { assignmentId: 'assign-1', rating: 4 }),
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    it('lanza HttpError 409 si ya valoro en este assignment', async () => {
      AssignmentsRepository.findById.mockResolvedValue(FAKE_ASSIGNMENT);
      ProjectsRepository.findById.mockResolvedValue(FAKE_PROJECT);
      ReviewsRepository.findByAssignmentAndUser.mockResolvedValue(FAKE_REVIEW);
      await expect(
        ReviewsService.create('student-1', { assignmentId: 'assign-1', rating: 4 }),
      ).rejects.toMatchObject({ statusCode: 409 });
    });

    it('crea la review del estudiante hacia la ONG', async () => {
      AssignmentsRepository.findById.mockResolvedValue(FAKE_ASSIGNMENT);
      ProjectsRepository.findById.mockResolvedValue(FAKE_PROJECT);
      ReviewsRepository.findByAssignmentAndUser.mockResolvedValue(null);
      ReviewsRepository.create.mockResolvedValue(FAKE_REVIEW);

      const result = await ReviewsService.create('student-1', { assignmentId: 'assign-1', rating: 4.5, comment: 'Buen proyecto' });

      expect(ReviewsRepository.create).toHaveBeenCalledWith({
        assignmentId: 'assign-1',
        fromUser: 'student-1',
        toUser: 'ngo-1',
        rating: 4.5,
        comment: 'Buen proyecto',
      });
      expect(result).toEqual(FAKE_REVIEW);
    });

    it('crea la review de la ONG hacia el estudiante', async () => {
      const ngoReview = { ...FAKE_REVIEW, from_user: 'ngo-1', to_user: 'student-1' };
      AssignmentsRepository.findById.mockResolvedValue(FAKE_ASSIGNMENT);
      ProjectsRepository.findById.mockResolvedValue(FAKE_PROJECT);
      ReviewsRepository.findByAssignmentAndUser.mockResolvedValue(null);
      ReviewsRepository.create.mockResolvedValue(ngoReview);

      const result = await ReviewsService.create('ngo-1', { assignmentId: 'assign-1', rating: 5, comment: 'Excelente' });

      expect(ReviewsRepository.create).toHaveBeenCalledWith({
        assignmentId: 'assign-1',
        fromUser: 'ngo-1',
        toUser: 'student-1',
        rating: 5,
        comment: 'Excelente',
      });
      expect(result).toEqual(ngoReview);
    });
  });

  // ── getByUser ───────────────────────────────────────────────────────────────

  describe('getByUser', () => {
    it('lanza HttpError 400 si falta userId', async () => {
      await expect(ReviewsService.getByUser(undefined)).rejects.toMatchObject({ statusCode: 400 });
    });

    it('devuelve las valoraciones del usuario', async () => {
      ReviewsRepository.findByUser.mockResolvedValue([FAKE_REVIEW]);
      const result = await ReviewsService.getByUser('ngo-1');
      expect(ReviewsRepository.findByUser).toHaveBeenCalledWith('ngo-1');
      expect(result).toEqual([FAKE_REVIEW]);
    });
  });
});
