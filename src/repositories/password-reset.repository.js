import pool from '../config/db.js';

/**
 * Repositorio de acceso a datos para la tabla `password_reset_tokens`.
 */
const PasswordResetRepository = {
  /**
   * Inserta un token de recuperación de contraseña.
   * @param {{ userId: string, token: string, expiresAt: Date }} data
   * @returns {Promise<object>} Token creado
   */
  async create({ userId, token, expiresAt }) {
    const { rows } = await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, token, expiresAt],
    );
    return rows[0];
  },

  /**
   * Busca un token válido (no expirado).
   * @param {string} token
   * @returns {Promise<object|null>}
   */
  async findByToken(token) {
    const { rows } = await pool.query(
      `SELECT * FROM password_reset_tokens
       WHERE token = $1 AND expires_at > NOW()`,
      [token],
    );
    return rows[0] ?? null;
  },

  /**
   * Elimina todos los tokens de un usuario.
   * @param {string} userId
   * @returns {Promise<void>}
   */
  async deleteByUserId(userId) {
    await pool.query(
      `DELETE FROM password_reset_tokens WHERE user_id = $1`,
      [userId],
    );
  },
};

export default PasswordResetRepository;
