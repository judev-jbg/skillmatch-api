import SkillsRepository from '../repositories/skills.repository.js';
import { HttpError } from '../utils/errors.js';

const VALID_CATEGORIES = ['Desarrollo', 'Diseno', 'CMS', 'Marketing'];

/**
 * Lógica de negocio para skills.
 */
const SkillsService = {
  /**
   * Crea una nueva skill.
   *
   * @param {string} name
   * @param {string} category
   * @returns {Promise<object>} Skill creada
   * @throws {HttpError} 400 si faltan campos requeridos o categoría inválida
   */
  async create(name, category) {
    if (!name) {
      throw new HttpError('El campo name es requerido', 400);
    }
    if (!category) {
      throw new HttpError('El campo category es requerido', 400);
    }
    if (!VALID_CATEGORIES.includes(category)) {
      throw new HttpError(`Categoría inválida. Permitidas: ${VALID_CATEGORIES.join(', ')}`, 400);
    }

    return SkillsRepository.create({ name, category });
  },

  /**
   * Devuelve todas las skills con filtro opcional por categoría.
   *
   * @param {{ category?: string }} query
   * @returns {Promise<object[]>}
   */
  async getAll({ category } = {}) {
    return SkillsRepository.findAll({ category });
  },

  /**
   * Actualiza una skill existente.
   *
   * @param {string} id
   * @param {{ name?: string, category?: string }} data
   * @returns {Promise<object>} Skill actualizada
   * @throws {HttpError} 404 si no existe
   * @throws {HttpError} 400 si no se provee ningún campo
   */
  async update(id, { name, category }) {
    if (!name && !category) {
      throw new HttpError('Debe proporcionar al menos un campo para actualizar', 400);
    }
    if (category && !VALID_CATEGORIES.includes(category)) {
      throw new HttpError(`Categoría inválida. Permitidas: ${VALID_CATEGORIES.join(', ')}`, 400);
    }

    const existing = await SkillsRepository.findById(id);
    if (!existing) {
      throw new HttpError('Skill no encontrada', 404);
    }

    return SkillsRepository.update(id, { name, category });
  },

  /**
   * Elimina una skill por ID.
   * Las referencias en project_skills y user_skills se borran por CASCADE.
   *
   * @param {string} id
   * @returns {Promise<void>}
   * @throws {HttpError} 404 si no existe
   */
  async remove(id) {
    const existing = await SkillsRepository.findById(id);
    if (!existing) {
      throw new HttpError('Skill no encontrada', 404);
    }

    await SkillsRepository.remove(id);
  },
};

export default SkillsService;
