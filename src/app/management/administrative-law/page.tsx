'use client';

import { useMemo } from 'react';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
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

interface Question {
  id: string;
  Materia: string;
  Ano: string;
  Assunto: string;
  Cargo: string;
  Enunciado: string;
  a?: string;
  b?: string;
  c?: string;
  d?: string;
  e?: string;
  correctAnswer: string;
}

// Helper function to format the question text
function formatEnunciado(text: string) {
  if (!text) return '';
  // Regex to find roman numerals (I to X) followed by a hyphen or space, at the beginning of a word.
  // This will add a line break before each item in a list.
  return text.replace(/\b(II|III|IV|V|VI|VII|VIII|IX|X)[\s-]/g, '\n$&');
}

export default function AdministrativeLawPage() {
  const { firestore } = useFirebase();

  const questionsQuery = useMemoFirebase(
    () =>
      firestore
        ? query(collection(firestore, 'questoes'), where('Materia', '==', 'Direito Administrativo'))
        : null,
    [firestore]
  );

  const { data: adminQuestions, isLoading: isLoadingQuestions } =
    useCollection<Question>(questionsQuery);
  
  const alternativesKeys: (keyof Question)[] = ['a', 'b', 'c', 'd', 'e'];

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
      ) : adminQuestions && adminQuestions.length > 0 ? (
        <div className="space-y-6">
          {adminQuestions.map((q, index) => {
            return (
              <Card key={q.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Questão {index + 1}</CardTitle>
                    <div className="flex items-center gap-4">
                        <Badge variant="secondary">{q.Cargo}</Badge>
                        <Badge variant="outline">{q.Ano}</Badge>
                    </div>
                  </div>
                  <CardDescription className="pt-4 text-base text-foreground whitespace-pre-line">
                    ({q.Assunto}) {formatEnunciado(q.Enunciado)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {alternativesKeys.map((key, optIndex) => {
                       const alternativeText = q[key];
                       if (!alternativeText) return null;

                       const isCorrect = key.toString() === q.correctAnswer;
                       
                       return (
                          <div
                            key={optIndex}
                            className={cn(
                              'flex items-start space-x-3 p-3 rounded-lg border transition-colors',
                              isCorrect
                                ? 'bg-emerald-100/60 border-emerald-400 text-emerald-900'
                                : 'bg-card'
                            )}
                          >
                            <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full border bg-background font-bold text-sm">
                                {String.fromCharCode(65 + optIndex)}
                            </div>
                            <div className="flex-1 pt-0.5">
                              {alternativeText}
                            </div>
                          </div>
                       )
                    })}
                  </div>
                </CardContent>
              </Card>
            )
          })}
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
