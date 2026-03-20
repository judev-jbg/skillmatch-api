import { describe, it, expect } from 'vitest';
import calculateScore from '../services/matching.service.js';

describe('calculateScore', () => {
  // ── Casos base ────────────────────────────────────────────────────────────

  it('devuelve 0 si el proyecto no pide skills', () => {
    const student = [{ skill_id: 'sk-1', level: 'advanced' }];
    const project = [];

    expect(calculateScore(student, project)).toBe(0);
  });

  it('devuelve 0 si el estudiante no tiene ninguna skill del proyecto', () => {
    const student = [{ skill_id: 'sk-99', level: 'advanced' }];
    const project = [{ skill_id: 'sk-1', required_level: 'basic' }];

    expect(calculateScore(student, project)).toBe(0);
  });

  it('devuelve 0 si el estudiante no tiene skills', () => {
    const student = [];
    const project = [{ skill_id: 'sk-1', required_level: 'basic' }];

    expect(calculateScore(student, project)).toBe(0);
  });

  // ── Match perfecto ────────────────────────────────────────────────────────

  it('devuelve 100 si el estudiante cumple exactamente todos los niveles', () => {
    const student = [
      { skill_id: 'sk-1', level: 'intermediate' },
      { skill_id: 'sk-2', level: 'basic' },
    ];
    const project = [
      { skill_id: 'sk-1', required_level: 'intermediate' },
      { skill_id: 'sk-2', required_level: 'basic' },
    ];

    expect(calculateScore(student, project)).toBe(100);
  });

  it('devuelve 100 si el estudiante supera todos los niveles (capeo a 1)', () => {
    const student = [
      { skill_id: 'sk-1', level: 'advanced' },
      { skill_id: 'sk-2', level: 'advanced' },
    ];
    const project = [
      { skill_id: 'sk-1', required_level: 'basic' },
      { skill_id: 'sk-2', required_level: 'intermediate' },
    ];

    // advanced(3)/basic(1) = 3 → capea a 1
    // advanced(3)/intermediate(2) = 1.5 → capea a 1
    // promedio = 1 → 100
    expect(calculateScore(student, project)).toBe(100);
  });

  // ── Match parcial ─────────────────────────────────────────────────────────

  it('calcula score parcial cuando el estudiante tiene algunas skills', () => {
    const student = [
      { skill_id: 'sk-1', level: 'intermediate' },
      // no tiene sk-2
    ];
    const project = [
      { skill_id: 'sk-1', required_level: 'intermediate' },
      { skill_id: 'sk-2', required_level: 'basic' },
    ];

    // sk-1: 2/2 = 1
    // sk-2: no la tiene = 0
    // promedio: (1 + 0) / 2 = 0.5 → 50
    expect(calculateScore(student, project)).toBe(50);
  });

  it('calcula score cuando el nivel es inferior al pedido', () => {
    const student = [
      { skill_id: 'sk-1', level: 'basic' },
    ];
    const project = [
      { skill_id: 'sk-1', required_level: 'advanced' },
    ];

    // basic(1) / advanced(3) = 0.333 → 33
    expect(calculateScore(student, project)).toBe(33);
  });

  // ── Caso realista (datos del seed) ────────────────────────────────────────

  it('calcula score con datos similares al seed', () => {
    // Laura: JS advanced, React intermediate, Node intermediate, SQL basic
    const student = [
      { skill_id: 'js', level: 'advanced' },
      { skill_id: 'react', level: 'intermediate' },
      { skill_id: 'node', level: 'intermediate' },
      { skill_id: 'sql', level: 'basic' },
    ];
    // Proyecto 1 pide: React intermediate, Node basic, SQL basic
    const project = [
      { skill_id: 'react', required_level: 'intermediate' },
      { skill_id: 'node', required_level: 'basic' },
      { skill_id: 'sql', required_level: 'basic' },
    ];

    // react: 2/2 = 1 → capea a 1
    // node: 2/1 = 2 → capea a 1
    // sql: 1/1 = 1 → capea a 1
    // promedio: (1 + 1 + 1) / 3 = 1 → 100
    expect(calculateScore(student, project)).toBe(100);
  });
});
