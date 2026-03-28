import pool from '../config/db.js';

/**
 * Repositorio de acceso a datos para la tabla `applications`.
 */
const ApplicationsRepository = {
  /**
   * Inserta una nueva aplicación.
   * @param {{ projectId: string, studentId: string, compatibilityScore: number }} data
   * @param {import('pg').PoolClient} client
   * @returns {Promise<object>} Aplicación creada
   */
  async create({ projectId, studentId, compatibilityScore }, client) {
    const { rows } = await client.query(
      `INSERT INTO applications (project_id, student_id, compatibility_score)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [projectId, studentId, compatibilityScore],
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
       ORDER BY a.status, a.compatibility_score DESC, a.id`,
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
  /**
   * Rechaza todas las applications de un proyecto excepto una.
   * @param {string} projectId
   * @param {string} excludeId - ID de la application que NO se rechaza
   * @param {import('pg').PoolClient} client
   * @returns {Promise<void>}
   */
  async rejectAllExcept(projectId, excludeId, client) {
    await client.query(
      `UPDATE applications SET status = 'rejected'
       WHERE project_id = $1 AND id != $2 AND status = 'pending'`,
      [projectId, excludeId],
    );
  },
};

export default ApplicationsRepository;
