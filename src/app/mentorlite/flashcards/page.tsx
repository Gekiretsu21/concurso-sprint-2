'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useState } from 'react';
import './flashcard.css';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { useUser } from '@/firebase/auth/use-user';
import { collection, query, orderBy } from 'firebase/firestore';
import Link from 'next/link';

interface Flashcard {
  id: string;
  front: string;
  back: string;
  subject: string;
}

export default function FlashcardsPage() {
  const { firestore } = useFirebase();
  const { user } = useUser();

  const flashcardsQuery = useMemoFirebase(
    () =>
      firestore && user
        ? query(
            collection(firestore, `users/${user.uid}/flashcards`),
            orderBy('createdAt', 'desc')
          )
        : null,
    [firestore, user]
  );

  const { data: flashcards, isLoading } =
    useCollection<Flashcard>(flashcardsQuery);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNav = (direction: 'prev' | 'next') => {
    if (!flashcards) return;
    setIsFlipped(false);
    setTimeout(() => {
      if (direction === 'prev') {
        setCurrentIndex(
          prev => (prev - 1 + flashcards.length) % flashcards.length
        );
      } else {
        setCurrentIndex(prev => (prev + 1) % flashcards.length);
      }
    }, 150); // wait for flip back animation
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!flashcards || flashcards.length === 0) {
    return (
      <div className="flex flex-col gap-8 items-center text-center">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Flashcards</h1>
          <p className="text-muted-foreground">
            Nenhum flashcard encontrado.
          </p>
        </header>
        <Card className="flex flex-col items-center justify-center h-40 w-full max-w-2xl border-dashed">
          <CardContent className="text-center p-6">
            <p className="text-muted-foreground mb-4">
              Você ainda não importou nenhum flashcard.
            </p>
            <Button asChild>
              <Link href="/mentorlite/management">Importar Flashcards</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const card = flashcards[currentIndex];

  return (
    <div className="flex flex-col gap-8 items-center">
      <header className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Flashcards</h1>
        <p className="text-muted-foreground">
          Revise os principais conceitos de forma rápida e eficiente.
        </p>
      </header>

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
