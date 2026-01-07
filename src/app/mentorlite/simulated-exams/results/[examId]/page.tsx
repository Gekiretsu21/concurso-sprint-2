'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Home, Loader2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useFirebase, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc, getDoc, collection, query, where, getDocs, documentId } from 'firebase/firestore';
import { savePreviousExamResult } from '@/firebase/actions';


// These types should ideally be in a shared types file
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

interface SimulatedExam {
  id: string;
  name: string;
  questionIds: string[];
}

type UserAnswers = { [questionId: string]: string };

interface ExamResultsData {
  exam: SimulatedExam;
  questions: Question[];
  userAnswers: UserAnswers;
}

interface PreviousExamResult {
    examId: string;
    score: number;
    userAnswers: UserAnswers;
    performanceSummary: { [subjectName: string]: SubjectStats };
}


// Stats types
interface PerformanceStats {
  total: number;
  correct: number;
  incorrect: number;
  percentage: number;
}

interface SubjectStats extends PerformanceStats {
  topics: { [topicName: string]: PerformanceStats };
}

function formatEnunciado(text: string) {
  if (!text) return '';
  return text.replace(/\b(I|II|III|IV|V|VI|VII|VIII|IX|X)[\s-]/g, '\n$&');
}

function ResultDetails({ question, userAnswer, index }: { question: Question, userAnswer: string | undefined, index: number }) {
  const alternativesKeys: (keyof Question)[] = ['a', 'b', 'c', 'd', 'e'];
  const isCorrect = userAnswer && userAnswer.toLowerCase() === question.correctAnswer.toLowerCase();
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            {isCorrect ? <CheckCircle className="text-emerald-500" /> : <XCircle className="text-destructive" />}
            Questão {index + 1}
          </CardTitle>
          <Badge variant="outline">{question.Materia}</Badge>
        </div>
        <CardDescription className="pt-4 text-base text-foreground whitespace-pre-line">
            ({question.Assunto}) {formatEnunciado(question.Enunciado)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {alternativesKeys.map((key, index) => {
          const alternativeText = question[key];
          if (!alternativeText) return null;

          const keyLower = key.toLowerCase();
          const correctLower = question.correctAnswer.toLowerCase();
          const userLower = userAnswer?.toLowerCase();

          const isUserChoice = keyLower === userLower;
          const isCorrectChoice = keyLower === correctLower;

          return (
             <div
              key={index}
              className={cn(
                'flex items-start space-x-3 p-3 rounded-lg border',
                isCorrectChoice ? 'bg-emerald-100/60 border-emerald-300' : 'bg-card',
                !isCorrectChoice && isUserChoice ? 'bg-destructive/10 border-destructive/30' : ''
              )}
            >
              <div className={cn("flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full border font-bold text-sm", isCorrectChoice ? "bg-primary text-primary-foreground" : "bg-background")}>
                {String.fromCharCode(65 + index)}
              </div>
              <div className="flex-1 pt-0.5">{alternativeText}</div>
            </div>
          )
        })}
        {!userAnswer && (
            <div className="text-center text-sm font-medium text-destructive p-2 rounded-md bg-destructive/10 border border-destructive/20">
                Questão não respondida. Gabarito: {question.correctAnswer.toUpperCase()}
            </div>
        )}
      </CardContent>
    </Card>
  )
}

function calculatePerformance(questions: Question[], userAnswers: UserAnswers): { [subjectName: string]: SubjectStats } {
    const stats: { [subjectName: string]: SubjectStats } = {};

    for (const q of questions) {
      const subject = q.Materia;
      const topic = q.Assunto;
      const userAnswer = userAnswers[q.id];
      const isCorrect = userAnswer && userAnswer.toLowerCase() === q.correctAnswer.toLowerCase();

      if (!stats[subject]) {
        stats[subject] = { total: 0, correct: 0, incorrect: 0, percentage: 0, topics: {} };
      }
      if (!stats[subject].topics[topic]) {
        stats[subject].topics[topic] = { total: 0, correct: 0, incorrect: 0, percentage: 0 };
      }
      
      stats[subject].total++;
      stats[subject].topics[topic].total++;
      if (isCorrect) {
        stats[subject].correct++;
        stats[subject].topics[topic].correct++;
      } else {
        stats[subject].incorrect++;
        stats[subject].topics[topic].incorrect++;
      }
    }
    
    for (const subject in stats) {
      stats[subject].percentage = (stats[subject].correct / stats[subject].total) * 100;
      for (const topic in stats[subject].topics) {
        const topicStats = stats[subject].topics[topic];
        topicStats.percentage = (topicStats.correct / topicStats.total) * 100;
      }
    }

    return stats;
}

export default function ExamResultsPage() {
  const { firestore, user } = useFirebase();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const examId = params.examId as string;
  const examName = searchParams.get('examName');

  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  const [scorePercentage, setScorePercentage] = useState(0);
  const [performanceBySubject, setPerformanceBySubject] = useState<{ [subjectName: string]: SubjectStats }>({});
  const [isLoading, setIsLoading] = useState(true);

  const resultDocRef = useMemoFirebase(() => {
    if (!firestore || !user || !examId) return null;
    return doc(firestore, `users/${user.uid}/previousExamResults/${examId}`);
  }, [firestore, user, examId]);

  const { data: savedResult, isLoading: isLoadingResult } = useDoc<PreviousExamResult>(resultDocRef);

  const fetchAndSetQuestions = useCallback(async (questionIds: string[], storedAnswers: UserAnswers) => {
    if (!firestore || questionIds.length === 0) {
      setIsLoading(false);
      return;
    }

    const fetchedQuestionsData: Question[] = [];
    const questionIdsBatches: string[][] = [];
    for (let i = 0; i < questionIds.length; i += 30) {
      questionIdsBatches.push(questionIds.slice(i, i + 30));
    }
    
    for (const batch of questionIdsBatches) {
        if (batch.length === 0) continue;
        const q = query(collection(firestore, 'questoes'), where(documentId(), 'in', batch));
        const querySnapshot = await getDocs(q);
        querySnapshot.docs.forEach(doc => {
            fetchedQuestionsData.push({ id: doc.id, ...doc.data() as Omit<Question, 'id'> });
        });
    }

    const questionsMap = new Map(fetchedQuestionsData.map(q => [q.id, q]));
    const orderedQuestions = questionIds.map(id => questionsMap.get(id)).filter((q): q is Question => !!q);
    
    setQuestions(orderedQuestions);
    setUserAnswers(storedAnswers);
    
    const calculatedPerformance = calculatePerformance(orderedQuestions, storedAnswers);
    setPerformanceBySubject(calculatedPerformance);

    const correctCount = orderedQuestions.reduce((acc, q) => 
        (storedAnswers[q.id] && storedAnswers[q.id].toLowerCase() === q.correctAnswer.toLowerCase()) ? acc + 1 : acc, 0);
    const total = orderedQuestions.length;
    setScorePercentage(total > 0 ? (correctCount / total) * 100 : 0);
    
    setIsLoading(false);
  }, [firestore]);


  useEffect(() => {
    const fromLocalStorage = localStorage.getItem('examResults');
    
    if (fromLocalStorage) {
      const data: ExamResultsData = JSON.parse(fromLocalStorage);

      const questionsMap = new Map(data.questions.map(q => [q.id, q]));
      const orderedQuestions = data.exam.questionIds.map(id => questionsMap.get(id)).filter((q): q is Question => !!q);

      setQuestions(orderedQuestions);
      setUserAnswers(data.userAnswers);
      
      const perf = calculatePerformance(orderedQuestions, data.userAnswers);
      setPerformanceBySubject(perf);
      
      const correct = orderedQuestions.reduce((acc, q) => (data.userAnswers[q.id] && data.userAnswers[q.id].toLowerCase() === q.correctAnswer.toLowerCase() ? acc + 1 : acc), 0);
      const total = orderedQuestions.length;
      const score = total > 0 ? (correct / total) * 100 : 0;
      setScorePercentage(score);

      if (firestore && user) {
          savePreviousExamResult(firestore, {
              userId: user.uid,
              examId: data.exam.id,
              score,
              userAnswers: data.userAnswers,
              performanceSummary: perf,
          });
      }
      localStorage.removeItem('examResults');
      setIsLoading(false);
      return; // Exit after processing local storage data
    }
    
    // Only proceed to check Firestore if not loading and local storage was empty
    if (!isLoadingResult) {
        if (savedResult) {
            const fetchExamAndQuestions = async () => {
                if (!firestore || !user) return;
                
                const examCollectionPaths = [
                    'previousExams',
                    'communitySimulados',
                ];

                let examData: SimulatedExam | null = null;
                
                for (const path of examCollectionPaths) {
                    const examRef = doc(firestore, path, savedResult.examId);
                    const examSnap = await getDoc(examRef);
                    if (examSnap.exists()) {
                        examData = { id: examSnap.id, ...examSnap.data() } as SimulatedExam;
                        break;
                    }
                }

                if (examData) {
                  fetchAndSetQuestions(examData.questionIds, savedResult.userAnswers);
                } else {
                    console.error("Exam document not found in any collection for ID:", savedResult.examId);
                    setIsLoading(false); // Stop loading
                    router.push('/mentorlite'); // Redirect if exam is truly not found
                }
            };
            fetchExamAndQuestions();
        } else {
            // If finished loading and there's no savedResult (and no localStorage data), then redirect
            setIsLoading(false);
            router.push('/mentorlite');
        }
    }

  }, [savedResult, isLoadingResult, firestore, user, fetchAndSetQuestions, router]);

  const correctAnswersCount = useMemo(() => Object.keys(userAnswers).reduce((acc, qId) => {
    const question = questions.find(q => q.id === qId);
    const userAnswer = userAnswers[qId];
    if (question && userAnswer && userAnswer.toLowerCase() === question.correctAnswer.toLowerCase()) {
      return acc + 1;
    }
    return acc;
  }, 0), [questions, userAnswers]);


  if (isLoading || isLoadingResult) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-4">Carregando resultados...</p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Resultado do Simulado</h1>
        <p className="text-muted-foreground">{examName || 'Simulado'}</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Seu Desempenho Geral</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
             <div className="flex items-center gap-4">
                <span className="text-4xl font-bold text-primary">{scorePercentage.toFixed(1)}%</span>
                <Progress value={scorePercentage} className="w-full h-3" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-center">
                <div>
                    <p className="text-2xl font-semibold">{correctAnswersCount}</p>
                    <p className="text-sm text-muted-foreground">Respostas Corretas</p>
                </div>
                 <div>
                    <p className="text-2xl font-semibold">{questions.length - correctAnswersCount}</p>
                    <p className="text-sm text-muted-foreground">Respostas Erradas</p>
                </div>
                 <div>
                    <p className="text-2xl font-semibold">{questions.length}</p>
                    <p className="text-sm text-muted-foreground">Total de Questões</p>
                </div>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Desempenho por Matéria</CardTitle>
          <CardDescription>Analise seus acertos e erros em cada matéria e assunto.</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {Object.entries(performanceBySubject).sort((a,b) => a[0].localeCompare(b[0])).map(([subject, stats]) => (
              <AccordionItem key={subject} value={subject}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex flex-1 items-center justify-between pr-4">
                    <span className="font-bold text-lg">{subject}</span>
                     <Badge variant={stats.percentage >= 70 ? 'default' : 'destructive'} className="text-base">
                      {stats.percentage.toFixed(1)}%
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  <div className="rounded-lg border bg-muted/50 p-4">
                     <div className="grid grid-cols-4 gap-4 text-center">
                        <div>
                          <p className="font-bold text-lg">{stats.total}</p>
                          <p className="text-xs text-muted-foreground">Total</p>
                        </div>
                        <div>
                          <p className="font-bold text-lg text-emerald-600">{stats.correct}</p>
                          <p className="text-xs text-muted-foreground">Acertos</p>
                        </div>
                        <div>
                          <p className="font-bold text-lg text-destructive">{stats.incorrect}</p>
                          <p className="text-xs text-muted-foreground">Erros</p>
                        </div>
                         <div>
                          <p className="font-bold text-lg text-primary">{stats.percentage.toFixed(1)}%</p>
                          <p className="text-xs text-muted-foreground">Aproveitamento</p>
                        </div>
                      </div>
                  </div>
                  {Object.keys(stats.topics).length > 0 && (
                    <Accordion type="single" collapsible className="w-full pl-4">
                        {Object.entries(stats.topics).sort((a,b) => a[0].localeCompare(b[0])).map(([topic, topicStats]) => (
                        <AccordionItem key={topic} value={topic}>
                            <AccordionTrigger className="py-2 text-sm hover:no-underline">
                                <div className="flex flex-1 items-center justify-between pr-4">
                                    <span>{topic}</span>
                                    <Badge variant={topicStats.percentage >= 70 ? 'secondary' : 'destructive'} className="font-normal">
                                    {topicStats.percentage.toFixed(1)}%
                                    </Badge>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-2 pb-0">
                            <div className="rounded-lg border p-3">
                                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                                    <div>
                                        <p className="font-semibold">{topicStats.total}</p>
                                        <p className="text-muted-foreground">Total</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-emerald-600">{topicStats.correct}</p>
                                        <p className="text-muted-foreground">Acertos</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-destructive">{topicStats.incorrect}</p>
                                        <p className="text-muted-foreground">Erros</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-primary">{topicStats.percentage.toFixed(1)}%</p>
                                        <p className="text-muted-foreground">Aproveitamento</p>
                                    </div>
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                        ))}
                    </Accordion>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Gabarito Detalhado</h2>
        {questions.map((q, index) => (
          <ResultDetails key={q.id} question={q} userAnswer={userAnswers[q.id]} index={index}/>
        ))}
      </div>
      
      <div className="flex justify-center mt-8">
        <Button asChild size="lg">
            <Link href="/mentorlite">
                <Home className="mr-2" />
                Voltar para o Dashboard
            </Link>
        </Button>
      </div>
    </div>
  );
}
