
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, ChevronLeft, ChevronRight, Loader2, RefreshCw, ThumbsDown, ThumbsUp, X } from 'lucide-react';
import { useState, useMemo, useEffect, useCallback } from 'react';
import './flashcard.css';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { useUser } from '@/firebase/auth/use-user';
import { collection, query, where, orderBy, getDocs, Query, QueryConstraint, and, documentId } from 'firebase/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { handleFlashcardResponse } from '@/firebase/actions';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface Flashcard {
  id: string;
  front: string;
  back: string;
  subject: string;
  topic: string;
  targetRole: string;
}

interface FlashcardProgress {
  id: string; // flashcardId
  status: 'learned' | 'reviewing';
  lastResult: 'correct' | 'incorrect';
}

function FlashcardViewer({ flashcards, onResponse }: { flashcards: Flashcard[], onResponse: (flashcard: Flashcard, result: 'correct' | 'incorrect') => void }) {
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

  const handleResponseClick = (result: 'correct' | 'incorrect') => {
    const card = flashcards[currentIndex];
    onResponse(card, result); // Pass the full flashcard object
    // Automatically move to the next card after responding, but only if it's not the last card
    if (currentIndex < flashcards.length -1) {
        setTimeout(() => handleNav('next'), 200);
    }
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
              <p className="text-sm text-muted-foreground mb-4">{card.subject} &gt; {card.topic}</p>
              <p className="text-xl font-semibold">{card.front}</p>
            </CardContent>
          </Card>
          <Card className="flashcard-back bg-primary text-primary-foreground" onClick={handleFlip}>
            <CardContent className="flex flex-col items-center justify-center text-center p-6 gap-6">
              <p className="text-lg">{card.back}</p>
              <div className="flex gap-4 mt-4">
                <Button variant="destructive" size="lg" onClick={(e) => { e.stopPropagation(); handleResponseClick('incorrect'); }}>
                    <ThumbsDown className="mr-2"/> Errei
                </Button>
                <Button variant="secondary" size="lg" onClick={(e) => { e.stopPropagation(); handleResponseClick('correct'); }}>
                    <ThumbsUp className="mr-2"/> Acertei
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex items-center justify-between w-full max-w-2xl">
        <Button variant="outline" size="icon" onClick={() => handleNav('prev')} disabled={flashcards.length <= 1}>
          <ChevronLeft />
        </Button>
        <div className="text-sm text-muted-foreground">
          {currentIndex + 1} / {flashcards.length}
        </div>
        <Button variant="outline" size="icon" onClick={() => handleNav('next')} disabled={flashcards.length <= 1}>
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
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterTopic, setFilterTopic] = useState<string>('all');
  const [filterTargetRole, setFilterTargetRole] = useState<string>('all');

  const [studyMode, setStudyMode] = useState<'all' | 'incorrect'>('all');
  const [activeFlashcards, setActiveFlashcards] = useState<Flashcard[]>([]);

  // Query for ALL flashcards, used to populate filters
  const allFlashcardsQuery = useMemoFirebase(() => (
    firestore ? query(collection(firestore, 'flashcards'), orderBy('subject')) : null
  ), [firestore]);

  const { data: allFlashcards, isLoading: isLoadingAll } = useCollection<Flashcard>(allFlashcardsQuery);

  const filterOptions = useMemo(() => {
    if (!allFlashcards) return { subjects: [], topics: [], targetRoles: [] };

    const subjects = new Set(allFlashcards.map(fc => fc.subject));
    let filteredBySubject = allFlashcards;

    if (filterSubject !== 'all') {
      filteredBySubject = allFlashcards.filter(fc => fc.subject === filterSubject);
    }
    
    const topics = new Set(filteredBySubject.map(fc => fc.topic));
    const targetRoles = new Set(filteredBySubject.map(fc => fc.targetRole));

    return {
      subjects: Array.from(subjects).sort(),
      topics: Array.from(topics).sort(),
      targetRoles: Array.from(targetRoles).sort(),
    };
  }, [allFlashcards, filterSubject]);

  // Reset dependent filters when the main filter changes
  useEffect(() => {
    setFilterTopic('all');
    setFilterTargetRole('all');
  }, [filterSubject]);


  const startStudySession = useCallback(async (mode: 'all' | 'incorrect') => {
    if (!firestore || !user) return;

    setView('loading');
    setStudyMode(mode);

    let flashcardsToStudy: Flashcard[] = [];

    if (mode === 'incorrect') {
      const responsesQuery = query(
        collection(firestore, `users/${user.uid}/flashcard_progress`),
        where('lastResult', '==', 'incorrect')
      );
      const responsesSnapshot = await getDocs(responsesQuery);
      const incorrectFlashcardIds = responsesSnapshot.docs.map(doc => doc.data().flashcardId);

      if (incorrectFlashcardIds.length === 0) {
        setActiveFlashcards([]);
        setView('studying');
        return;
      }
      
      const incorrectCardsQuery = query(collection(firestore, 'flashcards'), where(documentId(), 'in', incorrectFlashcardIds));
      const incorrectCardsSnapshot = await getDocs(incorrectCardsQuery);
      flashcardsToStudy = incorrectCardsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Flashcard));

    } else { // mode is 'all'
        const constraints: QueryConstraint[] = [];
        if (filterSubject !== 'all') {
            constraints.push(where('subject', '==', filterSubject));
        }
        if (filterTopic !== 'all') {
            constraints.push(where('topic', '==', filterTopic));
        }
        if (filterTargetRole !== 'all') {
            constraints.push(where('targetRole', '==', filterTargetRole));
        }
        
        const baseQuery = collection(firestore, 'flashcards');
        const finalQuery = constraints.length > 0 ? query(baseQuery, and(...constraints)) : baseQuery;

        const snapshot = await getDocs(finalQuery);
        flashcardsToStudy = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Flashcard));
    }

    setActiveFlashcards(flashcardsToStudy);
    setView('studying');

  }, [firestore, user, filterSubject, filterTopic, filterTargetRole]);


  const handleFlashcardResponseCallback = useCallback((flashcard: Flashcard, result: 'correct' | 'incorrect') => {
    if (!firestore || !user) return;
    handleFlashcardResponse(firestore, user.uid, flashcard, result);
    
    // Optimistically remove the card from the current session's active list
    setActiveFlashcards(prev => prev.filter(fc => fc.id !== flashcard.id));

  }, [firestore, user]);

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
                <CardTitle>Estudo Focado</CardTitle>
                <CardDescription>Filtre por matéria, assunto e cargo para aprender novos flashcards.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                         <Select value={filterSubject} onValueChange={setFilterSubject}>
                            <SelectTrigger>
                                <SelectValue placeholder="Matéria" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas as Matérias</SelectItem>
                                {filterOptions.subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={filterTopic} onValueChange={setFilterTopic} disabled={filterSubject === 'all' && filterOptions.topics.length === 0}>
                            <SelectTrigger>
                                <SelectValue placeholder="Assunto" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os Assuntos</SelectItem>
                                {filterOptions.topics.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                            </SelectContent>
                        </Select>
                         <Select value={filterTargetRole} onValueChange={setFilterTargetRole} disabled={filterSubject === 'all' && filterOptions.targetRoles.length === 0}>
                            <SelectTrigger>
                                <SelectValue placeholder="Cargo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os Cargos</SelectItem>
                                {filterOptions.targetRoles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <Button onClick={() => startStudySession('all')} disabled={view === 'loading'}>
                        {view === 'loading' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Iniciar Estudo
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                <CardTitle>Revisar Meus Erros</CardTitle>
                <CardDescription>Estude apenas os flashcards que você marcou como "Errei" anteriormente.</CardDescription>
                </CardHeader>
                <CardContent>
                <Button onClick={() => startStudySession('incorrect')} disabled={view === 'loading'}>
                        {view === 'loading' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4"/>}
                        Revisar Meus Erros
                </Button>
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
