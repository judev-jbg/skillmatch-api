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
      `SELECT a.*, u.name AS student_name, u.email AS student_email,
              c.id AS certificate_id
       FROM assignments a
       JOIN users u ON u.id = a.student_id
       LEFT JOIN certificates c ON c.assignment_id = a.id
       WHERE a.id = $1`,
      [id],
    );
    return rows[0] ?? null;
  },
  /**
   * Devuelve todos los assignments de un estudiante.
   * Incluye título y estado del proyecto asociado.
   * @param {string} studentId
   * @returns {Promise<object[]>}
   */
  async findByStudent(studentId) {
    const { rows } = await pool.query(
      `SELECT a.*, p.title AS project_title, p.status AS project_status,
              c.id AS certificate_id
       FROM assignments a
       JOIN projects p ON p.id = a.project_id
       LEFT JOIN certificates c ON c.assignment_id = a.id
       WHERE a.student_id = $1
       ORDER BY a.created_at DESC`,
      [studentId],
    );
    return rows;
  },

  /**
   * Busca el assignment activo de un proyecto con todos los datos
   * necesarios para generar el certificado: nombre del estudiante,
   * nombre de la ONG, título del proyecto, start_date y end_date.
   * @param {string} projectId
   * @param {import('pg').PoolClient} [client]
   * @returns {Promise<object|null>}
   */
  async findByProjectWithDetails(projectId, client) {
    const db = client ?? pool;
    const { rows } = await db.query(
      `SELECT
         a.id            AS assignment_id,
         a.start_date,
         a.end_date,
         u_student.name  AS student_name,
         n.organization_name AS ngo_name,
         p.title         AS project_title
       FROM assignments a
       JOIN users u_student    ON u_student.id = a.student_id
       JOIN projects p         ON p.id = a.project_id
       JOIN ngo_profile n      ON n.user_id = p.ngo_id
       WHERE a.project_id = $1
       ORDER BY a.start_date DESC
       LIMIT 1`,
      [projectId],
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
