
'use client';

import { useMemo, useState, useEffect } from 'react';
import { useCollection, useFirebase, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, where, QueryFieldFilterConstraint, and, doc } from 'firebase/firestore';
import { saveQuestionAttempt } from '@/firebase/actions';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2, MessageSquare, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TooltipProvider,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { QuestionComments } from './QuestionComments';
import { EditQuestionDialog } from './EditQuestionDialog';
import type { StatusFilter } from '@/app/mentorlite/questions/page';

type AttemptStatus = 'correct' | 'incorrect' | null;

export interface Question {
  id: string;
  Materia: string;
  Ano: string;
  Assunto: string;
  Cargo: string;
  Banca?: string;
  Enunciado: string;
  a?: string;
  b?: string;
  c?: string;
  d?: string;
  e?: string;
  god_mode_context_title?: string | null;
  god_mode_context_text?: string | null;
  god_mode_analysis_title?: string | null;
  god_mode_concept_title?: string | null;
  god_mode_concept_text?: string | null;
  god_mode_summary_title?: string | null;
  god_mode_summary_text?: string | null;
  god_mode_status_a?: string | null;
  god_mode_justification_a?: string | null;
  god_mode_status_b?: string | null;
  god_mode_justification_b?: string | null;
  god_mode_status_c?: string | null;
  god_mode_justification_c?: string | null;
  god_mode_status_d?: string | null;
  god_mode_justification_d?: string | null;
  god_mode_status_e?: string | null;
  god_mode_justification_e?: string | null;
  is_god_mode?: boolean;
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

export type MethodFilter = 'all' | 'academy' | 'no_academy';

interface QuestionListProps {
  subject?: string | string[];
  topics?: string[];
  cargo?: string;
  banca?: string;
  ano?: string;
  statusFilter?: StatusFilter;
  methodFilter?: MethodFilter;
}

export function QuestionList({ subject, topics, cargo, banca, ano, statusFilter = 'all', methodFilter = 'all' }: QuestionListProps) {
  const { firestore } = useFirebase();
  const { user } = useUser();

  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [answeredQuestions, setAnsweredQuestions] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const questionsPerPage = 10;

  const [userAttempts, setUserAttempts] = useState<Map<string, QuestionAttempt>>(new Map());
  const isAdmin = user?.email === 'amentoriaacademy@gmail.com';

  // 1. Fetch base questions based on filters
  const questionsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;

    const constraints: QueryFieldFilterConstraint[] = [];

    if (subject && subject !== 'all') {
      const subjectConstraint = Array.isArray(subject)
        ? where('Materia', 'in', subject)
        : where('Materia', '==', subject);
      constraints.push(subjectConstraint);
    }

    if (topics && topics.length > 0) {
      constraints.push(where('Assunto', 'in', topics));
    }

    if (cargo && cargo !== 'all' && cargo !== '') {
      constraints.push(where('Cargo', '==', cargo));
    }

    if (banca && banca !== 'all' && banca !== '') {
      constraints.push(where('Banca', '==', banca));
    }

    if (ano && ano !== 'all' && ano !== '') {
      constraints.push(where('Ano', '==', ano));
    }

    const baseRef = collection(firestore, 'questoes');
    return constraints.length > 0 ? query(baseRef, and(...constraints)) : baseRef;
  }, [firestore, user, subject, topics, cargo, banca, ano]);

  const { data: questions, isLoading: isLoadingQuestions } = useCollection<Question>(questionsQuery);

  // 2. Fetch user's attempts
  const attemptsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    const baseRef = collection(firestore, `users/${user.uid}/question_attempts`);

    if (subject && subject !== 'all') {
      const subjectConstraint = Array.isArray(subject)
        ? where('subject', 'in', subject)
        : where('subject', '==', subject);
      return query(baseRef, subjectConstraint);
    }

    return baseRef;
  }, [firestore, user, subject]);

  const { data: attempts, isLoading: isLoadingAttempts } = useCollection<QuestionAttempt>(attemptsQuery);

  useEffect(() => {
    if (attempts) {
      const attemptsMap = new Map(attempts.map(att => [att.id, att]));
      setUserAttempts(attemptsMap);
    }
  }, [attempts]);


  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile } = useDoc<any>(userDocRef);
  const userPlan = userProfile?.subscription?.plan || 'standard';
  const hasGodModeAccess = userPlan === 'plus' || userPlan === 'academy';

  const processedQuestions = useMemo(() => {
    if (!questions) return [];

    const questionsWithStatus = questions.map(q => {
      const sanitizedQ = { ...q };
      if (!hasGodModeAccess && !isAdmin) {
        sanitizedQ.god_mode_context_title = null;
        sanitizedQ.god_mode_context_text = null;
        sanitizedQ.god_mode_analysis_title = null;
        sanitizedQ.god_mode_concept_title = null;
        sanitizedQ.god_mode_concept_text = null;
        sanitizedQ.god_mode_summary_title = null;
        sanitizedQ.god_mode_summary_text = null;
        sanitizedQ.god_mode_status_a = null;
        sanitizedQ.god_mode_justification_a = null;
        sanitizedQ.god_mode_status_b = null;
        sanitizedQ.god_mode_justification_b = null;
        sanitizedQ.god_mode_status_c = null;
        sanitizedQ.god_mode_justification_c = null;
        sanitizedQ.god_mode_status_d = null;
        sanitizedQ.god_mode_justification_d = null;
        sanitizedQ.god_mode_status_e = null;
        sanitizedQ.god_mode_justification_e = null;
      }

      return {
        ...sanitizedQ,
        lastAttemptStatus: userAttempts.has(q.id)
          ? (userAttempts.get(q.id)!.isCorrect ? 'correct' : 'incorrect') as AttemptStatus
          : null,
      };
    }).filter(q => q.status !== 'hidden');

    let filtered = questionsWithStatus;

    if (statusFilter === 'resolved') {
      filtered = filtered.filter(q => q.lastAttemptStatus !== null);
    } else if (statusFilter === 'unresolved') {
      filtered = filtered.filter(q => q.lastAttemptStatus === null);
    }

    if (methodFilter === 'academy') {
      filtered = filtered.filter(q => q.is_god_mode);
    } else if (methodFilter === 'no_academy') {
      filtered = filtered.filter(q => !q.is_god_mode);
    }

    return filtered;
  }, [questions, userAttempts, statusFilter, methodFilter, isAdmin, hasGodModeAccess]);

  const indexOfLastQuestion = currentPage * questionsPerPage;
  const indexOfFirstQuestion = indexOfLastQuestion - questionsPerPage;
  const currentQuestions = processedQuestions.slice(indexOfFirstQuestion, indexOfLastQuestion);
  const totalPages = Math.ceil(processedQuestions.length / questionsPerPage);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedAnswers({});
    setAnsweredQuestions({});
  }, [subject, topics, cargo, banca, ano, statusFilter, questions]);

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
                    <div className="flex items-center gap-3">
                      <CardTitle>Questão {indexOfFirstQuestion + index + 1}</CardTitle>
                      {q.is_god_mode && (
                        <Badge className="bg-gradient-to-r from-amber-500 to-purple-600 text-white border-0 shadow-[0_0_15px_rgba(234,179,8,0.5)] animate-pulse font-black px-4 py-1.5 text-sm tracking-widest">
                          🎮 MÉTODO ACADEMY
                        </Badge>
                      )}
                    </div>
                    <div className="hidden md:flex items-center gap-2">
                      {q.Banca && <Badge variant="outline" className="border-accent text-accent font-bold uppercase tracking-widest text-[10px]">{q.Banca}</Badge>}
                      <Badge variant="secondary" className="text-[10px] uppercase">{q.Assunto}</Badge>
                      <Badge variant="secondary" className="text-[10px] uppercase">{q.Cargo}</Badge>
                      <Badge variant="outline" className="text-[10px]">{q.Ano}</Badge>
                    </div>
                  </div>
                  <CardDescription className="pt-4 text-base text-foreground whitespace-pre-line">
                    {formatEnunciado(q.Enunciado)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isAnswered && q.is_god_mode && hasGodModeAccess && q.god_mode_context_text && (
                    <div className="mb-6 p-5 rounded-xl bg-amber-500/5 border-l-4 border-l-amber-500 border-y border-r border-amber-500/20 shadow-sm transition-all">
                      <h4 className="font-black text-amber-700 mb-3 text-lg flex items-center gap-2">
                        <span className="text-xl">⚖️</span> {q.god_mode_context_title || 'CONTEXTO E CONCEITOS PRINCIPAIS'}
                      </h4>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed text-slate-700 font-medium">{q.god_mode_context_text}</p>
                    </div>
                  )}

                  {isAnswered && q.is_god_mode && hasGodModeAccess && q.god_mode_analysis_title && (
                    <div className="mb-4 mt-2">
                      <h4 className="font-bold text-slate-700 text-sm uppercase tracking-widest pl-1">{q.god_mode_analysis_title}</h4>
                    </div>
                  )}

                  <div className="space-y-3">
                    {alternativesKeys.map((key, optIndex) => {
                      const alternativeText = q[key];
                      if (!alternativeText) return null;

                      const alternativeKey = key.toString();

                      const getAlternativeClassName = () => {
                        const currentKeyNormalized = alternativeKey.toLowerCase();
                        const selectedNormalized = String(selected).toLowerCase();

                        if (!isAnswered) {
                          if (selectedNormalized === currentKeyNormalized) return 'bg-secondary border-primary';
                          return 'hover:bg-secondary/80 bg-white border-border dark:bg-transparent';
                        }

                        if (selectedNormalized === currentKeyNormalized) {
                          if (isAttemptCorrect) return 'bg-emerald-50 border-emerald-400 text-emerald-900 font-medium dark:bg-emerald-950/30 dark:text-emerald-300';
                          return 'bg-red-50 border-red-400 text-red-900 font-medium dark:bg-red-950/30 dark:text-red-300';
                        }

                        return 'bg-white opacity-60 border-border pointer-events-none dark:bg-transparent';
                      };

                      const godModeStatusKey = `god_mode_status_${alternativeKey}` as keyof Question;
                      const godModeJusKey = `god_mode_justification_${alternativeKey}` as keyof Question;
                      const godModeStatus = q[godModeStatusKey] as string | undefined | null;
                      const godModeJus = q[godModeJusKey] as string | undefined | null;

                      const isLegacyA = `god_mode_${alternativeKey}` as keyof Question;
                      const legacyText = q[isLegacyA] as string | undefined | null;

                      const finalGodModeText = godModeJus || legacyText;
                      const isThisCorrect = alternativeKey.toLowerCase() === String(q.correctAnswer).toLowerCase();
                      const isSelectedAlternative = isAnswered && String(selected).toLowerCase() === alternativeKey.toLowerCase();

                      return (
                        <div key={optIndex} className="space-y-2">
                          <div
                            onClick={() => handleSelectAnswer(q.id, alternativeKey)}
                            className={cn(
                              'flex items-start space-x-3 p-3 rounded-lg border transition-all duration-300 relative',
                              isAnswered || isHidden ? 'cursor-not-allowed' : 'cursor-pointer',
                              getAlternativeClassName()
                            )}
                          >
                            <div className={cn(
                              "flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full border text-sm font-bold z-10 transition-colors",
                              isAnswered && String(selected).toLowerCase() === alternativeKey.toLowerCase()
                                ? isAttemptCorrect
                                  ? "bg-emerald-500 text-white border-emerald-500"
                                  : "bg-red-500 text-white border-red-500"
                                : "bg-background border-muted-foreground text-foreground"
                            )}>
                              {String.fromCharCode(65 + optIndex)}
                            </div>
                            <div className="flex-1 pt-0.5 z-10">
                              {alternativeText}
                            </div>
                          </div>

                          {isAnswered && q.is_god_mode && finalGodModeText && (
                            <div className={cn(
                              "text-sm p-4 rounded-lg relative overflow-hidden mt-1 mb-4",
                              hasGodModeAccess
                                ? isSelectedAlternative
                                  ? isThisCorrect
                                    ? "bg-emerald-50 border border-emerald-200 text-emerald-900 shadow-sm animate-in fade-in slide-in-from-top-2 duration-500"
                                    : "bg-red-50 border border-red-200 text-red-900 shadow-sm animate-in fade-in slide-in-from-top-2 duration-500"
                                  : "bg-slate-50 border border-slate-200 text-slate-700 animate-in fade-in slide-in-from-top-2 duration-500"
                                : "bg-slate-50 border border-slate-200 select-none pointer-events-none"
                            )}>
                              {hasGodModeAccess ? (
                                <div className="flex items-start gap-3">
                                  <div className="mt-1 flex-shrink-0">
                                    <span className={cn(
                                      "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                                      isSelectedAlternative
                                        ? isThisCorrect
                                          ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                                          : "bg-red-100 text-red-700 border border-red-300"
                                        : "bg-slate-200 text-slate-600 border border-slate-300"
                                    )}>⚡</span>
                                  </div>
                                  <div className="flex-1 leading-relaxed">
                                    {godModeStatus ? (
                                      <span className={cn("font-bold mb-1.5 block pb-1 border-b uppercase text-xs tracking-wider",
                                        isSelectedAlternative
                                          ? (isThisCorrect ? 'border-emerald-200 text-emerald-800' : 'border-red-200 text-red-800')
                                          : 'border-slate-200 text-slate-600'
                                      )}>
                                        {godModeStatus}
                                      </span>
                                    ) : (
                                      <span className={cn("font-bold mb-1.5 block uppercase text-xs tracking-wider",
                                        isSelectedAlternative ? (isThisCorrect ? "text-emerald-800" : "text-red-800") : "text-slate-600"
                                      )}>
                                        Análise Tática - Alternativa {String.fromCharCode(65 + optIndex)}
                                      </span>
                                    )}
                                    <span className="font-medium leading-relaxed">{finalGodModeText}</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="relative">
                                  <div className="blur-sm opacity-50 select-none pb-6">
                                    <div className="flex items-start gap-3">
                                      <div className="mt-1 h-6 w-6 rounded-full bg-slate-300 flex-shrink-0" />
                                      <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-slate-200 rounded w-1/3" />
                                        <div className="h-4 bg-slate-200 rounded w-full" />
                                        <div className="h-4 bg-slate-200 rounded w-5/6" />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}

                    {isAnswered && q.is_god_mode && !hasGodModeAccess && (
                      <div className="mt-6 p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 border-2 border-amber-500/30 shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-amber-500/5 group-hover:bg-amber-500/10 transition-colors" />
                        <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                          <div className="p-3 bg-slate-950 rounded-full border border-amber-500/30 shadow-[0_0_20px_rgba(234,179,8,0.3)] group-hover:shadow-[0_0_30px_rgba(234,179,8,0.5)] transition-shadow">
                            <Crown className="text-amber-500 h-6 w-6" />
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-lg font-black text-white tracking-wide">Ative o Método Academy!</h4>
                            <p className="text-sm text-slate-300 max-w-sm font-medium">
                              A banca tentou te enganar, mas nós temos o código. Assine para destravar a visão tática e cirúrgica desta questão com Contexto, Casos Práticos e Resumo em Flashcard.
                            </p>
                          </div>
                          <Button className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-amber-950 font-black px-8">
                            Desbloquear Acesso Premium
                          </Button>
                        </div>
                      </div>
                    )}

                    {isAnswered && q.is_god_mode && hasGodModeAccess && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                        {q.god_mode_concept_text && (
                          <div className="p-5 rounded-xl border border-indigo-500/30 bg-indigo-500/5 shadow-sm">
                            <h4 className="font-bold text-indigo-700 mb-2 flex items-center gap-2">
                              <span className="text-lg">🧠</span> {q.god_mode_concept_title || 'Conceito-Chave'}
                            </h4>
                            <p className="text-sm leading-relaxed text-slate-700 font-medium">{q.god_mode_concept_text}</p>
                          </div>
                        )}
                        {q.god_mode_summary_text && (
                          <div className="p-5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 shadow-sm relative overflow-hidden group">
                            <h4 className="font-bold text-emerald-700 mb-2 flex items-center gap-2 relative z-10">
                              <span className="text-lg">🎓</span> {q.god_mode_summary_title || 'Síntese de Revisão'}
                            </h4>
                            <p className="text-sm font-mono whitespace-pre-wrap relative z-10 leading-relaxed text-slate-700 font-medium">{q.god_mode_summary_text}</p>
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                </CardContent>
                <CardFooter className="flex-col items-stretch gap-4 sm:flex-row sm:justify-between sm:items-center">
                  <div className="text-sm min-h-[1.25rem]">
                    {userHasCorrectlyAnswered && (
                      <p className="text-emerald-600 font-medium">Parabéns, resposta correta.</p>
                    )}
                    {userHasIncorrectlyAnswered && (
                      <p className="text-destructive font-medium">Você errou. Gabarito: Letra {q.correctAnswer.toUpperCase()}</p>
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
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" disabled={isHidden}>
                          <MessageSquare className="mr-2" /> Comentários
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-3xl">
                        <DialogHeader>
                          <DialogTitle>Comentários da Questão</DialogTitle>
                        </DialogHeader>
                        <QuestionComments questionId={q.id} />
                      </DialogContent>
                    </Dialog>
                    {isAdmin && <EditQuestionDialog question={q} />}
                  </div>
                </CardFooter>
              </Card>
            )
          })}
        </TooltipProvider>
      </div>
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <Button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} variant="outline">Anterior</Button>
          <span className="text-sm text-muted-foreground">Página {currentPage} de {totalPages}</span>
          <Button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} variant="outline">Próxima</Button>
        </div>
      )}
    </>
  );
}
