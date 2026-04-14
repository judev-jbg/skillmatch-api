import { describe, it, expect, vi, beforeEach } from 'vitest';
import errorMiddleware from '../middlewares/error.middleware.js';
import { HttpError } from '../utils/errors.js';

/**
 * Crea un Response simulado con spies encadenados.
 */
function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('errorMiddleware', () => {
  const req = {};
  const next = vi.fn();

  beforeEach(() => vi.clearAllMocks());

  describe('CA1 — HttpError', () => {
    it('responde con el statusCode y message del HttpError', () => {
      const err = new HttpError('Forbidden', 403);
      const res = mockRes();

      errorMiddleware(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Forbidden' });
    });

    it('responde 404 si el HttpError es de tipo not found', () => {
      const err = new HttpError('Recurso no encontrado', 404);
      const res = mockRes();

      errorMiddleware(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Recurso no encontrado' });
    });
  });

  describe('CA2 — Error genérico', () => {
    it('responde 500 con mensaje genérico si el error no es HttpError', () => {
      const err = new Error('algo inesperado');
      const res = mockRes();

      errorMiddleware(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Error interno del servidor' });
    });
  });

  describe('CA3 — Logging', () => {
    it('loguea errores genéricos con console.error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const err = new Error('error inesperado');
      const res = mockRes();

      errorMiddleware(err, req, res, next);

      expect(consoleSpy).toHaveBeenCalledWith(err);
      consoleSpy.mockRestore();
    });

    it('no loguea HttpErrors', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const err = new HttpError('Bad request', 400);
      const res = mockRes();

      errorMiddleware(err, req, res, next);

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
