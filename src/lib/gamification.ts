/**
 * @fileOverview Lógica de gamificação para o Mentor Lite.
 * Gerencia o cálculo de níveis baseado em Progressão Aritmética (PA).
 */

export interface LevelInfo {
  currentLevel: number;
  progressPercentage: number;
  questionsInCurrentLevel: number;
  questionsRequiredForNextLevel: number;
}

/**
 * Calcula o progresso do usuário baseado em uma PA onde o custo aumenta em 5 a cada nível.
 * Nível 1 -> 2: 10 questões
 * Nível 2 -> 3: 15 questões
 * Nível 3 -> 4: 20 questões...
 */
export function calculateLevel(totalQuestions: number): LevelInfo {
  let currentLevel = 1;
  let questionsRemaining = totalQuestions;
  let costForNextLevel = 10;

  while (questionsRemaining >= costForNextLevel) {
    questionsRemaining -= costForNextLevel;
    currentLevel++;
    costForNextLevel += 5;
  }

  const progressPercentage = Math.min(Math.max((questionsRemaining / costForNextLevel) * 100, 0), 100);

  return {
    currentLevel,
    progressPercentage,
    questionsInCurrentLevel: questionsRemaining,
    questionsRequiredForNextLevel: costForNextLevel,
  };
}

export function calculatePercentage(correct: number, total: number): number {
  if (total === 0) return 0;
  return (correct / total) * 100;
}

/**
 * Dicionário de Conquistas da Mentoria Academy
 */
export const ACHIEVEMENTS = [
  { title: "Desapegando das Vídeo-aulas", icon: "📺", color: "text-gray-600 bg-gray-100 border-gray-200" },
  { title: "Sobrevivendo aos PDFs", icon: "📚", color: "text-slate-600 bg-slate-100 border-slate-200" },
  { title: "Vacinado contra Pegadinhas", icon: "🪤", color: "text-amber-700 bg-amber-50 border-amber-200" },
  { title: "Já dá pra sonhar...", icon: "💭", color: "text-zinc-500 bg-zinc-100 border-zinc-200" },
  { title: "Garantindo os 60%", icon: "📈", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  { title: "Beirando a Nota de Corte", icon: "🤏", color: "text-blue-600 bg-blue-50 border-blue-200" },
  { title: "Dominando a Banca", icon: "🧠", color: "text-purple-600 bg-purple-50 border-purple-200" },
  { title: "Batendo os 80%", icon: "🔥", color: "text-orange-600 bg-orange-50 border-orange-200" },
  { title: "Aparando as Arestas", icon: "🛠️", color: "text-yellow-600 bg-yellow-50 border-yellow-200" },
  { title: "Comprando a Bic Transparente", icon: "🖊️", color: "text-stone-900 bg-white border-yellow-500 shadow-lg shadow-yellow-500/20" },
];

export function getAchievement(level: number) {
  const index = Math.min(Math.floor((level - 1) / 5), ACHIEVEMENTS.length - 1);
  return ACHIEVEMENTS[index];
}
