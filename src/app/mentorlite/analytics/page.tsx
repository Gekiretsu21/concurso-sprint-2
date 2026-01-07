'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import { useEffect, useState } from 'react';
import { useUser } from '@/firebase';
import { getUserAnalytics } from '@/app/actions/get-user-analytics';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

interface SubjectPerformance {
  subject: string;
  accuracy: number;
}

interface UserAnalytics {
  totalAnswered: number;
  overallAccuracy: number;
  simulatedExamsFinished: number;
  flashcardsTotal: number;
  bestSubject?: { name: string; accuracy: number };
  worstSubject?: { name: string; accuracy: number };
  subjectPerformance: SubjectPerformance[];
}

const chartConfig = {
  accuracy: {
    label: 'Acertos (%)',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

function AnalyticsSkeleton() {
  return (
    <div className="flex flex-col gap-8">
       <header>
        <h1 className="text-3xl font-bold tracking-tight">Estatísticas de Desempenho</h1>
        <p className="text-muted-foreground">Analise seus pontos fortes e fracos por matéria.</p>
      </header>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Desempenho por Matéria</CardTitle>
                <CardDescription>Percentual de acertos nas últimas questões respondidas.</CardDescription>
            </CardHeader>
            <CardContent>
                <Skeleton className="h-[350px] w-full" />
            </CardContent>
        </Card>

        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Resumo Geral</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex justify-between">
                            <Skeleton className="h-5 w-2/3" />
                            <Skeleton className="h-5 w-1/4" />
                        </div>
                    ))}
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Melhor Matéria</CardTitle>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-7 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Pior Matéria</CardTitle>
                </CardHeader>
                <CardContent>
                     <Skeleton className="h-7 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  const { user, isUserLoading } = useUser();
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isUserLoading) {
      return;
    }
    if (!user) {
      setIsLoading(false);
      setError('Você precisa estar logado para ver suas estatísticas.');
      return;
    }

    async function fetchAnalytics() {
      try {
        const data = await getUserAnalytics(user!.uid);
        setAnalytics(data);
      } catch (err) {
        setError('Não foi possível carregar as estatísticas.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAnalytics();
  }, [user, isUserLoading]);
  
  if (isLoading || isUserLoading) {
    return <AnalyticsSkeleton />;
  }

  if (error) {
    return (
        <Card className="flex flex-col items-center justify-center h-64 border-dashed">
          <CardContent className="text-center p-6">
            <p className="text-destructive">{error}</p>
             <Link href="/mentorlite" className="mt-4 inline-flex items-center text-sm font-medium text-primary hover:underline">
                Voltar para o Dashboard
            </Link>
          </CardContent>
        </Card>
    );
  }
  
  if (!analytics || analytics.totalAnswered === 0) {
      return (
        <div className="flex flex-col gap-8">
            <header>
                <h1 className="text-3xl font-bold tracking-tight">Estatísticas de Desempenho</h1>
                <p className="text-muted-foreground">Analise seus pontos fortes e fracos por matéria.</p>
            </header>
            <Card className="flex flex-col items-center justify-center h-64 border-dashed">
            <CardContent className="text-center p-6">
                <p className="text-muted-foreground">
                Você ainda não respondeu nenhuma questão. Comece a praticar para ver suas estatísticas!
                </p>
                 <Link href="/mentorlite/questions" className="mt-4 inline-flex items-center text-sm font-medium text-primary hover:underline">
                    Ir para o Banco de Questões
                </Link>
            </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Estatísticas de Desempenho</h1>
        <p className="text-muted-foreground">Analise seus pontos fortes e fracos por matéria.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Desempenho por Matéria</CardTitle>
                <CardDescription>Percentual de acertos nas últimas questões respondidas.</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-[350px] w-full">
                    <ResponsiveContainer>
                        <BarChart data={analytics.subjectPerformance} margin={{ top: 20, right: 20, bottom: 20, left: -10 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="subject"
                                tickLine={false}
                                tickMargin={10}
                                axisLine={false}
                                tickFormatter={(value) => value.slice(0, 10)}
                            />
                            <YAxis
                                domain={[0, 100]}
                                tickFormatter={(value) => `${value}%`}
                            />
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent indicator="dot" />}
                            />
                            <Bar dataKey="accuracy" fill="var(--color-accuracy)" radius={4} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </Card>

        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Resumo Geral</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Questões Resolvidas</span>
                        <span className="font-bold">{analytics.totalAnswered}</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Percentual de Acerto</span>
                        <span className="font-bold text-emerald-600">{analytics.overallAccuracy.toFixed(1)}%</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Simulados Feitos</span>
                        <span className="font-bold">{analytics.simulatedExamsFinished}</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Flashcards Revisados</span>
                        <span className="font-bold">{analytics.flashcardsTotal}</span>
                    </div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Melhor Matéria</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold">{analytics.bestSubject?.name || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">{analytics.bestSubject ? `${analytics.bestSubject.accuracy.toFixed(1)}% de acerto` : 'Aguardando dados'}</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Pior Matéria</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold">{analytics.worstSubject?.name || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">{analytics.worstSubject ? `${analytics.worstSubject.accuracy.toFixed(1)}% de acerto` : 'Aguardando dados'}</p>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
