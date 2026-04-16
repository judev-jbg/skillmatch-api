import pool from '../config/db.js';

/**
 * Repositorio de acceso a datos para la tabla `certificates`.
 */
const CertificatesRepository = {
  /**
   * Inserta un nuevo certificado.
   * @param {{ assignmentId: string, fileUrl: string }} data
   * @param {import('pg').PoolClient} client
   * @returns {Promise<object>} Certificado creado
   */
  async create({ assignmentId, fileUrl }, client) {
    const db = client ?? pool;
    const { rows } = await db.query(
      `INSERT INTO certificates (assignment_id, file_url)
       VALUES ($1, $2)
       RETURNING *`,
      [assignmentId, fileUrl],
    );
    return rows[0];
  },

  /**
   * Busca un certificado por ID.
   * Incluye el student_id del assignment para verificar ownership.
   * @param {string} id
   * @returns {Promise<object|null>}
   */
  async findById(id) {
    const { rows } = await pool.query(
      `SELECT c.*, a.student_id
       FROM certificates c
       JOIN assignments a ON a.id = c.assignment_id
       WHERE c.id = $1`,
      [id],
    );
    return rows[0] ?? null;
  },
};

export default CertificatesRepository;
