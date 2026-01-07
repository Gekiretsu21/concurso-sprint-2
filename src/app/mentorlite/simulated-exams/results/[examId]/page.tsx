'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Home, XCircle } from 'lucide-react';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

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
          <CardTitle>Seu Desempenho</CardTitle>
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

      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Gabarito Detalhado</h2>
        {questions.map((q, index) => (
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
