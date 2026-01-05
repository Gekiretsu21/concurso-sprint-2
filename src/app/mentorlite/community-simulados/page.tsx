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
import { collection, query } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

interface CommunitySimulatedExam {
  id: string;
  name: string;
  questionCount: number;
  userId: string;
  originalExamId: string;
}

export default function CommunitySimuladosPage() {
  const { firestore } = useFirebase();

  const communityExamsQuery = useMemoFirebase(
    () =>
      firestore
        ? query(collection(firestore, 'communitySimulados'))
        : null,
    [firestore]
  );

  const { data: exams, isLoading } =
    useCollection<CommunitySimulatedExam>(communityExamsQuery);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Simulados da Comunidade</h1>
        <p className="text-muted-foreground">
          Veja os simulados mais recentes criados por outros concurseiros.
        </p>
      </header>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight">Últimos Simulados Criados</h2>
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
                   <CardDescription>Criado por: {exam.userId.substring(0,6)}...</CardDescription>
                </CardHeader>
                <CardContent>
                   <p className="text-sm text-muted-foreground">
                    {exam.questionCount} questões
                  </p>
                   <Button asChild className="mt-4 w-full">
                      {/* Note: This link will still point to the user's private exam copy for now. */}
                      <Link href={`/mentorlite/simulated-exams/${exam.originalExamId}?userId=${exam.userId}`}>
                        Iniciar Simulado
                      </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          !isLoading && (
            <Card className="flex flex-col items-center justify-center h-40 border-dashed">
              <CardContent className="text-center">
                <p className="text-muted-foreground">
                  Nenhum simulado na comunidade ainda.
                </p>
                <Button variant="link" asChild>
                  <Link href="/mentorlite/management">
                    Seja o primeiro a criar um!
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )
        )}
      </div>
    </div>
  );
}
