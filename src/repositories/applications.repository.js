import pool from '../config/db.js';

/**
 * Repositorio de acceso a datos para la tabla `applications`.
 */
const ApplicationsRepository = {
  /**
   * Inserta una nueva aplicación.
   * @param {{ projectId: string, studentId: string }} data
   * @param {import('pg').PoolClient} client
   * @returns {Promise<object>} Aplicación creada
   */
  async create({ projectId, studentId }, client) {
    const { rows } = await client.query(
      `INSERT INTO applications (project_id, student_id)
       VALUES ($1, $2)
       RETURNING *`,
      [projectId, studentId],
    );
    return rows[0];
  },

  /**
   * Busca una aplicación existente para un proyecto+estudiante.
   * @param {string} projectId
   * @param {string} studentId
   * @returns {Promise<object|null>}
   */
  async findByProjectAndStudent(projectId, studentId) {
    const { rows } = await pool.query(
      'SELECT * FROM applications WHERE project_id = $1 AND student_id = $2',
      [projectId, studentId],
    );
    return rows[0] ?? null;
  },

  /**
   * Devuelve todas las aplicaciones de un proyecto.
   * @param {string} projectId
   * @returns {Promise<object[]>}
   */
  async findByProject(projectId) {
    const { rows } = await pool.query(
      `SELECT a.*, u.name AS student_name, u.email AS student_email
       FROM applications a
       JOIN users u ON u.id = a.student_id
       WHERE a.project_id = $1
       ORDER BY a.status, a.id`,
      [projectId],
    );
    return rows;
  },

  /**
   * Busca una aplicación por ID.
   * @param {string} id
   * @returns {Promise<object|null>}
   */
  async findById(id) {
    const { rows } = await pool.query(
      'SELECT * FROM applications WHERE id = $1',
      [id],
    );
    return rows[0] ?? null;
  },

  /**
   * Actualiza el estado de una aplicación.
   * @param {string} id
   * @param {string} status - 'pending' | 'approved' | 'rejected'
   * @param {import('pg').PoolClient} client
   * @returns {Promise<object>} Aplicación actualizada
   */
  async updateStatus(id, status, client) {
    const { rows } = await client.query(
      `UPDATE applications SET status = $2 WHERE id = $1 RETURNING *`,
      [id, status],
    );
    return rows[0];
  },
};

export default ApplicationsRepository;
