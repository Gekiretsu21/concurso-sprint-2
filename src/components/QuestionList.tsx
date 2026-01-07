'use client';

import { useMemo, useState, useEffect } from 'react';
import { useCollection, useFirebase, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, QueryConstraint, and, getDocs } from 'firebase/firestore';
import { saveQuestionAttempt, toggleQuestionStatus } from '@/firebase/actions';
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
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { StatusFilter } from '@/app/mentorlite/questions/page';

type AttemptStatus = 'correct' | 'incorrect' | null;

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
  lastAttemptStatus?: AttemptStatus;
}

interface QuestionAttempt {
    id: string;
    isCorrect: boolean;
    subject: string;
}

function formatEnunciado(text: string) {
  if (!text) return '';
  return text.replace(/\b(I|II|III|IV|V|VI|VII|VIII|IX|X)[\s-]/g, '\n$&');
}

interface QuestionListProps {
  subject: string | string[];
  topics?: string[];
  statusFilter?: StatusFilter;
}

export function QuestionList({ subject, topics, statusFilter = 'all' }: QuestionListProps) {
  const { firestore } = useFirebase();
  const { user } = useUser();

  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [answeredQuestions, setAnsweredQuestions] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const questionsPerPage = 10;
  
  const [userAttempts, setUserAttempts] = useState<Map<string, QuestionAttempt>>(new Map());

  // 1. Fetch base questions based on subject and topics
  const questionsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    const subjectConstraint = Array.isArray(subject) 
      ? where('Materia', 'in', subject) 
      : where('Materia', '==', subject);
      
    const constraints: QueryConstraint[] = [subjectConstraint];
    if (topics && topics.length > 0) {
      constraints.push(where('Assunto', 'in', topics));
    }
    return query(collection(firestore, 'questoes'), and(...constraints));
  }, [firestore, subject, topics]);

  const { data: questions, isLoading: isLoadingQuestions } = useCollection<Question>(questionsQuery);
  
  // 2. Fetch user's attempts for the current subject
  const attemptsQuery = useMemoFirebase(() => {
      if(!firestore || !user) return null;
      // Fetch for one or multiple subjects
      const subjectConstraint = Array.isArray(subject)
        ? where('subject', 'in', subject)
        : where('subject', '==', subject);
      return query(collection(firestore, `users/${user.uid}/question_attempts`), subjectConstraint);
  }, [firestore, user, subject]);

  const { data: attempts, isLoading: isLoadingAttempts } = useCollection<QuestionAttempt>(attemptsQuery);
  
  // 3. Create a map of attempts for quick lookup
  useEffect(() => {
    if (attempts) {
      const attemptsMap = new Map(attempts.map(att => [att.id, att]));
      setUserAttempts(attemptsMap);
    }
  }, [attempts]);


  const processedQuestions = useMemo(() => {
    if (!questions) return [];
    
    // Add attempt status to each question
    const questionsWithStatus = questions.map(q => ({
      ...q,
      lastAttemptStatus: userAttempts.has(q.id)
        ? userAttempts.get(q.id)!.isCorrect ? 'correct' : 'incorrect'
        : null,
    })).filter(q => q.status !== 'hidden');
    
    // Apply the status filter
    if (statusFilter === 'resolved') {
      return questionsWithStatus.filter(q => q.lastAttemptStatus !== null);
    }
    if (statusFilter === 'unresolved') {
      return questionsWithStatus.filter(q => q.lastAttemptStatus === null);
    }
    return questionsWithStatus; // 'all'
  }, [questions, userAttempts, statusFilter]);

  // Pagination logic
  const indexOfLastQuestion = currentPage * questionsPerPage;
  const indexOfFirstQuestion = indexOfLastQuestion - questionsPerPage;
  const currentQuestions = processedQuestions.slice(indexOfFirstQuestion, indexOfLastQuestion);
  const totalPages = Math.ceil(processedQuestions.length / questionsPerPage);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
    // When the questions themselves change, also clear local answer state
    setSelectedAnswers({});
    setAnsweredQuestions({});
  }, [subject, topics, statusFilter, questions]);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const alternativesKeys: (keyof Question)[] = ['a', 'b', 'c', 'd', 'e'];

  const handleSelectAnswer = (questionId: string, answer: string) => {
    if (answeredQuestions[questionId]) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: prev[questionId] === answer ? '' : answer,
    }));
  };

  const handleConfirmAnswer = (question: Question) => {
    if (!user || !firestore) return;

    const selectedOption = selectedAnswers[question.id];
    if (!selectedOption) return;

    const isCorrect = selectedOption.toLowerCase() === question.correctAnswer.toLowerCase();
    
    setAnsweredQuestions(prev => ({ ...prev, [question.id]: true }));
    saveQuestionAttempt(firestore, user.uid, question.id, isCorrect, selectedOption, question.Materia);
  };


  const handleToggleStatus = (questionId: string, currentStatus: 'active' | 'hidden' = 'active') => {
    if (!firestore) return;
    toggleQuestionStatus(firestore, questionId, currentStatus);
  };

  const isLoading = isLoadingQuestions || isLoadingAttempts;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (processedQuestions.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center h-64">
        <CardContent className="text-center p-6">
          <p className="text-muted-foreground">
            Nenhuma questão encontrada para os critérios selecionados.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <TooltipProvider>
          {currentQuestions.map((q, index) => {
            const isAnswered = answeredQuestions[q.id];
            const selected = selectedAnswers[q.id];
            const isHidden = q.status === 'hidden';

            const isAttemptCorrect = String(selected).toLowerCase() === String(q.correctAnswer).toLowerCase();

            const userHasCorrectlyAnswered = isAnswered && isAttemptCorrect;
            const userHasIncorrectlyAnswered = isAnswered && !isAttemptCorrect;

            return (
              <Card key={q.id} className={cn("relative overflow-hidden", isHidden && 'opacity-50 bg-secondary')}>
                {q.lastAttemptStatus && (
                   <Badge className={cn(
                       "absolute top-2 left-2 text-xs",
                       q.lastAttemptStatus === 'correct' ? 'bg-green-100 text-green-800 border-green-300' : 'bg-red-100 text-red-800 border-red-300'
                   )}>
                       {q.lastAttemptStatus === 'correct' ? 'Você acertou anteriormente' : 'Você errou anteriormente'}
                   </Badge>
                )}
                <CardHeader className="pt-10">
                  <div className="flex items-center justify-between">
                    <CardTitle>Questão {indexOfFirstQuestion + index + 1}</CardTitle>
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

                        if (isAttemptCorrect) {
                          if (selectedNormalized === currentKeyNormalized) return 'bg-emerald-100 border-emerald-400 text-emerald-900 font-medium';
                          return 'opacity-60';
                        }

                        if (!isAttemptCorrect) {
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
                            isAnswered && (isAttemptCorrect || !isAttemptCorrect) && alternativeKey.toLowerCase() === String(q.correctAnswer).toLowerCase() ? "bg-primary text-primary-foreground border-primary" : "border-muted-foreground"
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
                      onClick={() => handleConfirmAnswer(q)}
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
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <Button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            variant="outline"
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages}
          </span>
          <Button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            variant="outline"
          >
            Próxima
          </Button>
        </div>
      )}
    </>
  );
}
