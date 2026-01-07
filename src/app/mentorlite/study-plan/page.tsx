'use client';

import { BrainCircuit } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function StudyPlanPage() {
  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Plano de Estudo Personalizado</h1>
        <p className="text-muted-foreground">
          Recurso de IA para otimizar sua preparação.
        </p>
      </header>
      <Card className="flex flex-1 items-center justify-center min-h-[50vh] border-dashed">
        <CardContent className="flex flex-col items-center gap-4 text-center p-6">
          <BrainCircuit className="h-16 w-16 text-muted-foreground" />
          <h3 className="text-2xl font-bold tracking-tight">
            Em Desenvolvimento
          </h3>
          <p className="text-muted-foreground max-w-md">
            Em breve, nossa inteligência artificial montará um plano de estudos completo e personalizado para você, analisando seu desempenho e objetivos.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
