'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';

const chartData = [
  { subject: 'Português', correct: 85, total: 100 },
  { subject: 'Dir. Const.', correct: 72, total: 100 },
  { subject: 'Dir. Admin.', correct: 65, total: 100 },
  { subject: 'Informática', correct: 91, total: 100 },
  { subject: 'R. Lógico', correct: 58, total: 100 },
  { subject: 'Dir. Penal', correct: 78, total: 100 },
];

const chartConfig = {
  correct: {
    label: 'Acertos (%)',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Estatísticas de Desempenho</h1>
        <p className="text-muted-foreground">Analise seus pontos fortes e fracos por matéria.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-black/60 border border-white/10 rounded-3xl shadow-lg shadow-black/30 p-6">
            <CardHeader className="p-0 pb-6">
                <CardTitle className="text-xl">Desempenho por Matéria</CardTitle>
                <CardDescription>Percentual de acertos nas últimas questões respondidas.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <ChartContainer config={chartConfig} className="h-[350px] w-full">
                    <ResponsiveContainer>
                        <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: -10 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="subject"
                                tickLine={false}
                                tickMargin={10}
                                axisLine={false}
                                tickFormatter={(value) => value.slice(0, 10)}
                            />
                            <YAxis
                                tickFormatter={(value) => `${value}%`}
                            />
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent indicator="dot" />}
                            />
                            <Bar dataKey="correct" fill="var(--color-correct)" radius={4} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </div>

        <div className="space-y-6">
            <div className="bg-black/60 border border-white/10 rounded-3xl shadow-lg shadow-black/30 p-6">
                <CardHeader className="p-0 pb-4">
                    <CardTitle className="text-xl">Resumo Geral</CardTitle>
                </CardHeader>
                <CardContent className="p-0 space-y-4">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Questões Resolvidas</span>
                        <span className="font-bold">1.254</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Percentual de Acerto</span>
                        <span className="font-bold text-emerald-400">72.3%</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Simulados Feitos</span>
                        <span className="font-bold">14</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Flashcards Criados</span>
                        <span className="font-bold">89</span>
                    </div>
                </CardContent>
            </div>
             <div className="bg-black/60 border border-white/10 rounded-3xl shadow-lg shadow-black/30 p-6">
                <CardHeader className="p-0 pb-2">
                    <CardTitle className="text-xl">Melhor Matéria</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <p className="text-2xl font-bold">Informática</p>
                    <p className="text-sm text-muted-foreground">91% de acerto</p>
                </CardContent>
            </div>
             <div className="bg-black/60 border border-white/10 rounded-3xl shadow-lg shadow-black/30 p-6">
                <CardHeader className="p-0 pb-2">
                    <CardTitle className="text-xl">Pior Matéria</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <p className="text-2xl font-bold">Raciocínio Lógico</p>
                    <p className="text-sm text-muted-foreground">58% de acerto</p>
                </CardContent>
            </div>
        </div>
      </div>
    </div>
  );
}
