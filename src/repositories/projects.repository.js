import pool from '../config/db.js';

/**
 * Repositorio de acceso a datos para `projects` y `project_skills`.
 */
const ProjectsRepository = {
  /**
   * Inserta un nuevo proyecto.
   * @param {{ ngoId: string, title: string, description?: string, objectives?: string, estimatedHours?: number, deadline?: string, modality?: string }} data
   * @param {import('pg').PoolClient} client
   * @returns {Promise<object>} Proyecto creado
   */
  async create({ ngoId, title, description, objectives, estimatedHours, deadline, modality }, client) {
    const { rows } = await client.query(
      `INSERT INTO projects (ngo_id, title, description, objectives, estimated_hours, deadline, modality)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [ngoId, title, description ?? null, objectives ?? null, estimatedHours ?? null, deadline ?? null, modality ?? null],
    );
    return rows[0];
  },

  /**
   * Devuelve todos los proyectos con filtros opcionales.
   * Incluye las skills requeridas agregadas como array JSON.
   *
   * @param {{ status?: string, skillId?: string, ngoId?: string }} filters
   * @returns {Promise<object[]>}
   */
  async findAll({ status, skillId, ngoId } = {}) {
    const conditions = [];
    const params = [];

    if (ngoId) {
      params.push(ngoId);
      conditions.push(`p.ngo_id = $${params.length}`);
    }
    if (status) {
      params.push(status);
      conditions.push(`p.status = $${params.length}`);
    }
    if (skillId) {
      params.push(skillId);
      conditions.push(`EXISTS (SELECT 1 FROM project_skills ps2 WHERE ps2.project_id = p.id AND ps2.skill_id = $${params.length})`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows } = await pool.query(
      `SELECT
         p.*,
         COALESCE(
           json_agg(json_build_object('skill_id', ps.skill_id, 'required_level', ps.required_level))
           FILTER (WHERE ps.skill_id IS NOT NULL), '[]'
         ) AS skills
       FROM projects p
       LEFT JOIN project_skills ps ON ps.project_id = p.id
       ${where}
       GROUP BY p.id
       ORDER BY p.created_at DESC`,
      params,
    );
    return rows;
  },

  /**
   * Devuelve un proyecto por ID con sus skills.
   * @param {string} id
   * @returns {Promise<object|null>}
   */
  async findById(id) {
    const { rows } = await pool.query(
      `SELECT
         p.*,
         COALESCE(
           json_agg(json_build_object('skill_id', ps.skill_id, 'required_level', ps.required_level))
           FILTER (WHERE ps.skill_id IS NOT NULL), '[]'
         ) AS skills
       FROM projects p
       LEFT JOIN project_skills ps ON ps.project_id = p.id
       WHERE p.id = $1
       GROUP BY p.id`,
      [id],
    );
    return rows[0] ?? null;
  },

  /**
   * Actualiza los campos editables de un proyecto (COALESCE para parciales).
   * @param {string} id
   * @param {{ title?: string, description?: string, objectives?: string, estimatedHours?: number, deadline?: string, modality?: string }} data
   * @param {import('pg').PoolClient} client
   * @returns {Promise<void>}
   */
  async update(id, { title, description, objectives, estimatedHours, deadline, modality }, client) {
    await client.query(
      `UPDATE projects SET
         title           = COALESCE($2, title),
         description     = COALESCE($3, description),
         objectives      = COALESCE($4, objectives),
         estimated_hours = COALESCE($5, estimated_hours),
         deadline        = COALESCE($6, deadline),
         modality        = COALESCE($7, modality)
       WHERE id = $1`,
      [id, title ?? null, description ?? null, objectives ?? null, estimatedHours ?? null, deadline ?? null, modality ?? null],
    );
  },
  
  /**
   * Actualiza el estado de un proyecto.
   * @param {string} id
   * @param {string} newStatus
   * @returns {Promise<object>} Proyecto actualizado
   */
   async updateStatus(id, newStatus, client) {
     const db = client ?? pool;
     const { rows } = await db.query(
       `UPDATE projects SET status = $2 WHERE id = $1 RETURNING *`,
       [id, newStatus],
     );
     return rows[0];
  },
   
  /**
   * Reemplaza las skills requeridas de un proyecto en `project_skills`.
   * @param {string} projectId
   * @param {{ skill_id: string, required_level: string }[]} skills
   * @param {import('pg').PoolClient} client
   * @returns {Promise<void>}
   */
  async upsertSkills(projectId, skills, client) {
    await client.query('DELETE FROM project_skills WHERE project_id = $1', [projectId]);

    if (skills.length === 0) return;

    const values = skills.map((s, i) => `($1, $${i * 2 + 2}, $${i * 2 + 3})`).join(', ');
    const params = [projectId, ...skills.flatMap(s => [s.skill_id, s.required_level])];

    await client.query(
      `INSERT INTO project_skills (project_id, skill_id, required_level) VALUES ${values}`,
      params,
    );
  },
};

export default ProjectsRepository;
