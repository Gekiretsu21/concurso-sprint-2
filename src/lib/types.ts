import { Timestamp } from 'firebase/firestore';

/**
 * Estrutura de dados agregados para a Dashboard de Analytics do usuário.
 * Armazenado em: `users/{userId}/stats/dashboard_data`
 */
export interface UserDashboardStats {
  // KPIs Gerais
  general: {
    totalQuestions: number;
    totalCorrect: number;
    currentStreak: number;
    studyTimeMinutes: number;
  };
  
  // Performance por Matéria (Para Gráfico de Radar/Barras)
  subjectsPerformance: {
    [subjectName: string]: {
      total: number;
      correct: number;
      lastStudiedAt: Timestamp; // Para identificar matérias "esquecidas"
    };
  };

  // Histórico Recente (Para Gráfico de Linha - Últimos 7 dias)
  evolutionHistory: Array<{
    date: string; // Formato "DD/MM"
    accuracy: number; // Percentual de acerto (0-100)
    questionsCount: number;
  }>;

  // Estatísticas de Flashcards (Separado por Status)
  flashcardsStats: {
    [subjectName: string]: {
      totalReviewed: number;
      remembered: number; // Clicou em "Acertei"
      forgot: number;     // Clicou em "Errei"
    };
  };
}


/**
 * Destaque de matéria (ponto forte ou fraco).
 */
export interface SubjectHighlight {
  subject: string;
  accuracy: number;
}


/**
 * Estrutura completa retornada pela Server Action `getDashboardAnalytics`.
 */
export interface DashboardAnalyticsData {
  stats: UserDashboardStats;
  highlights: {
    weakestSubject: SubjectHighlight | null;
    strongestSubject: SubjectHighlight | null;
  };
}
