'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import './flashcard.css';

const flashcards = [
  { id: 1, front: 'Quais são os 5 princípios da Administração Pública explícitos no Art. 37 da CF?', back: 'Legalidade, Impessoalidade, Moralidade, Publicidade e Eficiência (LIMPE).' },
  { id: 2, front: 'O que é um Ato Administrativo Discricionário?', back: 'Aquele em que a lei confere ao administrador uma margem de liberdade para decidir sobre a conveniência e oportunidade da prática do ato.' },
  { id: 3, front: 'Diferencie "Cargo Público" de "Função Pública".', back: 'Cargo é a unidade de atribuições criada por lei, com denominação própria e vencimento pago pelos cofres públicos. Função é o conjunto de atribuições, podendo ser exercida por quem não é titular de cargo (ex: mesário eleitoral).' },
];

export default function FlashcardsPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

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
  }

  const card = flashcards[currentIndex];

  return (
    <div className="flex flex-col gap-8 items-center">
       <header className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Flashcards</h1>
        <p className="text-muted-foreground">Revise os principais conceitos de forma rápida e eficiente.</p>
      </header>

      <div className="w-full max-w-2xl" style={{ perspective: '1000px' }}>
        <div className={`flashcard-inner ${isFlipped ? 'is-flipped' : ''}`} onClick={handleFlip}>
            <Card className="flashcard-front">
                <CardContent className="flex items-center justify-center text-center p-6 min-h-[300px]">
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
