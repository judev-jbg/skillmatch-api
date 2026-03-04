import jwt from 'jsonwebtoken';

/**
 * Middleware que verifica el JWT de la cookie `token`.
 * Si es válido, inyecta `req.user = { id, role }` y llama a `next()`.
 * Si no existe o es inválido, responde con 401.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export function verifyToken(req, res, next) {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ message: 'No autenticado' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
}

/**
 * Fábrica de middleware que restringe el acceso a roles específicos.
 * Debe usarse después de `verifyToken`.
 *
 * @param {...string} roles - Roles permitidos (e.g. 'student', 'ngo', 'admin')
 * @returns {import('express').RequestHandler}
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }
    next();
  };
}
