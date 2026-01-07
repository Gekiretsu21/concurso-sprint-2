
'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useCollection, useFirebase, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Check, Loader2, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CommunitySimulatedExam {
  id: string;
  name: string;
  questionCount: number;
  userId: string;
  originalExamId: string;
}

interface ExamResult {
    id: string;
    examId: string;
    score: number;
    completedAt: any;
}


export default function CommunitySimuladosPage() {
  const { firestore } = useFirebase();
  const { user } = useUser();

  const communityExamsQuery = useMemoFirebase(
    () =>
      firestore
        ? query(collection(firestore, 'communitySimulados'), orderBy('createdAt', 'desc'))
        : null,
    [firestore]
  );
  
  const resultsQuery = useMemoFirebase(
      () => 
        firestore && user 
            ? collection(firestore, `users/${user.uid}/previousExamResults`)
            : null,
      [firestore, user]
  )

  const { data: exams, isLoading: isLoadingExams } =
    useCollection<CommunitySimulatedExam>(communityExamsQuery);
    
  const { data: results, isLoading: isLoadingResults } = useCollection<ExamResult>(resultsQuery);

  const resultsMap = useMemo(() => {
      if (!results) return new Map<string, ExamResult>();
      // Use examId as the key for the map, not the document's own id
      return new Map(results.map(r => [r.examId, r]));
  }, [results]);

  const isLoading = isLoadingExams || isLoadingResults;

  const handleRedo = (event: React.MouseEvent, examId: string) => {
    event.preventDefault();
    window.location.href = `/mentorlite/simulated-exams/${examId}?from=community-simulados`;
  };


  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Simulados da Comunidade</h1>
        <p className="text-muted-foreground">
          Veja os simulados mais recentes criados por outros concurseiros.
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
            {exams.map(exam => {
              const result = resultsMap.get(exam.id);
              const isCompleted = !!result;

              return (
                <Card key={exam.id} className={cn("flex flex-col", isCompleted && "bg-muted/40")}>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>{exam.name}</CardTitle>
                            {isCompleted && (
                                <Badge variant="secondary" className="flex items-center gap-1">
                                    <Check className="h-4 w-4"/>
                                    Resolvido
                                </Badge>
                            )}
                        </div>
                        <CardDescription>Criado por: {exam.userId.substring(0,6)}...</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-2">
                        <p className="text-sm text-muted-foreground">
                            {exam.questionCount} questões
                        </p>
                    </CardContent>
                    <CardFooter>
                       {isCompleted ? (
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                               <Button asChild className="h-auto whitespace-normal">
                                  <Link href={`/mentorlite/simulated-exams/results/${exam.id}?examName=${encodeURIComponent(exam.name)}`}>
                                    Conferir Desempenho
                                  </Link>
                               </Button>
                               <Button variant="outline" onClick={(e) => handleRedo(e, exam.id)} className="h-auto whitespace-normal">
                                    <RefreshCw className="mr-2 h-4 w-4"/>
                                    Fazer Novamente
                               </Button>
                           </div>
                       ) : (
                           <Button asChild className="w-full">
                              <Link href={`/mentorlite/simulated-exams/${exam.id}?from=community-simulados`}>
                                Iniciar Simulado
                              </Link>
                          </Button>
                       )}
                    </CardFooter>
                </Card>
              )
            })}
          </div>
        ) : (
          !isLoading && (
            <Card className="flex flex-col items-center justify-center h-40 border-dashed">
              <CardContent className="text-center p-6">
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
