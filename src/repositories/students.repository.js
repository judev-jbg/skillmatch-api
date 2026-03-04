import pool from '../config/db.js';

/**
 * Repositorio de acceso a datos para `student_profile` y `user_skills`.
 */
const StudentRepository = {
  /**
   * Devuelve el perfil completo del estudiante con sus habilidades.
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
         sp.availability,
         sp.portfolio_url,
         COALESCE(
           json_agg(
             json_build_object('skill_id', us.skill_id, 'level', us.level)
           ) FILTER (WHERE us.skill_id IS NOT NULL),
           '[]'
         ) AS skills
       FROM users u
       JOIN student_profile sp ON sp.user_id = u.id
       LEFT JOIN user_skills us ON us.user_id = u.id
       WHERE u.id = $1
       GROUP BY u.id, sp.availability, sp.portfolio_url`,
      [userId],
    );
    return rows[0] ?? null;
  },

  /**
   * Actualiza los campos de `student_profile` para el usuario dado.
   * @param {{ userId: string, availability?: boolean, portfolioUrl?: string }} data
   * @param {import('pg').PoolClient} client - Cliente de transacción activa
   * @returns {Promise<void>}
   */
  async update({ userId, availability, portfolioUrl }, client) {
    await client.query(
      `UPDATE student_profile
       SET
         availability  = COALESCE($2, availability),
         portfolio_url = COALESCE($3, portfolio_url)
       WHERE user_id = $1`,
      [userId, availability ?? null, portfolioUrl ?? null],
    );
  },

  /**
   * Reemplaza todas las habilidades del estudiante en `user_skills`.
   * Elimina las existentes e inserta las nuevas dentro de la misma transacción.
   *
   * @param {string} userId
   * @param {{ skill_id: string, level: string }[]} skills
   * @param {import('pg').PoolClient} client - Cliente de transacción activa
   * @returns {Promise<void>}
   */
  async upsertSkills(userId, skills, client) {
    await client.query(
      'DELETE FROM user_skills WHERE user_id = $1',
      [userId],
    );

    if (skills.length === 0) return;

    const values = skills.map((s, i) => `($1, $${i * 2 + 2}, $${i * 2 + 3})`).join(', ');
    const params = [userId, ...skills.flatMap(s => [s.skill_id, s.level])];

    await client.query(
      `INSERT INTO user_skills (user_id, skill_id, level) VALUES ${values}`,
      params,
    );
  },
};

export default StudentRepository;
