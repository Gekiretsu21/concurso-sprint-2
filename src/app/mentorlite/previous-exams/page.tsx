'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { useUser } from '@/firebase/auth/use-user';
import { collection, query } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

interface PreviousExam {
  id: string;
  name: string;
  questionCount: number;
}

export default function PreviousExamsPage() {
  const { firestore } = useFirebase();

  // This query now looks for exams in the top-level 'previousExams' collection.
  const examsQuery = useMemoFirebase(
    () =>
      firestore
        ? query(collection(firestore, 'previousExams'))
        : null,
    [firestore]
  );

  const { data: exams, isLoading } =
    useCollection<PreviousExam>(examsQuery);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Provas Anteriores</h1>
        <p className="text-muted-foreground">
          Acesse os simulados que você importou de provas anteriores.
        </p>
      </header>

      <div className="space-y-6">
        {isLoading && (
          <div className="flex items-center justify-center h-40 rounded-lg border border-dashed">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        {!isLoading && exams && exams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.map(exam => (
              <Card key={exam.id}>
                <CardHeader>
                  <CardTitle>{exam.name}</CardTitle>
                </CardHeader>
                <CardContent>
                   <p className="text-sm text-muted-foreground">
                    {exam.questionCount} questões
                  </p>
                   <Button asChild className="mt-4 w-full">
                      <Link href={`/mentorlite/simulated-exams/${exam.id}?from=previous-exams`}>
                        Iniciar Prova
                      </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          !isLoading && (
            <Card className="flex flex-col items-center justify-center h-40 border-dashed">
              <CardContent className="text-center p-6">
                <p className="text-muted-foreground">
                  Aguarde, em breve provas anteriores aparecerão aqui!
                </p>
              </CardContent>
            </Card>
          )
        )}
      </div>
    </div>
  );
}
