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
};

export default CertificatesRepository;
