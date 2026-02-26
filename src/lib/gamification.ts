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
 * Cores atualizadas para maior destaque visual.
 */
export const ACHIEVEMENTS = [
  { title: "Desapegando das Vídeo-aulas", icon: "📺", color: "text-gray-700 bg-gray-100 border-gray-300" },
  { title: "Sobrevivendo aos PDFs", icon: "📚", color: "text-slate-700 bg-slate-100 border-slate-300" },
  { title: "Vacinado contra Pegadinhas", icon: "🪤", color: "text-amber-800 bg-amber-100 border-amber-300" },
  { title: "Já dá pra sonhar...", icon: "💭", color: "text-zinc-700 bg-zinc-100 border-zinc-300" },
  { title: "Garantindo os 60%", icon: "📈", color: "text-emerald-700 bg-emerald-100 border-emerald-300" },
  { title: "Beirando a Nota de Corte", icon: "🤏", color: "text-blue-700 bg-blue-100 border-blue-300" },
  { title: "Dominando a Banca", icon: "🧠", color: "text-purple-700 bg-purple-100 border-purple-300" },
  { title: "Batendo os 80%", icon: "🔥", color: "text-orange-700 bg-orange-100 border-orange-300" },
  { title: "Aparando as Arestas", icon: "🛠️", color: "text-yellow-700 bg-yellow-100 border-yellow-300" },
  { title: "Comprando a Bic Transparente", icon: "🖊️", color: "text-stone-900 bg-white border-yellow-500 shadow-xl shadow-yellow-500/20" },
];

export function getAchievement(level: number) {
  const index = Math.min(Math.floor((level - 1) / 5), ACHIEVEMENTS.length - 1);
  return ACHIEVEMENTS[index];
}
