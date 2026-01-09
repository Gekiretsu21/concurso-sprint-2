'use client';

import { TrendingUp } from 'lucide-react';
import { PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, RadarChart } from 'recharts';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer } from '@/components/ui/chart';
import { UserDashboardStats } from '@/lib/types';

interface ChartData {
  subject: string;
  accuracy: number;
  fullMark: number;
}

export function PerformanceRadarChart({ data }: { data: UserDashboardStats['subjectsPerformance'] }) {
    
    // Processar os dados para o formato do gráfico
    const chartData: ChartData[] = Object.entries(data)
        .map(([subject, stats]) => ({
            subject,
            accuracy: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
            fullMark: 100, // O máximo é sempre 100%
        }))
        .sort((a, b) => b.accuracy - a.accuracy) // Ordenar para pegar as top 5
        .slice(0, 5);


    if (chartData.length === 0) {
        return <div className="flex h-[250px] w-full items-center justify-center text-sm text-muted-foreground">Sem dados de desempenho para exibir.</div>;
    }


  const chartConfig = {
    accuracy: {
      label: 'Acerto',
      color: 'hsl(var(--chart-1))',
    },
  };

  return (
    <div className="h-[250px] w-full">
      <ChartContainer
        config={chartConfig}
        className="mx-auto aspect-square h-full"
      >
        <RadarChart
          data={chartData}
          margin={{
            top: 10,
            right: 10,
            bottom: 10,
            left: 10,
          }}
        >
          <PolarGrid gridType="circle" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            dataKey="accuracy"
            fill="var(--color-accuracy)"
            fillOpacity={0.6}
            stroke="var(--color-accuracy)"
            dot={{
              r: 4,
              fillOpacity: 1,
            }}
          />
        </RadarChart>
      </ChartContainer>
    </div>
  );
}
