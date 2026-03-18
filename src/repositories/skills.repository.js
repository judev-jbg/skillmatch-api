import pool from '../config/db.js';

/**
 * Repositorio de acceso a datos para `skills`.
 */
const SkillsRepository = {
  /**
   * Inserta una nueva skill.
   * @param {{ name: string, category: string }} data
   * @returns {Promise<object>} Skill creada
   */
  async create({ name, category }) {
    const { rows } = await pool.query(
      `INSERT INTO skills (name, category)
       VALUES ($1, $2)
       RETURNING *`,
      [name, category],
    );
    return rows[0];
  },

  /**
   * Devuelve todas las skills con filtro opcional por categoría.
   * @param {{ category?: string }} filters
   * @returns {Promise<object[]>}
   */
  async findAll({ category } = {}) {
    const condition = category ? 'WHERE category = $1' : '';
    const params = category ? [category] : [];

    const { rows } = await pool.query(
      `SELECT * FROM skills ${condition} ORDER BY category, name`,
      params,
    );
    return rows;
  },

  /**
   * Devuelve una skill por ID.
   * @param {string} id
   * @returns {Promise<object|null>}
   */
  async findById(id) {
    const { rows } = await pool.query(
      'SELECT * FROM skills WHERE id = $1',
      [id],
    );
    return rows[0] ?? null;
  },

  /**
   * Actualiza los campos editables de una skill (COALESCE para parciales).
   * @param {string} id
   * @param {{ name?: string, category?: string }} data
   * @returns {Promise<object>} Skill actualizada
   */
  async update(id, { name, category }) {
    const { rows } = await pool.query(
      `UPDATE skills SET
         name     = COALESCE($2, name),
         category = COALESCE($3, category)
       WHERE id = $1
       RETURNING *`,
      [id, name ?? null, category ?? null],
    );
    return rows[0];
  },

  /**
   * Elimina una skill por ID.
   * Las referencias en project_skills y user_skills se borran por CASCADE.
   * @param {string} id
   * @returns {Promise<void>}
   */
  async remove(id) {
    await pool.query('DELETE FROM skills WHERE id = $1', [id]);
  },
};

export default SkillsRepository;
