'use client';

import { CartesianGrid, Line, LineChart, XAxis, YAxis, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { UserDashboardStats } from '@/lib/types';


export function EvolutionLineChart({ data }: { data: UserDashboardStats['evolutionHistory'] }) {

  if (!data || data.length === 0) {
     return <div className="flex h-[250px] w-full items-center justify-center text-sm text-muted-foreground">Sem histórico de evolução para exibir.</div>;
  }

  const chartConfig = {
    accuracy: {
      label: 'Acerto (%)',
      color: 'hsl(var(--chart-2))',
    },
  };
  
  return (
    <div className="h-[250px] w-full">
        <ChartContainer config={chartConfig} className="h-full w-full">
            <LineChart
                accessibilityLayer
                data={data}
                margin={{
                top: 5,
                right: 20,
                left: 0,
                bottom: 5,
                }}
            >
                <CartesianGrid vertical={false} />
                <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={value => value.slice(0, 5)}
                    style={{ fontSize: '12px' }}
                />
                 <YAxis
                    domain={[0, 100]}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => `${value}%`}
                    style={{ fontSize: '12px' }}
                 />
                <Tooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="line" />}
                />
                <Line
                    dataKey="accuracy"
                    type="natural"
                    stroke="var(--color-accuracy)"
                    strokeWidth={2}
                    dot={true}
                />
            </LineChart>
        </ChartContainer>
    </div>
  );
}
