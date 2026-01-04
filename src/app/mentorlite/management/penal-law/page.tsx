'use client';

import { useMemo, useState, useEffect } from 'react';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

interface Question {
  id: string;
  Materia: string;
  Ano: string;
  Assunto: string;
  Cargo: string;
  Enunciado: string;
  a?: string;
  b?: string;
  c?: string;
  d?: string;
  e?: string;
  correctAnswer: string;
}

// Helper function to format the question text
function formatEnunciado(text: string) {
  if (!text) return '';
  // Regex to find roman numerals (I to X) followed by a hyphen or space, at the beginning of a word.
  // This will add a line break before each item in a list.
  return text.replace(/\b(I|II|III|IV|V|VI|VII|VIII|IX|X)[\s-]/g, '\n$&');
}

export default function PenalLawPage() {
  const { firestore } = useFirebase();
  const [isClient, setIsClient] = useState(false);
  const [subject, setSubject] = useState('');
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [answeredQuestions, setAnsweredQuestions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setIsClient(true);
  }, []);

  const questionsQuery = useMemoFirebase(
    () =>
      firestore && isClient
        ? query(collection(firestore, 'questoes'), where('Materia', '==', 'Direito Penal'))
        : null,
    [firestore, isClient]
  );
  
  const { data: penalQuestions, isLoading: isLoadingQuestions } =
    useCollection<Question>(questionsQuery);
  
  const alternativesKeys: (keyof Question)[] = ['a', 'b', 'c', 'd', 'e'];
  
  useEffect(() => {
    if (isClient) {
      setSubject('Direito Penal');
    }
  }, [isClient]);

  const handleSelectAnswer = (questionId: string, answer: string) => {
    if (answeredQuestions[questionId]) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: prev[questionId] === answer ? '' : answer,
    }));
  };

  const handleConfirmAnswer = (questionId: string) => {
    setAnsweredQuestions(prev => ({
      ...prev,
      [questionId]: true,
    }));
  };

  const isLoading = isLoadingQuestions || !isClient;

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
          <h1 className="text-3xl font-bold tracking-tight">
            Questões de {subject}
          </h1>
          <p className="text-muted-foreground">
            Visualize todas as questões cadastradas para esta matéria.
          </p>
        </div>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : penalQuestions && penalQuestions.length > 0 ? (
        <div className="space-y-6">
          {penalQuestions.map((q, index) => {
            const isAnswered = answeredQuestions[q.id];
            const selected = selectedAnswers[q.id];
            
            const isCorrect = String(selected).toLowerCase() === String(q.correctAnswer).toLowerCase();
            
            const userHasCorrectlyAnswered = isAnswered && isCorrect;
            const userHasIncorrectlyAnswered = isAnswered && !isCorrect;

            return (
              <div key={q.id} className="bg-black/60 border border-white/10 rounded-3xl shadow-lg shadow-black/30">
                <CardHeader className="p-6">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">Questão {index + 1}</CardTitle>
                    <div className="flex items-center gap-2 text-xs">
                        <Badge variant="secondary">{q.Assunto}</Badge>
                        <Badge variant="secondary">{q.Cargo}</Badge>
                        <Badge variant="outline">{q.Ano}</Badge>
                    </div>
                  </div>
                  <CardDescription className="pt-4 text-base text-foreground whitespace-pre-line">
                    {formatEnunciado(q.Enunciado)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {alternativesKeys.map((key, optIndex) => {
                      const alternativeText = q[key];
                      if (!alternativeText) return null;

                      const alternativeKey = key.toString();

                      const getAlternativeClassName = () => {
                        const currentKeyNormalized = alternativeKey.toLowerCase();
                        const correctAnswerNormalized = String(q.correctAnswer).toLowerCase();
                        const selectedNormalized = String(selected).toLowerCase();

                        if (!isAnswered) {
                          if (selectedNormalized === currentKeyNormalized) return 'bg-primary/20 border-primary text-foreground';
                          return 'bg-background/30 border-white/10 hover:bg-white/20 text-muted-foreground';
                        }
                      
                        if (isCorrect) {
                           if (selectedNormalized === currentKeyNormalized) return 'bg-teal-500/80 border-teal-400 text-white font-bold';
                           return 'bg-background/30 border-white/5 opacity-50';
                        }
                      
                        if (!isCorrect) {
                          if (currentKeyNormalized === correctAnswerNormalized) return 'bg-teal-500/80 border-teal-400 text-white font-bold';
                          if (selectedNormalized === currentKeyNormalized) return 'bg-gray-600/50 border-gray-600 text-gray-400';
                          return 'bg-background/20 border-white/5 opacity-30';
                        }
                      };

                      return (
                        <div
                          key={optIndex}
                          onClick={() => handleSelectAnswer(q.id, alternativeKey)}
                          className={cn(
                            'flex items-start space-x-3 p-3 rounded-lg border transition-all duration-300',
                            isAnswered ? 'cursor-not-allowed' : 'cursor-pointer',
                            getAlternativeClassName()
                          )}
                        >
                          <div className={cn(
                            "flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full border text-sm font-bold",
                             isAnswered && (isCorrect || !isCorrect) && alternativeKey.toLowerCase() === String(q.correctAnswer).toLowerCase() ? "bg-white text-teal-600 border-white" : "bg-background border-white/20"
                          )}>
                            {String.fromCharCode(65 + optIndex)}
                          </div>
                          <div className="flex-1 pt-0.5">
                            {alternativeText}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
                <CardFooter className="p-6 flex flex-col items-stretch gap-4 sm:flex-row sm:justify-between sm:items-center">
                  <div className="text-sm min-h-[1.25rem]">
                    {userHasCorrectlyAnswered && (
                      <p className="text-teal-400 font-medium">
                        Parabéns, resposta correta.
                      </p>
                    )}
                    {userHasIncorrectlyAnswered && (
                      <p className="text-gray-400 font-medium">
                        Você errou. Gabarito: Letra {q.correctAnswer.toUpperCase()}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 self-end sm:self-auto">
                    <Button 
                      onClick={() => handleConfirmAnswer(q.id)} 
                      disabled={!selected || isAnswered}
                      className={isAnswered ? "opacity-50" : ""}
                    >
                      {isAnswered ? "Respondido" : "Responder"}
                    </Button>
                    <Button variant="outline">Comentários</Button>
                  </div>
                </CardFooter>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 rounded-3xl border border-dashed border-white/20 bg-black/60">
          <p className="text-muted-foreground">
            Nenhuma questão de Direito Penal encontrada.
          </p>
          <Button variant="link" asChild>
            <Link href="/mentorlite/management">Voltar ao Gerenciamento</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
