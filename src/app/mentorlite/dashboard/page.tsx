'use client';

import { useEffect, useState } from 'react';
import { useUser, useFirebase } from '@/firebase';
import { getDashboardAnalytics, DashboardAnalyticsData, SubjectHighlight } from './actions';
import { Loader2, Flame, CheckCircle, Brain, AlertTriangle, Target, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PerformanceRadarChart } from '@/components/charts/PerformanceRadarChart';
import { EvolutionLineChart } from '@/components/charts/EvolutionLineChart';
import { FlashcardRetentionChart } from '@/components/charts/FlashcardRetentionChart';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function StatCard({ title, value, icon: Icon, footer, highlight }: { title: string; value: string; icon: React.ElementType, footer?: string, highlight?: boolean }) {
  return (
    <Card className={highlight ? 'bg-amber-50 border-amber-200' : ''}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {footer && <p className="text-xs text-muted-foreground">{footer}</p>}
      </CardContent>
    </Card>
  );
}


export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const [analytics, setAnalytics] = useState<DashboardAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      getDashboardAnalytics(user.uid)
        .then(data => {
          setAnalytics(data);
        })
        .catch(err => {
          console.error(err);
          setError('Não foi possível carregar seus dados de desempenho.');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [user]);

  const isLoadingData = isUserLoading || isLoading;

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-4">Analisando seu desempenho...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-destructive">
        <p>{error}</p>
      </div>
    );
  }

  if (!analytics || analytics.stats.general.totalQuestions === 0) {
    return (
        <div className="flex flex-col gap-8 items-center justify-center h-full text-center">
            <Target className="h-16 w-16 text-muted-foreground" />
            <h2 className="text-2xl font-bold">Comece sua Jornada de Aprovação!</h2>
            <p className="text-muted-foreground max-w-md">
                Ainda não temos dados para analisar. Comece a praticar para que nossa IA possa
                identificar seus pontos fortes e fracos.
            </p>
            <Button asChild size="lg">
                <Link href="/mentorlite/questions">
                    Resolver Questões Agora <ArrowRight className="ml-2" />
                </Link>
            </Button>
        </div>
    );
  }

  const { stats, highlights } = analytics;
  const globalAccuracy = stats.general.totalQuestions > 0 ? (stats.general.totalCorrect / stats.general.totalQuestions) * 100 : 0;
  
  const createSlug = (subject: string) => {
    return subject
        .toLowerCase()
        .replace(/ /g, '-')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
  };


  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard de Análise</h1>
        <p className="text-muted-foreground">Sua central de inteligência para a aprovação.</p>
      </header>

      {/* Bloco 1: KPIs Rápidos */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Streak de Estudos" value={`${stats.general.currentStreak} dias`} icon={Flame} />
        <StatCard title="Acerto Global" value={`${globalAccuracy.toFixed(1)}%`} footer={`${stats.general.totalCorrect} de ${stats.general.totalQuestions} questões`} icon={CheckCircle} />
        <StatCard title="Flashcards Revisados" value={Object.values(stats.flashcardsStats).reduce((acc, s) => acc + s.totalReviewed, 0).toLocaleString()} icon={Brain} />
        <StatCard title="Matéria Crítica" value={highlights.weakestSubject?.subject || 'N/A'} footer={highlights.weakestSubject ? `${highlights.weakestSubject.accuracy.toFixed(1)}% de acerto` : 'Continue praticando'} icon={AlertTriangle} highlight={!!highlights.weakestSubject} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {/* Bloco 2: Gráficos Principais */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Raio-X de Desempenho</CardTitle>
            <CardDescription>Suas 5 principais matérias em foco.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
             <PerformanceRadarChart data={stats.subjectsPerformance} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Sua Evolução</CardTitle>
                <CardDescription>Histórico de acertos nos últimos 7 dias.</CardDescription>
            </CardHeader>
            <CardContent className="pl-0">
                <EvolutionLineChart data={stats.evolutionHistory} />
            </CardContent>
        </Card>
      </div>

        {/* Bloco 3: Flashcards & Ação */}
        <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
                 <CardHeader>
                    <CardTitle>Retenção de Flashcards</CardTitle>
                    <CardDescription>Desempenho da sua memória por matéria.</CardDescription>
                </CardHeader>
                <CardContent>
                   <FlashcardRetentionChart data={stats.flashcardsStats} />
                </CardContent>
            </Card>
            
            {highlights.weakestSubject && (
                <Card className="flex flex-col items-center justify-center text-center bg-secondary">
                    <CardHeader>
                        <CardTitle className="text-primary">Plano de Ataque</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center gap-4">
                        <p>
                            Detectamos dificuldade em <strong className="text-primary">{highlights.weakestSubject.subject}</strong> com apenas <strong className="text-primary">{highlights.weakestSubject.accuracy.toFixed(1)}%</strong> de acerto.
                        </p>
                        <p className="text-sm text-muted-foreground">Sugerimos focar nisso hoje para transformar sua fraqueza em força.</p>
                         <Button asChild className="mt-4">
                            <Link href={`/mentorlite/questions?subject=${createSlug(highlights.weakestSubject.subject)}`}>
                                Treinar {highlights.weakestSubject.subject}
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    </div>
  );
}
