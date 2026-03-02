import pool from '../config/db.js';

/**
 * Repositorio de acceso a datos para la tabla `users`
 * y las tablas de perfil (`student_profile`, `ngo_profile`).
 */
const UsersRepository = {
  /**
   * Busca un usuario por email.
   * @param {string} email
   * @returns {Promise<object|null>}
   */
  async findByEmail(email) {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email],
    );
    return rows[0] ?? null;
  },

  /**
   * Busca un usuario por ID.
   * @param {string} id - UUID del usuario
   * @returns {Promise<object|null>}
   */
  async findById(id) {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [id],
    );
    return rows[0] ?? null;
  },

  /**
   * Inserta un nuevo usuario en la tabla `users`.
   * @param {{ name: string, email: string, passwordHash: string, role: string }} data
   * @param {import('pg').PoolClient} client - Cliente de transacción activa
   * @returns {Promise<object>} Usuario creado
   */
  async create({ name, email, passwordHash, role }, client) {
    const { rows } = await client.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at`,
      [name, email, passwordHash, role],
    );
    return rows[0];
  },

  /**
   * Inserta un registro en `student_profile` para el usuario dado.
   * @param {string} userId
   * @param {import('pg').PoolClient} client - Cliente de transacción activa
   * @returns {Promise<void>}
   */
  async createStudentProfile(userId, client) {
    await client.query(
      `INSERT INTO student_profile (user_id, availability)
       VALUES ($1, false)`,
      [userId],
    );
  },

  /**
   * Inserta un registro en `ngo_profile` para el usuario dado.
   * @param {{ userId: string, organizationName: string, area: string }} data
   * @param {import('pg').PoolClient} client - Cliente de transacción activa
   * @returns {Promise<void>}
   */
  async createNgoProfile({ userId, organizationName, area }, client) {
    await client.query(
      `INSERT INTO ngo_profile (user_id, organization_name, area)
       VALUES ($1, $2, $3)`,
      [userId, organizationName, area],
    );
  },
};

export default UsersRepository;
