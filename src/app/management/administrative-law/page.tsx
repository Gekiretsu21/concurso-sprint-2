'use client';

import { useMemo } from 'react';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

export default function AdministrativeLawPage() {
  const { firestore } = useFirebase();

  const questionsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'questoes') : null),
    [firestore]
  );
  const { data: allQuestions, isLoading: isLoadingQuestions } =
    useCollection(questionsQuery);

  const adminQuestions = useMemo(() => {
    if (!allQuestions) return [];
    return allQuestions.filter(q => q.subject === 'Direito Administrativo');
  }, [allQuestions]);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-center gap-4">
        <Button asChild variant="outline" size="icon">
          <Link href="/management">
            <ChevronLeft />
            <span className="sr-only">Voltar</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Questões de Direito Administrativo
          </h1>
          <p className="text-muted-foreground">
            Visualize todas as questões cadastradas para esta matéria.
          </p>
        </div>
      </header>

      {isLoadingQuestions ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : adminQuestions.length > 0 ? (
        <div className="space-y-6">
          {adminQuestions.map((q, index) => (
            <Card key={q.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Questão {index + 1}</CardTitle>
                  <Badge variant="outline">{q.difficulty}</Badge>
                </div>
                <CardDescription className="pt-4 text-base text-foreground">
                  {q.text}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {q.options.map((opt: string, optIndex: number) => (
                    <div
                      key={optIndex}
                      className={cn(
                        'flex items-start space-x-3 p-3 rounded-lg border transition-colors',
                        opt === q.correctAnswer
                          ? 'bg-emerald-100/60 border-emerald-400 text-emerald-900'
                          : 'bg-card'
                      )}
                    >
                      <div className="flex-1">
                        <span className="font-bold mr-2">{String.fromCharCode(65 + optIndex)}.</span>
                        {opt}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 rounded-lg border border-dashed">
          <p className="text-muted-foreground">
            Nenhuma questão de Direito Administrativo encontrada.
          </p>
          <Button variant="link" asChild>
            <Link href="/management">Voltar ao Gerenciamento</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
