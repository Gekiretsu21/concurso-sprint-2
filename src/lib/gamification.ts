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

export interface Achievement {
  title: string;
  icon: string;
  color: string;
  mentoringTip: string;
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
export const ACHIEVEMENTS: Achievement[] = [
  { 
    title: "Desapegando das Vídeo-aulas", 
    icon: "📺", 
    color: "text-gray-700 bg-gray-100 border-gray-300",
    mentoringTip: "Assistir vídeo-aulas é até legal e confortável, mas é um estudo passivo. Pouco do que você vê é retido e, no final, você perdeu bastante tempo. A verdadeira aprovação começa quando você suja as mãos nas questões."
  },
  { 
    title: "Sobrevivendo aos PDFs", 
    icon: "📚", 
    color: "text-slate-700 bg-slate-100 border-slate-300",
    mentoringTip: "Enquanto um aluno lê um PDF 'bizurado' inteiro, outro faz 20 questões de vários assuntos, erra, aprende o porquê e fixa a matéria. Estudo ativo constrói memória muscular. Continue assim!"
  },
  { 
    title: "Vacinado contra Pegadinhas", 
    icon: "🪤", 
    color: "text-amber-800 bg-amber-100 border-amber-300",
    mentoringTip: "Você começou a ler a mente do examinador. A teoria já não é o problema, agora você entende como a banca distorce as palavras. O padrão se repete, mantenha o foco nas palavras-chave!"
  },
  { 
    title: "Já dá pra sonhar...", 
    icon: "💭", 
    color: "text-zinc-700 bg-zinc-100 border-zinc-300",
    mentoringTip: "A base de concreto foi construída. Agora o jogo é constância e fechar os buracos nas matérias que você mais odeia. O que separa o amador do aprovado é estudar o que dói."
  },
  { 
    title: "Garantindo os 60%", 
    icon: "📈", 
    color: "text-emerald-700 bg-emerald-100 border-emerald-300",
    mentoringTip: "Você saiu da média estatística! Mas cuidado: pular dos 60% para os 80% exige mais inteligência do que força. É hora de focar cirurgicamente no seu Caderno de Erros."
  },
  { 
    title: "Beirando a Nota de Corte", 
    icon: "🤏", 
    color: "text-blue-700 bg-blue-100 border-blue-300",
    mentoringTip: "Dói bater na trave, mas é aqui que a mágica acontece. Você já tem o nível da prova. O ajuste fino agora é controle de tempo e revisão espaçada nas decorebas."
  },
  { 
    title: "Dominando a Banca", 
    icon: "🧠", 
    color: "text-purple-700 bg-purple-100 border-purple-300",
    mentoringTip: "Você já fala o idioma da FGV/Cebraspe/FCC fluentemente. Já sabe qual alternativa é a certa só pela entonação do texto. Mantenha o ritmo brutal de resolução."
  },
  { 
    title: "Batendo os 80%", 
    icon: "🔥", 
    color: "text-orange-700 bg-orange-100 border-orange-300",
    mentoringTip: "Nível de elite. Errar uma questão agora é um evento raro. Use seus erros como ouro para polir os últimos detalhes. Você é o pesadelo da concorrência."
  },
  { 
    title: "Aparando as Arestas", 
    icon: "🛠️", 
    color: "text-yellow-700 bg-yellow-100 border-yellow-300",
    mentoringTip: "Modo simulado ativado. Trate cada bateria de questões como se fosse o domingo da prova. A sua resistência mental já está no pico, é só manter a máquina girando."
  },
  { 
    title: "Comprando a Bic Transparente", 
    icon: "🖊️", 
    color: "text-stone-900 bg-white border-yellow-500 shadow-xl shadow-yellow-500/20",
    mentoringTip: "O trabalho duro foi feito. Você zerou o jogo da preparação. Agora é blindar a mente, controlar a ansiedade e ir buscar a sua assinatura no Diário Oficial. A vaga é sua!"
  },
];

export function getAchievement(level: number): Achievement {
  const index = Math.min(Math.floor((level - 1) / 5), ACHIEVEMENTS.length - 1);
  return ACHIEVEMENTS[index];
}
