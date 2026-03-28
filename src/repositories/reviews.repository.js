import pool from '../config/db.js';

/**
 * Repositorio de acceso a datos para `reviews`.
 */
const ReviewsRepository = {
  /**
   * Crea una nueva valoración.
   * @param {{ assignmentId: string, fromUser: string, toUser: string, rating: number, comment?: string }} data
   * @returns {Promise<object>} Review creada
   */
  async create({ assignmentId, fromUser, toUser, rating, comment }) {
    const { rows } = await pool.query(
      `INSERT INTO reviews (assignment_id, from_user, to_user, rating, comment)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [assignmentId, fromUser, toUser, rating, comment ?? null],
    );
    return rows[0];
  },

  /**
   * Devuelve todas las valoraciones recibidas por un usuario.
   * @param {string} userId
   * @returns {Promise<object[]>}
   */
  async findByUser(userId) {
    const { rows } = await pool.query(
      `SELECT r.*, u.name AS reviewer_name
       FROM reviews r
       JOIN users u ON u.id = r.from_user
       WHERE r.to_user = $1
       ORDER BY r.created_at DESC`,
      [userId],
    );
    return rows;
  },

  /**
   * Busca si ya existe una review de un usuario para un assignment.
   * @param {string} assignmentId
   * @param {string} fromUser
   * @returns {Promise<object|null>}
   */
  async findByAssignmentAndUser(assignmentId, fromUser) {
    const { rows } = await pool.query(
      'SELECT * FROM reviews WHERE assignment_id = $1 AND from_user = $2',
      [assignmentId, fromUser],
    );
    return rows[0] ?? null;
  },
};

export default ReviewsRepository;
