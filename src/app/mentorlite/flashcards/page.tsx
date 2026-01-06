'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import './flashcard.css';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { useUser } from '@/firebase/auth/use-user';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Flashcard {
  id: string;
  front: string;
  back: string;
  subject: string;
}

const subjects = [
  'Direito Administrativo',
  'Direito Constitucional',
  'Direito Penal',
  'Português',
  'Informática',
  'Raciocínio Lógico',
  'Direito Civil',
  'Direito Processual Penal',
];

function FlashcardViewer({ flashcards }: { flashcards: Flashcard[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

   useEffect(() => {
    // Reset state when flashcards change
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [flashcards]);

  if (!flashcards || flashcards.length === 0) {
    return (
      <Card className="mt-6">
        <CardContent className="flex flex-col items-center justify-center h-40 p-6">
          <p className="text-muted-foreground">Nenhum flashcard encontrado para os critérios selecionados.</p>
        </CardContent>
      </Card>
    );
  }

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

  const card = flashcards[currentIndex];

  return (
     <div className="flex flex-col gap-8 items-center mt-6">
      <div className="w-full max-w-2xl" style={{ perspective: '1000px' }}>
        <div
          className={`flashcard-inner ${isFlipped ? 'is-flipped' : ''}`}
          onClick={handleFlip}
        >
          <Card className="flashcard-front">
            <CardContent className="flex flex-col items-center justify-center text-center p-6 min-h-[300px]">
              <p className="text-sm text-muted-foreground mb-4">{card.subject}</p>
              <p className="text-xl font-semibold">{card.front}</p>
            </CardContent>
          </Card>
          <Card className="flashcard-back bg-primary text-primary-foreground">
            <CardContent className="flex items-center justify-center text-center p-6 min-h-[300px]">
              <p className="text-lg">{card.back}</p>
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
  const [activeQuery, setActiveQuery] = useState<any>(null);

  const flashcardsQuery = useMemoFirebase(() => activeQuery, [activeQuery]);

  const { data: flashcards, isLoading } = useCollection<Flashcard>(flashcardsQuery);
  
  const allFlashcardsQuery = useMemoFirebase(() => (
    firestore && user ? query(collection(firestore, `users/${user.uid}/flashcards`)) : null
  ), [firestore, user]);

  const { data: allFlashcards, isLoading: isLoadingAll } = useCollection<Flashcard>(allFlashcardsQuery);

  const availableSubjects = useMemo(() => {
    if (!allFlashcards) return [];
    const uniqueSubjects = new Set(allFlashcards.map(fc => fc.subject));
    return Array.from(uniqueSubjects);
  }, [allFlashcards]);


  useEffect(() => {
    if (isLoading) {
      setView('loading');
    } else if (flashcards) {
      setView('studying');
    }
  }, [isLoading, flashcards]);

  const handleStudyClick = (subject: string) => {
    if (!firestore || !user) return;
    const newQuery = query(
      collection(firestore, `users/${user.uid}/flashcards`),
      where('Materia', '==', subject),
      orderBy('createdAt', 'desc')
    );
    setActiveQuery(newQuery);
  };
  
  const handleFilterSubmit = () => {
    if (!filterSubject || !firestore || !user) {
      return;
    }
     const newQuery = query(
      collection(firestore, `users/${user.uid}/flashcards`),
      where('subject', '==', filterSubject),
      orderBy('createdAt', 'desc')
    );
    setActiveQuery(newQuery);
  };
  
  if (isLoadingAll && view === 'initial') {
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
              Você ainda não importou nenhum flashcard.
            </p>
            <Button asChild variant="link">
              <a href="/mentorlite/management">Ir para o Gerenciador</a>
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
        <p className="text-muted-foreground">Filtre seus flashcards ou comece uma sessão de estudo rápido.</p>
      </header>

      {view !== 'studying' && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Filtrar Flashcards</CardTitle>
              <CardDescription>Selecione uma matéria para revisar.</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select value={filterSubject} onValueChange={setFilterSubject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Matéria" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSubjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleFilterSubmit} disabled={!filterSubject || view === 'loading'}>
                    {view === 'loading' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Estudar Matéria
                 </Button>
                </div>
            </CardContent>
          </Card>
          
           <Card>
            <CardHeader>
                <CardTitle>Estudo Rápido por Matéria</CardTitle>
                <CardDescription>Clique em uma matéria para iniciar uma sessão de estudo com todos os flashcards dela.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableSubjects.map(subject => (
                    <Button key={subject} variant="secondary" onClick={() => handleStudyClick(subject)}>
                        {subject}
                    </Button>
                ))}
            </CardContent>
        </Card>
        </>
      )}

      {view === 'loading' && (
         <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="ml-4 text-muted-foreground">Carregando flashcards...</p>
        </div>
      )}

      {view === 'studying' && flashcards && (
        <>
          <Button variant="outline" onClick={() => setView('initial')}>Voltar para Seleção</Button>
          <FlashcardViewer flashcards={flashcards} />
        </>
      )}

    </div>
  );
}
