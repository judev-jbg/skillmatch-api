import { describe, it, expect, vi, beforeEach } from 'vitest';
import SkillsController from '../controllers/skills.controller.js';
import SkillsService from '../services/skills.service.js';
import { HttpError } from '../utils/errors.js';

vi.mock('../services/skills.service.js');

function mockReq({ body = {}, query = {}, params = {}, user = { id: 'admin-1', role: 'admin' } } = {}) {
  return { body, query, params, user };
}

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.send = vi.fn().mockReturnValue(res);
  return res;
}

const FAKE_SKILL = {
  id: 'sk-1',
  name: 'JavaScript',
  category: 'Desarrollo',
};

describe('SkillsController', () => {
  beforeEach(() => vi.clearAllMocks());

  // ── create ──────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('responde 201 con la skill creada', async () => {
      SkillsService.create.mockResolvedValue(FAKE_SKILL);
      const res = mockRes();
      await SkillsController.create(mockReq({ body: { name: 'JavaScript', category: 'Desarrollo' } }), res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(FAKE_SKILL);
    });

    it('responde 400 si el servicio lanza HttpError 400', async () => {
      SkillsService.create.mockRejectedValue(new HttpError('name requerido', 400));
      const res = mockRes();
      await SkillsController.create(mockReq({ body: {} }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('responde 500 ante error inesperado', async () => {
      SkillsService.create.mockRejectedValue(new Error('db fail'));
      const res = mockRes();
      await SkillsController.create(mockReq({ body: { name: 'JS', category: 'Desarrollo' } }), res);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('delega name y category correctamente', async () => {
      SkillsService.create.mockResolvedValue(FAKE_SKILL);
      const res = mockRes();
      await SkillsController.create(mockReq({ body: { name: 'JavaScript', category: 'Desarrollo' } }), res);
      expect(SkillsService.create).toHaveBeenCalledWith('JavaScript', 'Desarrollo');
    });
  });

  // ── update ──────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('responde 200 con la skill actualizada', async () => {
      const updated = { ...FAKE_SKILL, name: 'React' };
      SkillsService.update.mockResolvedValue(updated);
      const res = mockRes();
      await SkillsController.update(mockReq({ params: { id: 'sk-1' }, body: { name: 'React' } }), res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(updated);
    });

    it('responde 404 si no existe', async () => {
      SkillsService.update.mockRejectedValue(new HttpError('no encontrada', 404));
      const res = mockRes();
      await SkillsController.update(mockReq({ params: { id: 'bad' }, body: { name: 'React' } }), res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('responde 500 ante error inesperado', async () => {
      SkillsService.update.mockRejectedValue(new Error('db fail'));
      const res = mockRes();
      await SkillsController.update(mockReq({ params: { id: 'sk-1' }, body: { name: 'React' } }), res);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('delega id, name y category correctamente', async () => {
      SkillsService.update.mockResolvedValue(FAKE_SKILL);
      const res = mockRes();
      await SkillsController.update(mockReq({ params: { id: 'sk-1' }, body: { name: 'React', category: 'Desarrollo' } }), res);
      expect(SkillsService.update).toHaveBeenCalledWith('sk-1', { name: 'React', category: 'Desarrollo' });
    });
  });

  // ── remove ──────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('responde 204 sin body', async () => {
      SkillsService.remove.mockResolvedValue();
      const res = mockRes();
      await SkillsController.remove(mockReq({ params: { id: 'sk-1' } }), res);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it('responde 404 si no existe', async () => {
      SkillsService.remove.mockRejectedValue(new HttpError('no encontrada', 404));
      const res = mockRes();
      await SkillsController.remove(mockReq({ params: { id: 'bad' } }), res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('responde 500 ante error inesperado', async () => {
      SkillsService.remove.mockRejectedValue(new Error('db fail'));
      const res = mockRes();
      await SkillsController.remove(mockReq({ params: { id: 'sk-1' } }), res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
