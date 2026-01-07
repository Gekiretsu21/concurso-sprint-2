'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Home, XCircle } from 'lucide-react';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

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

function ResultDetails({ question, userAnswer }: { question: Question, userAnswer: string | undefined }) {
  const alternativesKeys: (keyof Question)[] = ['a', 'b', 'c', 'd', 'e'];
  const isCorrect = userAnswer && userAnswer.toLowerCase() === question.correctAnswer.toLowerCase();
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            {isCorrect ? <CheckCircle className="text-emerald-500" /> : <XCircle className="text-destructive" />}
            Questão sobre {question.Assunto}
          </CardTitle>
          <Badge variant="outline">{question.Materia}</Badge>
        </div>
        <CardDescription className="pt-4 text-base text-foreground whitespace-pre-line">
            {formatEnunciado(question.Enunciado)}
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

export default function ExamResultsPage() {
  const [results, setResults] = useState<ExamResultsData | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const examName = searchParams.get('examName');


  useEffect(() => {
    const resultsDataString = localStorage.getItem('examResults');
    if (resultsDataString) {
      setResults(JSON.parse(resultsDataString));
      // Optional: Clean up localStorage after use
      // localStorage.removeItem('examResults');
    } else {
      // Handle case where user navigates directly to this page
      // Redirect or show an error
      router.push('/mentorlite/simulated-exams');
    }
  }, [router]);

  const performanceBySubject = useMemo((): { [subjectName: string]: SubjectStats } => {
    if (!results) return {};

    const stats: { [subjectName: string]: SubjectStats } = {};

    for (const q of results.questions) {
      const subject = q.Materia;
      const topic = q.Assunto;
      const userAnswer = results.userAnswers[q.id];
      const isCorrect = userAnswer && userAnswer.toLowerCase() === q.correctAnswer.toLowerCase();

      // Initialize subject stats if not present
      if (!stats[subject]) {
        stats[subject] = { total: 0, correct: 0, incorrect: 0, percentage: 0, topics: {} };
      }
      
      // Initialize topic stats if not present
      if (!stats[subject].topics[topic]) {
        stats[subject].topics[topic] = { total: 0, correct: 0, incorrect: 0, percentage: 0 };
      }
      
      // Update counts
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
    
    // Calculate percentages
    for (const subject in stats) {
      stats[subject].percentage = (stats[subject].correct / stats[subject].total) * 100;
      for (const topic in stats[subject].topics) {
        const topicStats = stats[subject].topics[topic];
        topicStats.percentage = (topicStats.correct / topicStats.total) * 100;
      }
    }

    return stats;
  }, [results]);


  if (!results) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Carregando resultados...</p>
      </div>
    );
  }

  const { questions, userAnswers } = results;

  const correctAnswersCount = questions.reduce((acc, q) => {
    const userAnswer = userAnswers[q.id];
    if (userAnswer && userAnswer.toLowerCase() === q.correctAnswer.toLowerCase()) {
      return acc + 1;
    }
    return acc;
  }, 0);
  
  const totalQuestions = questions.length;
  const scorePercentage = totalQuestions > 0 ? (correctAnswersCount / totalQuestions) * 100 : 0;
  
  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Resultado do Simulado</h1>
        <p className="text-muted-foreground">{examName || results.exam.name}</p>
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
                    <p className="text-2xl font-semibold">{totalQuestions - correctAnswersCount}</p>
                    <p className="text-sm text-muted-foreground">Respostas Erradas</p>
                </div>
                 <div>
                    <p className="text-2xl font-semibold">{totalQuestions}</p>
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
            {Object.entries(performanceBySubject).map(([subject, stats]) => (
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
                  <Accordion type="single" collapsible className="w-full pl-4">
                     {Object.entries(stats.topics).map(([topic, topicStats]) => (
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
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Gabarito Detalhado</h2>
        {questions.map((q) => (
          <ResultDetails key={q.id} question={q} userAnswer={userAnswers[q.id]} />
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
