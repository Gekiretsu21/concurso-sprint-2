'use client';

import { useMemo, useState, useEffect } from 'react';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { toggleQuestionStatus } from '@/firebase/actions';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2, Trash2, Undo2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { useUser } from '@/firebase/auth/use-user';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
  status?: 'active' | 'hidden';
}

function formatEnunciado(text: string) {
  if (!text) return '';
  return text.replace(/\b(I|II|III|IV|V|VI|VII|VIII|IX|X)[\s-]/g, '\n$&');
}

export default function ConstitutionalLawPage() {
  const { firestore } = useFirebase();
  const { user } = useUser();
  const [isClient, setIsClient] = useState(false);
  const [subject, setSubject] = useState('');
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [answeredQuestions, setAnsweredQuestions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setIsClient(true);
  }, []);

  const questionsQuery = useMemoFirebase(
    () =>
      firestore && user && isClient
        ? query(collection(firestore, 'questoes'), where('Materia', '==', 'Direito Constitucional'))
        : null,
    [firestore, user, isClient]
  );
  
  const { data: constitutionalQuestions, isLoading: isLoadingQuestions } =
    useCollection<Question>(questionsQuery);
  
  const alternativesKeys: (keyof Question)[] = ['a', 'b', 'c', 'd', 'e'];
  
  useEffect(() => {
    if (isClient) {
      setSubject('Direito Constitucional');
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

  const handleToggleStatus = (questionId: string, currentStatus: 'active' | 'hidden' = 'active') => {
    if (!firestore) return;
    toggleQuestionStatus(firestore, questionId, currentStatus);
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
      ) : constitutionalQuestions && constitutionalQuestions.length > 0 ? (
        <div className="space-y-6">
          <TooltipProvider>
            {constitutionalQuestions.map((q, index) => {
              const isAnswered = answeredQuestions[q.id];
              const selected = selectedAnswers[q.id];
              const isHidden = q.status === 'hidden';
              
              const isCorrect = String(selected).toLowerCase() === String(q.correctAnswer).toLowerCase();
              
              const userHasCorrectlyAnswered = isAnswered && isCorrect;
              const userHasIncorrectlyAnswered = isAnswered && !isCorrect;

              return (
                <Card key={q.id} className={cn(isHidden && 'opacity-50 bg-secondary')}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Questão {index + 1}</CardTitle>
                      <div className="flex items-center gap-4">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleToggleStatus(q.id, q.status)}
                              className={cn('h-8 w-8', isHidden && 'text-amber-600 hover:text-amber-700')}
                            >
                              {isHidden ? <Undo2 /> : <Trash2 />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{isHidden ? 'Restaurar questão' : 'Ocultar questão'}</p>
                          </TooltipContent>
                        </Tooltip>
                        <Badge variant="secondary">{q.Assunto}</Badge>
                        <Badge variant="secondary">{q.Cargo}</Badge>
                        <Badge variant="outline">{q.Ano}</Badge>
                      </div>
                    </div>
                    <CardDescription className="pt-4 text-base text-foreground whitespace-pre-line">
                      {formatEnunciado(q.Enunciado)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
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
                            if (selectedNormalized === currentKeyNormalized) return 'bg-secondary border-primary';
                            return 'hover:bg-secondary/80';
                          }
                        
                          if (isCorrect) {
                            if (selectedNormalized === currentKeyNormalized) return 'bg-emerald-100 border-emerald-400 text-emerald-900 font-medium';
                            return 'opacity-60';
                          }
                        
                          if (!isCorrect) {
                            if (currentKeyNormalized === correctAnswerNormalized) return 'bg-emerald-100 border-emerald-400 text-emerald-900 font-medium';
                            if (selectedNormalized === currentKeyNormalized) return 'bg-destructive/10 border-destructive/40 text-destructive';
                            return 'opacity-50';
                          }
                        };

                        return (
                          <div
                            key={optIndex}
                            onClick={() => handleSelectAnswer(q.id, alternativeKey)}
                            className={cn(
                              'flex items-start space-x-3 p-3 rounded-lg border transition-all duration-300',
                              isAnswered || isHidden ? 'cursor-not-allowed' : 'cursor-pointer',
                              getAlternativeClassName()
                            )}
                          >
                            <div className={cn(
                              "flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full border bg-background text-sm font-bold",
                              isAnswered && (isCorrect || !isCorrect) && alternativeKey.toLowerCase() === String(q.correctAnswer).toLowerCase() ? "bg-primary text-primary-foreground border-primary" : "border-muted-foreground"
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
                  <CardFooter className="flex-col items-stretch gap-4 sm:flex-row sm:justify-between sm:items-center">
                    <div className="text-sm min-h-[1.25rem]">
                      {userHasCorrectlyAnswered && (
                        <p className="text-emerald-600 font-medium">
                          Parabéns, resposta correta.
                        </p>
                      )}
                      {userHasIncorrectlyAnswered && (
                        <p className="text-destructive font-medium">
                          Você errou. Gabarito: Letra {q.correctAnswer.toUpperCase()}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 self-end sm:self-auto">
                      <Button 
                        variant="default"
                        onClick={() => handleConfirmAnswer(q.id)} 
                        disabled={!selected || isAnswered || isHidden}
                      >
                        {isAnswered ? "Respondido" : "Responder"}
                      </Button>
                      <Button variant="outline" disabled={isHidden}>Comentários</Button>
                    </div>
                  </CardFooter>
                </Card>
              )
            })}
          </TooltipProvider>
        </div>
      ) : (
        <Card className="flex flex-col items-center justify-center h-64">
          <CardContent className="text-center">
          <p className="text-muted-foreground">
            Nenhuma questão de Direito Constitucional encontrada.
          </p>
          <Button variant="link" asChild>
            <Link href="/mentorlite/management">Voltar ao Gerenciamento</Link>
          </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

    