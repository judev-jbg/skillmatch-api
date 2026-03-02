import AuthService from '../services/auth.service.js';
import { HttpError } from '../utils/errors.js';

/**
 * Controlador de autenticación.
 * Delega la lógica de negocio a AuthService y gestiona la respuesta HTTP.
 */
const AuthController = {
  /**
   * POST /auth/register
   * Registra un nuevo usuario (student u ONG).
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async register(req, res) {
    const { name, email, password, role, organization_name, area } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Los campos name, email, password y role son requeridos' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'El formato del email no es válido' });
    }

    try {
      const user = await AuthService.register({
        name,
        email,
        password,
        role,
        organizationName: organization_name,
        area,
      });

      return res.status(201).json({ message: 'Usuario registrado correctamente', user });
    } catch (err) {
      if (err instanceof HttpError) {
        return res.status(err.statusCode).json({ message: err.message });
      }
      console.error('[AuthController.register]', err);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  },
  /**
   * POST /auth/login
   * Autentica un usuario y establece el token JWT en una cookie HttpOnly.
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async login(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Los campos email y password son requeridos' });
    }

    try {
      const { token, user } = await AuthService.login({ email, password });

      res.cookie('token', token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días en ms
      });

      return res.status(200).json({ message: 'Autenticación exitosa', user });
    } catch (err) {
      if (err instanceof HttpError) {
        return res.status(err.statusCode).json({ message: err.message });
      }
      console.error('[AuthController.login]', err);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  },
};

export default AuthController;
