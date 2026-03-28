import pool from '../config/db.js';

/**
 * Repositorio de acceso a datos para `deliverables`.
 */
const DeliverablesRepository = {
  /**
   * Crea un nuevo entregable.
   * @param {{ assignmentId: string, title: string, description?: string }} data
   * @param {import('pg').PoolClient} [client]
   * @returns {Promise<object>} Entregable creado
   */
  async create({ assignmentId, title, description }, client) {
    const db = client ?? pool;
    const { rows } = await db.query(
      `INSERT INTO deliverables (assignment_id, title, description)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [assignmentId, title, description ?? null],
    );
    return rows[0];
  },

  /**
   * Devuelve todos los entregables de un assignment.
   * @param {string} assignmentId
   * @returns {Promise<object[]>}
   */
  async findByAssignment(assignmentId) {
    const { rows } = await pool.query(
      `SELECT * FROM deliverables
       WHERE assignment_id = $1
       ORDER BY created_at ASC`,
      [assignmentId],
    );
    return rows;
  },

  /**
   * Busca un entregable por ID.
   * @param {string} id
   * @returns {Promise<object|null>}
   */
  async findById(id) {
    const { rows } = await pool.query(
      'SELECT * FROM deliverables WHERE id = $1',
      [id],
    );
    return rows[0] ?? null;
  },

  /**
   * Actualiza campos de un entregable.
   * @param {string} id
   * @param {{ fileUrl?: string, comment?: string, status?: string }} data
   * @param {import('pg').PoolClient} [client]
   * @returns {Promise<object>} Entregable actualizado
   */
  async update(id, { fileUrl, comment, status }, client) {
    const db = client ?? pool;
    const { rows } = await db.query(
      `UPDATE deliverables SET
         file_url = COALESCE($2, file_url),
         comment  = COALESCE($3, comment),
         status   = COALESCE($4, status)
       WHERE id = $1
       RETURNING *`,
      [id, fileUrl ?? null, comment ?? null, status ?? null],
    );
    return rows[0];
  },

  /**
   * Comprueba si hay un entregable activo (in_progress o in_review) en un assignment.
   * @param {string} assignmentId
   * @returns {Promise<boolean>}
   */
  async hasActiveDeliverable(assignmentId) {
    const { rows } = await pool.query(
      `SELECT EXISTS(
         SELECT 1 FROM deliverables
         WHERE assignment_id = $1 AND status IN ('in_progress', 'in_review')
       ) AS has_active`,
      [assignmentId],
    );
    return rows[0].has_active;
  },
};

export default DeliverablesRepository;
