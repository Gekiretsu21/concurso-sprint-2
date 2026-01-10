'use client';

import { useMemo } from 'react';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { useUser } from '@/firebase/auth/use-user';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Crown, Layers, Loader2, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface ExclusiveSimulado {
  id: string;
  name: string;
  questionCount: number;
}

interface ExclusiveFlashcard {
  id: string;
  subject: string;
  count: number;
}

function ExclusiveSimuladosList() {
  const { firestore } = useFirebase();
  const simuladosQuery = useMemoFirebase(
    () =>
      firestore
        ? query(
            collection(firestore, 'communitySimulados'),
            where('accessTier', '==', 'plus')
          )
        : null,
    [firestore]
  );
  const { data: simulados, isLoading } = useCollection<ExclusiveSimulado>(simuladosQuery);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-24">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {simulados && simulados.length > 0 ? (
        simulados.map(simulado => (
          <Card key={simulado.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold">{simulado.name}</p>
                <p className="text-sm text-muted-foreground">{simulado.questionCount} questões</p>
              </div>
              <Button asChild>
                <Link href={`/mentorlite/simulated-exams/${simulado.id}?from=community-simulados`}>
                  Iniciar
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))
      ) : (
        <p className="text-sm text-muted-foreground text-center">Nenhum simulado exclusivo disponível no momento.</p>
      )}
    </div>
  );
}

function ExclusiveFlashcardsList() {
    const { firestore } = useFirebase();
    const flashcardsQuery = useMemoFirebase(() => 
        firestore 
            ? query(collection(firestore, 'flashcards'), where('accessTier', '==', 'plus'))
            : null
    , [firestore]);

    const { data: flashcards, isLoading } = useCollection<{subject: string}>(flashcardsQuery);
    
    const flashcardsBySubject = useMemo(() => {
        if (!flashcards) return [];
        const subjectMap = new Map<string, number>();
        flashcards.forEach(fc => {
            subjectMap.set(fc.subject, (subjectMap.get(fc.subject) || 0) + 1);
        });
        return Array.from(subjectMap, ([subject, count]) => ({ subject, count }))
               .sort((a,b) => a.subject.localeCompare(b.subject));
    }, [flashcards]);

    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-24">
          <Loader2 className="animate-spin" />
        </div>
      );
    }
  
    return (
      <div className="space-y-4">
        {flashcardsBySubject.length > 0 ? (
          flashcardsBySubject.map(item => (
            <Card key={item.subject}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{item.subject}</p>
                  <p className="text-sm text-muted-foreground">{item.count} flashcards</p>
                </div>
                 <Button asChild>
                    <Link href={`/mentorlite/flashcards?subject=${encodeURIComponent(item.subject)}&tier=plus`}>
                        Estudar
                    </Link>
                </Button>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center">Nenhum flashcard exclusivo disponível no momento.</p>
        )}
      </div>
    );
}


export default function ArsenalVipPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-center gap-4">
        <Crown className="h-8 w-8 text-amber-500" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Arsenal VIP</h1>
          <p className="text-muted-foreground">
            Acesso exclusivo ao conteúdo de alta performance para assinantes MentorIA+.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="text-primary" />
              Simulados Exclusivos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ExclusiveSimuladosList />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="text-primary" />
              Flashcards de Alto Nível
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ExclusiveFlashcardsList />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
