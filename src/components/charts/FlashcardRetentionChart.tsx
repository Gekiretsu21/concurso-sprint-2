'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { UserDashboardStats } from '@/lib/types';


export function FlashcardRetentionChart({ data }: { data: UserDashboardStats['flashcardsStats'] }) {
    
    const chartData = Object.entries(data)
        .map(([subject, stats]) => ({
            subject,
            ...stats,
        }))
        .filter(item => item.totalReviewed > 0) // Mostrar apenas matérias com revisões
        .sort((a,b) => b.totalReviewed - a.totalReviewed) // Ordenar pela mais revisada
        .slice(0, 7); // Limitar a 7 matérias

    if (chartData.length === 0) {
        return <div className="flex h-[250px] w-full items-center justify-center text-sm text-muted-foreground">Sem dados de flashcards para exibir.</div>;
    }


  const chartConfig = {
    remembered: {
      label: 'Acertei',
      color: 'hsl(var(--chart-2))',
    },
    forgot: {
      label: 'Errei',
      color: 'hsl(var(--chart-5))',
    },
  };

  return (
     <div className="h-[250px] w-full">
        <ChartContainer config={chartConfig} className="h-full w-full">
            <BarChart accessibilityLayer data={chartData} layout="vertical" margin={{ left: 10, right: 10 }}>
                <CartesianGrid horizontal={false} />
                <YAxis
                    dataKey="subject"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    width={80}
                    style={{ fontSize: '12px' }}
                />
                <XAxis dataKey="totalReviewed" type="number" hide />
                <Tooltip cursor={false} content={<ChartTooltipContent />} />
                <Bar
                    dataKey="remembered"
                    stackId="a"
                    fill="var(--color-remembered)"
                    radius={[0, 4, 4, 0]}
                />
                <Bar
                    dataKey="forgot"
                    stackId="a"
                    fill="var(--color-forgot)"
                    radius={[4, 4, 0, 0]}
                />
            </BarChart>
        </ChartContainer>
    </div>
  );
}
