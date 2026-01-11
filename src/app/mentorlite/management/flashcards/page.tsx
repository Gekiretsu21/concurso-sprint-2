'use client';

import { useMemo, useState } from 'react';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { useUser } from '@/firebase/auth/use-user';
import { collection } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { EditFlashcardDialog } from '@/components/EditFlashcardDialog';
import { Badge } from '@/components/ui/badge';

interface Flashcard {
  id: string;
  subject: string;
  topic: string;
  front: string;
  back: string;
  targetRole: string;
}

export default function ManagementFlashcardsPage() {
  const { firestore } = useFirebase();
  const { user } = useUser();

  const flashcardsQuery = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'flashcards') : null),
    [firestore, user]
  );
  const { data: allFlashcards, isLoading: isLoadingFlashcards } = useCollection<Flashcard>(flashcardsQuery);
  
  const flashcardsBySubject = useMemo(() => {
    if (!allFlashcards) return new Map<string, Flashcard[]>();

    const subjectMap = new Map<string, Flashcard[]>();
    allFlashcards.forEach(fc => {
        if (!subjectMap.has(fc.subject)) {
            subjectMap.set(fc.subject, []);
        }
        subjectMap.get(fc.subject)!.push(fc);
    });

    // Sort subjects alphabetically
    const sortedSubjectMap = new Map([...subjectMap.entries()].sort((a, b) => a[0].localeCompare(b[0])));
    
    return sortedSubjectMap;
  }, [allFlashcards]);

  const totalFlashcardsCount = useMemo(() => {
    return allFlashcards ? allFlashcards.length : 0;
  }, [allFlashcards]);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-center gap-4">
        <Button asChild variant="outline" size="icon">
          <Link href="/mentorlite/management">
            <ChevronLeft />
            <span className="sr-only">Voltar</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Banco de Flashcards</h1>
          <p className="text-muted-foreground">
            Total de {totalFlashcardsCount} flashcards. Clique em uma matéria para ver e editar.
          </p>
        </div>
      </header>
       {isLoadingFlashcards ? (
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : (
            <Accordion type="multiple" className="w-full space-y-2">
              {Array.from(flashcardsBySubject.entries()).map(([subject, flashcards]) => (
                <Card key={subject}>
                    <AccordionItem value={subject} className="border-b-0">
                        <AccordionTrigger className="p-4 hover:no-underline">
                            <div className="flex items-center justify-between w-full">
                                <h3 className="text-lg font-semibold">{subject}</h3>
                                <Badge variant="secondary">{flashcards.length} flashcards</Badge>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                           <div className="border-t">
                             <div className="space-y-2 p-4">
                                {flashcards.sort((a,b) => a.front.localeCompare(b.front)).map(fc => (
                                    <div key={fc.id} className="flex items-center justify-between p-3 rounded-md border bg-muted/30">
                                        <div className="flex-1 pr-4">
                                            <p className="font-medium text-sm truncate" title={fc.front}>{fc.front}</p>
                                            <p className="text-xs text-muted-foreground">{fc.topic} • {fc.targetRole}</p>
                                        </div>
                                        <EditFlashcardDialog flashcard={fc} />
                                    </div>
                                ))}
                             </div>
                           </div>
                        </AccordionContent>
                    </AccordionItem>
                </Card>
              ))}
            </Accordion>
        )}
    </div>
  );
}
