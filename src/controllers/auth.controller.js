import AuthService from '../services/auth.service.js';

/**
 * Convierte una duración tipo JWT (ej. '7d', '24h') a milisegundos.
 * @param {string} duration
 * @returns {number}
 */
function parseDuration(duration) {
  const match = duration.match(/^(\d+)([dhms])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const value = Number(match[1]);
  const unit = match[2];
  const multipliers = { d: 86400000, h: 3600000, m: 60000, s: 1000 };
  return value * multipliers[unit];
}

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

    const user = await AuthService.register({
      name,
      email,
      password,
      role,
      organizationName: organization_name,
      area,
    });

    return res.status(201).json({ message: 'Usuario registrado correctamente', user });
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

    const { token, user } = await AuthService.login({ email, password });

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: parseDuration(process.env.JWT_EXPIRES_IN ?? '7d'),
    });

    return res.status(200).json({ message: 'Autenticación exitosa', user });
  },

  /**
   * POST /auth/logout
   * Cierra la sesión del usuario limpiando la cookie del token JWT.
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async logout(req, res) {
    res.clearCookie('token', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
    return res.status(200).json({ message: 'Sesión cerrada correctamente' });
  },
};

export default AuthController;
