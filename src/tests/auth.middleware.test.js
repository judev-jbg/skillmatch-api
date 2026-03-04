import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { verifyToken, requireRole } from '../middlewares/auth.middleware.js';

vi.mock('jsonwebtoken', () => ({
  default: { verify: vi.fn() },
}));

/**
 * Crea un Request simulado con cookies opcionales.
 * @param {object} cookies
 * @returns {{ cookies: object }}
 */
function mockReq(cookies = {}) {
  return { cookies };
}

/**
 * Crea un Response simulado con spies encadenados.
 */
function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('verifyToken middleware', () => {
  const next = vi.fn();

  beforeEach(() => vi.clearAllMocks());

  it('responde 401 si no hay cookie token', () => {
    const res = mockRes();
    verifyToken(mockReq(), res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('responde 401 si jwt.verify lanza error', () => {
    jwt.verify.mockImplementation(() => { throw new Error('invalid'); });
    const res = mockRes();
    verifyToken(mockReq({ token: 'bad.token' }), res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('inyecta req.user y llama next si el token es válido', () => {
    jwt.verify.mockReturnValue({ sub: 'uuid-1', role: 'student' });
    const req = mockReq({ token: 'valid.token' });
    const res = mockRes();
    verifyToken(req, res, next);
    expect(req.user).toEqual({ id: 'uuid-1', role: 'student' });
    expect(next).toHaveBeenCalled();
  });
});

describe('requireRole middleware', () => {
  const next = vi.fn();

  beforeEach(() => vi.clearAllMocks());

  it('responde 403 si el rol no está permitido', () => {
    const req = { user: { role: 'ngo' } };
    const res = mockRes();
    requireRole('student')(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('llama next si el rol está permitido', () => {
    const req = { user: { role: 'student' } };
    const res = mockRes();
    requireRole('student', 'admin')(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
