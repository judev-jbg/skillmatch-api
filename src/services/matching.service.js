const LEVEL_VALUES = { basic: 1, intermediate: 2, advanced: 3 };

/**
 * Calcula el score de compatibilidad entre un estudiante y un proyecto.
 * Compara las skills del estudiante con las requeridas por el proyecto.
 *
 * @param {{ skill_id: string, level: string }[]} studentSkills - Skills del estudiante
 * @param {{ skill_id: string, required_level: string }[]} projectSkills - Skills requeridas
 * @returns {number} Score de 0 a 100
 */
export default function calculateScore(studentSkills, projectSkills) {
  if (projectSkills.length === 0) {
    return 0;
  }

  const studentMap = new Map(
    studentSkills.map(s => [s.skill_id, s.level]),
  );

  const scores = projectSkills.map(ps => {
    const studentLevel = studentMap.get(ps.skill_id);
    if (!studentLevel) return 0;

    const ratio = LEVEL_VALUES[studentLevel] / LEVEL_VALUES[ps.required_level];
    return Math.min(ratio, 1);
  });

  const average = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  return Math.round(average * 100);
}
