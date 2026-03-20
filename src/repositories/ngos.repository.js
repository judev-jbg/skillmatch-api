import pool from '../config/db.js';

/**
 * Repositorio de acceso a datos para `ngo_profile`.
 */
const NgosRepository = {
  /**
   * Devuelve el perfil completo de la ONG unido a `users`.
   * @param {string} userId - UUID del usuario
   * @returns {Promise<object|null>}
   */
  async findByUserId(userId) {
    const { rows } = await pool.query(
      `SELECT
         u.id,
         u.name,
         u.email,
         u.role,
         u.created_at,
         np.organization_name,
         np.description,
         np.area,
         np.verified
       FROM users u
       JOIN ngo_profile np ON np.user_id = u.id
       WHERE u.id = $1`,
      [userId],
    );
    return rows[0] ?? null;
  },

  /**
   * Actualiza los campos editables de `ngo_profile`.
   * Solo actualiza los campos que se provean (COALESCE).
   *
   * @param {{ userId: string, organizationName?: string, description?: string, area?: string }} data
   * @param {import('pg').PoolClient} client - Cliente de transacción activa
   * @returns {Promise<void>}
   */
  async update({ userId, organizationName, description, area }, client) {
    await client.query(
      `UPDATE ngo_profile
       SET
         organization_name = COALESCE($2, organization_name),
         description       = COALESCE($3, description),
         area              = COALESCE($4, area)
       WHERE user_id = $1`,
      [userId, organizationName ?? null, description ?? null, area ?? null],
    );
  },
  /**
   * Marca una ONG como verificada.
   * @param {string} userId
   * @returns {Promise<object|null>} Perfil actualizado o null si no existe
   */
  async verify(userId) {
    const { rows } = await pool.query(
      `UPDATE ngo_profile SET verified = TRUE WHERE user_id = $1 RETURNING *`,
      [userId],
    );
    return rows[0] ?? null;
  },
};

export default NgosRepository;
