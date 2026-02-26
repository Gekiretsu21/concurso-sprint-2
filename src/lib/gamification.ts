/**
 * @fileOverview Lógica de gamificação para o Mentor Lite.
 * Gerencia o cálculo de níveis baseado no volume de questões.
 */

export interface LevelInfo {
  currentLevel: number;
  progressPercentage: number;
  questionsInCurrentLevel: number;
  questionsRequiredForNextLevel: number;
  totalForNextLevel: number;
}

// Escala de progressão: Cada nível exige mais questões que o anterior
// Nível 1: 0-10
// Nível 2: 11-25 (precisa de 15)
// Nível 3: 26-50 (precisa de 25)
// Nível 4: 51-100 (precisa de 50) ...
const LEVEL_THRESHOLDS = [0, 10, 25, 50, 100, 200, 400, 800, 1500, 3000, 6000, 10000];

export function calculateLevel(totalQuestions: number): LevelInfo {
  let level = 1;
  
  // Encontra o nível atual baseado nos thresholds
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (totalQuestions >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
    } else {
      break;
    }
  }

  const currentThreshold = LEVEL_THRESHOLDS[level - 1];
  const nextThreshold = LEVEL_THRESHOLDS[level] || currentThreshold * 2; // Fallback para níveis muito altos
  
  const questionsInCurrentLevel = totalQuestions - currentThreshold;
  const questionsRequiredForNextLevel = nextThreshold - currentThreshold;
  const progressPercentage = Math.min(Math.max((questionsInCurrentLevel / questionsRequiredForNextLevel) * 100, 0), 100);

  return {
    currentLevel: level,
    progressPercentage,
    questionsInCurrentLevel,
    questionsRequiredForNextLevel,
    totalForNextLevel: nextThreshold
  };
}

export function calculatePercentage(correct: number, total: number): number {
  if (total === 0) return 0;
  return (correct / total) * 100;
}
