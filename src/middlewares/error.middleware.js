import { HttpError } from '../utils/errors.js';

/**
 * Middleware global de manejo de errores.
 * Debe registrarse al final de la cadena de middlewares en app.js.
 *
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const errorMiddleware = (err, req, res, next) => {
  if (err instanceof HttpError) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  console.error(err);
  return res.status(500).json({ message: 'Error interno del servidor' });
};

export default errorMiddleware;
