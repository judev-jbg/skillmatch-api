import pool from '../config/db.js';

/**
 * Repositorio de acceso a datos para `assignments`.
 */
const AssignmentsRepository = {
  /**
   * Crea una nueva asignación.
   * @param {{ projectId: string, studentId: string }} data
   * @param {import('pg').PoolClient} client
   * @returns {Promise<object>} Assignment creado
   */
  async create({ projectId, studentId }, client) {
    const { rows } = await client.query(
      `INSERT INTO assignments (project_id, student_id)
       VALUES ($1, $2)
       RETURNING *`,
      [projectId, studentId],
    );
    return rows[0];
  },

  /**
   * Busca el assignment activo de un proyecto.
   * @param {string} projectId
   * @returns {Promise<object|null>}
   */
  async findByProject(projectId) {
    const { rows } = await pool.query(
      `SELECT a.*, u.name AS student_name, u.email AS student_email
       FROM assignments a
       JOIN users u ON u.id = a.student_id
       WHERE a.project_id = $1
       ORDER BY a.start_date DESC
       LIMIT 1`,
      [projectId],
    );
    return rows[0] ?? null;
  },

  /**
   * Busca un assignment por ID.
   * @param {string} id
   * @returns {Promise<object|null>}
   */
  async findById(id) {
    const { rows } = await pool.query(
      `SELECT a.*, u.name AS student_name, u.email AS student_email
       FROM assignments a
       JOIN users u ON u.id = a.student_id
       WHERE a.id = $1`,
      [id],
    );
    return rows[0] ?? null;
  },
  /**
   * Marca un assignment como finalizado.
   * @param {string} id
   * @param {import('pg').PoolClient} [client]
   * @returns {Promise<object>} Assignment actualizado
   */
  async setEndDate(id, client) {
    const db = client ?? pool;
    const { rows } = await db.query(
      `UPDATE assignments SET end_date = NOW() WHERE id = $1 RETURNING *`,
      [id],
    );
    return rows[0];
  },
};

export default AssignmentsRepository;
