'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, ChevronLeft, ChevronRight, Loader2, RefreshCw, ThumbsDown, ThumbsUp, X } from 'lucide-react';
import { useState, useMemo, useEffect, useCallback } from 'react';
import './flashcard.css';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { useUser } from '@/firebase/auth/use-user';
import { collection, query, where, orderBy, getDocs, Query } from 'firebase/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { handleFlashcardResponse } from '@/firebase/actions';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface Flashcard {
  id: string;
  front: string;
  back: string;
  subject: string;
}

interface FlashcardResponse {
  id: string; // flashcardId
  status: 'correct' | 'incorrect';
}

function FlashcardViewer({ flashcards, onResponse }: { flashcards: Flashcard[], onResponse: (flashcardId: string, status: 'correct' | 'incorrect') => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    // Reset state when flashcards change, e.g. when a new filter is applied
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [flashcards]);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNav = (direction: 'prev' | 'next') => {
    setIsFlipped(false);
    setTimeout(() => {
      if (direction === 'prev') {
        setCurrentIndex(prev => (prev - 1 + flashcards.length) % flashcards.length);
      } else {
        setCurrentIndex(prev => (prev + 1) % flashcards.length);
      }
    }, 150); // wait for flip back animation
  };

  const handleResponseClick = (status: 'correct' | 'incorrect') => {
    const card = flashcards[currentIndex];
    onResponse(card.id, status);
    // Automatically move to the next card after responding
    setTimeout(() => handleNav('next'), 200);
  }

  if (!flashcards || flashcards.length === 0) {
    return (
      <Card className="mt-6">
        <CardContent className="flex flex-col items-center justify-center h-40 p-6">
          <p className="text-muted-foreground">Nenhum flashcard encontrado para os critérios selecionados.</p>
        </CardContent>
      </Card>
    );
  }

  const card = flashcards[currentIndex];

  return (
     <div className="flex flex-col gap-8 items-center mt-6">
      <div className="w-full max-w-2xl" style={{ perspective: '1000px' }}>
        <div className={`flashcard-inner ${isFlipped ? 'is-flipped' : ''}`}>
          <Card className="flashcard-front" onClick={handleFlip}>
            <CardContent className="flex flex-col items-center justify-center text-center p-6">
              <p className="text-sm text-muted-foreground mb-4">{card.subject}</p>
              <p className="text-xl font-semibold">{card.front}</p>
            </CardContent>
          </Card>
          <Card className="flashcard-back bg-primary text-primary-foreground">
            <CardContent className="flex flex-col items-center justify-center text-center p-6 gap-6">
              <p className="text-lg">{card.back}</p>
              <div className="flex gap-4 mt-4">
                <Button variant="destructive" size="lg" onClick={() => handleResponseClick('incorrect')}>
                    <ThumbsDown className="mr-2"/> Errei
                </Button>
                <Button variant="secondary" size="lg" onClick={() => handleResponseClick('correct')}>
                    <ThumbsUp className="mr-2"/> Acertei
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex items-center justify-between w-full max-w-2xl">
        <Button variant="outline" size="icon" onClick={() => handleNav('prev')}>
          <ChevronLeft />
        </Button>
        <div className="text-sm text-muted-foreground">
          {currentIndex + 1} / {flashcards.length}
        </div>
        <Button variant="outline" size="icon" onClick={() => handleNav('next')}>
          <ChevronRight />
        </Button>
      </div>
     </div>
  );
}

export default function FlashcardsPage() {
  const { firestore } = useFirebase();
  const { user } = useUser();
  
  const [view, setView] = useState<'initial' | 'loading' | 'studying'>('initial');
  const [filterSubject, setFilterSubject] = useState<string>('');
  const [studyMode, setStudyMode] = useState<'all' | 'incorrect'>('all');
  const [activeFlashcards, setActiveFlashcards] = useState<Flashcard[]>([]);

  // Query for ALL flashcards, used to populate subject filters
  const allFlashcardsQuery = useMemoFirebase(() => (
    firestore ? query(collection(firestore, 'flashcards'), orderBy('subject')) : null
  ), [firestore]);

  const { data: allFlashcards, isLoading: isLoadingAll } = useCollection<Flashcard>(allFlashcardsQuery);

  const availableSubjects = useMemo(() => {
    if (!allFlashcards) return [];
    const uniqueSubjects = new Set(allFlashcards.map(fc => fc.subject));
    return Array.from(uniqueSubjects);
  }, [allFlashcards]);

  const startStudySession = useCallback(async (subject: string, mode: 'all' | 'incorrect') => {
    if (!firestore || !user) return;

    setView('loading');
    setStudyMode(mode);

    let flashcardsToStudy: Flashcard[] = [];

    if (mode === 'incorrect') {
      const responsesQuery = query(
        collection(firestore, `users/${user.uid}/flashcardResponses`),
        where('status', '==', 'incorrect')
      );
      const responsesSnapshot = await getDocs(responsesQuery);
      const incorrectFlashcardIds = responsesSnapshot.docs.map(doc => doc.data().flashcardId);

      if (incorrectFlashcardIds.length === 0) {
        setActiveFlashcards([]);
        setView('studying');
        return;
      }
      
      // Filter allFlashcards by the incorrect IDs
      flashcardsToStudy = allFlashcards?.filter(fc => incorrectFlashcardIds.includes(fc.id)) || [];

    } else { // mode is 'all'
       let baseQuery: Query = collection(firestore, 'flashcards');
        if (subject) {
            baseQuery = query(baseQuery, where('subject', '==', subject));
        }
        const snapshot = await getDocs(baseQuery);
        flashcardsToStudy = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Flashcard));
    }

    setActiveFlashcards(flashcardsToStudy);
    setView('studying');

  }, [firestore, user, allFlashcards]);


  const handleFlashcardResponseCallback = useCallback((flashcardId: string, status: 'correct' | 'incorrect') => {
    if (!firestore || !user) return;
    handleFlashcardResponse(firestore, user.uid, flashcardId, status);
    
    // If we're in 'incorrect' mode and the answer is correct, remove it from the active session
    if (studyMode === 'incorrect' && status === 'correct') {
        setActiveFlashcards(prev => prev.filter(fc => fc.id !== flashcardId));
    }
  }, [firestore, user, studyMode]);

  if (isLoadingAll) {
    return (
       <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!allFlashcards || allFlashcards.length === 0) {
     return (
      <div className="flex flex-col gap-8 items-center text-center">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Flashcards</h1>
        </header>
        <Card className="flex flex-col items-center justify-center h-40 w-full max-w-2xl border-dashed">
          <CardContent className="text-center p-6">
            <p className="text-muted-foreground mb-4">
              Nenhum flashcard foi importado na plataforma ainda.
            </p>
            <Button asChild variant="link">
              <Link href="/mentorlite/management">Ir para o Gerenciador</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col gap-8">
       <header>
        <h1 className="text-3xl font-bold tracking-tight">Flashcards</h1>
        <p className="text-muted-foreground">Filtre seus flashcards ou comece uma sessão de estudo.</p>
      </header>

      {view !== 'studying' && (
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Revisar Flashcards Errados</CardTitle>
              <CardDescription>Estude apenas os flashcards que você marcou como "Errei" anteriormente.</CardDescription>
            </CardHeader>
            <CardContent>
               <Button onClick={() => startStudySession('', 'incorrect')} disabled={view === 'loading'}>
                    {view === 'loading' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4"/>}
                    Revisar Meus Erros
               </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Filtrar por Matéria</CardTitle>
              <CardDescription>Selecione uma matéria para revisar todos os flashcards dela.</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select value={filterSubject} onValueChange={setFilterSubject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma Matéria" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSubjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button onClick={() => startStudySession(filterSubject, 'all')} disabled={!filterSubject || view === 'loading'}>
                    {view === 'loading' && filterSubject ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Estudar Matéria
                 </Button>
                </div>
            </CardContent>
          </Card>
          
           <Card>
            <CardHeader>
                <CardTitle>Estudo Rápido por Matéria</CardTitle>
                <CardDescription>Clique em uma matéria para iniciar uma sessão com todos os flashcards dela.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableSubjects.map(subject => (
                    <Button key={subject} variant="secondary" onClick={() => startStudySession(subject, 'all')}>
                        {subject}
                    </Button>
                ))}
            </CardContent>
        </Card>
        </div>
      )}

      {view === 'loading' && (
         <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="ml-4 text-muted-foreground">Carregando flashcards...</p>
        </div>
      )}

      {view === 'studying' && (
        <>
          <Button variant="outline" onClick={() => setView('initial')} className="w-fit">
            <ChevronLeft className="mr-2 h-4 w-4"/>
            Voltar para Seleção
          </Button>
          <FlashcardViewer flashcards={activeFlashcards} onResponse={handleFlashcardResponseCallback} />
        </>
      )}

    </div>
  );
}

    