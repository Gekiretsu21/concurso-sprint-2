'use client';

import { useMemo, useState, useEffect } from 'react';
import { useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { doc, getDoc, DocumentReference, collection, getDocs, query, where } from 'firebase/firestore';
import {
  Card,
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
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';


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
  userId?: string; // It can be a community exam
  originalExamId?: string; // For community exams
}

type UserAnswers = { [questionId: string]: string };

function formatEnunciado(text: string) {
  if (!text) return '';
  return text.replace(/\b(I|II|III|IV|V|VI|VII|VIII|IX|X)[\s-]/g, '\n$&');
}

function QuestionCard({
  question,
  index,
  isPreviousExam = false,
  onAnswerSelect,
  userAnswer
}: {
  question: Question;
  index: number;
  isPreviousExam?: boolean;
  onAnswerSelect: (questionId: string, answer: string) => void;
  userAnswer?: string;
}) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(userAnswer || null);

  useEffect(() => {
    setSelectedAnswer(userAnswer || null);
  }, [userAnswer]);

  const alternativesKeys: (keyof Question)[] = ['a', 'b', 'c', 'd', 'e'];

  const handleSelectAnswer = (answer: string) => {
    const newAnswer = selectedAnswer === answer ? null : answer;
    setSelectedAnswer(newAnswer);
    onAnswerSelect(question.id, newAnswer || '');
  };
  
  const getAlternativeClassName = (alternativeKey: string) => {
    const selectedNormalized = String(selectedAnswer).toLowerCase();
    const currentKeyNormalized = alternativeKey.toLowerCase();
    
    if (selectedNormalized === currentKeyNormalized) return 'bg-secondary border-primary';
    return 'hover:bg-secondary/80';
  };


  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Questão {index + 1}</CardTitle>
          <div className="flex items-center gap-2 text-xs">
            <Badge variant="secondary">{question.Assunto}</Badge>
            <Badge variant="secondary">{question.Cargo}</Badge>
            <Badge variant="outline">{question.Ano}</Badge>
          </div>
        </div>
        <CardDescription className="pt-4 text-base text-foreground whitespace-pre-line">
          {formatEnunciado(question.Enunciado)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alternativesKeys.map((key, optIndex) => {
            const alternativeText = question[key];
            if (!alternativeText) return null;
            const alternativeKey = key.toString();
            return (
              <div
                key={optIndex}
                onClick={() => handleSelectAnswer(alternativeKey)}
                className={cn(
                  'flex items-start space-x-3 p-3 rounded-lg border transition-all duration-300',
                  isPreviousExam ? 'cursor-pointer' : 'cursor-default',
                  getAlternativeClassName(alternativeKey)
                )}
              >
                <div
                  className={cn(
                    'flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full border text-sm font-bold bg-background border-muted-foreground'
                  )}
                >
                  {String.fromCharCode(65 + optIndex)}
                </div>
                <div className="flex-1 pt-0.5">{alternativeText}</div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function Timer() {
    const [timeLeft, setTimeLeft] = useState(2 * 60 * 60); // 2 hours in seconds

    useEffect(() => {
        if (timeLeft <= 0) return;

        const timerId = setInterval(() => {
            setTimeLeft(timeLeft - 1);
        }, 1000);

        return () => clearInterval(timerId);
    }, [timeLeft]);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
    };

    const timerColor = () => {
        if (timeLeft <= 10 * 60) { // 10 minutes
            return 'text-red-500';
        }
        if (timeLeft <= 30 * 60) { // 30 minutes
            return 'text-yellow-500';
        }
        return 'text-green-500';
    };

    return (
        <div className={cn("text-2xl font-bold font-mono tracking-wider", timerColor())}>
            {formatTime(timeLeft)}
        </div>
    );
}


function SimulatedExamContent({ examId, from }: { examId: string, from: string | null }) {
  const router = useRouter();
  const isPreviousExam = from === 'previous-exams';
  const isCommunitySimulado = from === 'community-simulados';

  const { firestore, user } = useFirebase();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});

  const examDocRef = useMemoFirebase(
    () => {
      if (!firestore || !examId) return null;

      let collectionName = `users/${user?.uid}/simulatedExams`; 

      if (isPreviousExam) {
        collectionName = 'previousExams';
      } else if (isCommunitySimulado) {
        collectionName = 'communitySimulados';
      }
      
      return doc(firestore, collectionName, examId) as DocumentReference<SimulatedExam>;
    },
    [firestore, user?.uid, examId, isPreviousExam, isCommunitySimulado]
  );

  const { data: exam, isLoading: isLoadingExam } = useDoc<SimulatedExam>(examDocRef);

  useEffect(() => {
    const fetchQuestions = async () => {
      if (!exam || !firestore) return;

      setIsLoadingQuestions(true);
      const fetchedQuestions: Question[] = [];
      const questionIdsBatches: string[][] = [];
      
      // Split question IDs into batches of 30
      for (let i = 0; i < exam.questionIds.length; i += 30) {
        questionIdsBatches.push(exam.questionIds.slice(i, i + 30));
      }

      // Process each batch
      for (const batch of questionIdsBatches) {
         if (batch.length === 0) continue;
        const q = query(collection(firestore, 'questoes'), where('__name__', 'in', batch));
        const questionSnapshots = await getDocs(q);
        const questionsMap = new Map(questionSnapshots.docs.map(doc => [doc.id, { id: doc.id, ...doc.data() as Omit<Question, 'id'>}]));
        
        // Ensure the order of questions is the same as in the exam document
        batch.forEach(id => {
          const question = questionsMap.get(id);
          if (question) {
            fetchedQuestions.push(question);
          }
        });
      }

      setQuestions(fetchedQuestions);
      setIsLoadingQuestions(false);
    };

    fetchQuestions();
  }, [exam, firestore]);
  
  const handleAnswerSelect = (questionId: string, answer: string) => {
    setUserAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleFinishExam = () => {
    const results = {
        exam,
        questions,
        userAnswers,
    };
    localStorage.setItem('examResults', JSON.stringify(results));
    router.push(`/mentorlite/simulated-exams/results/${examId}?examName=${encodeURIComponent(exam?.name || '')}`);
  };


  const getBackHref = () => {
    if (isPreviousExam) return '/mentorlite/previous-exams';
    if (isCommunitySimulado) return '/mentorlite/community-simulados';
    return '/mentorlite/simulated-exams';
  };

  const answeredCount = Object.values(userAnswers).filter(Boolean).length;
  const totalCount = questions.length;
  const allAnswered = answeredCount === totalCount;

  const isLoading = isLoadingExam || isLoadingQuestions;
  const backHref = getBackHref();

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
            <Button asChild variant="outline" size="icon">
            <Link href={backHref}>
                <ChevronLeft />
                <span className="sr-only">Voltar</span>
            </Link>
            </Button>
            <div>
            <h1 className="text-3xl font-bold tracking-tight">
                {exam ? exam.name : 'Carregando Simulado...'}
            </h1>
            <p className="text-muted-foreground">
                Resolva as questões do seu simulado.
            </p>
            </div>
        </div>
        <Timer />
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : questions.length > 0 ? (
        <div className="space-y-6">
          {questions.map((q, index) => (
            <QuestionCard 
                key={q.id} 
                question={q} 
                index={index} 
                isPreviousExam={isPreviousExam}
                onAnswerSelect={handleAnswerSelect}
                userAnswer={userAnswers[q.id]}
            />
          ))}
          {isPreviousExam && (
            <div className="flex justify-end mt-8">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button size="lg">Encerrar Prova</Button>
                </AlertDialogTrigger>
                { allAnswered ? (
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Finalizar Prova?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Você respondeu todas as questões. Deseja ver seu resultado agora?
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Voltar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleFinishExam}>Ver Resultado</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                ) : (
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Atenção</AlertDialogTitle>
                            <AlertDialogDescription>
                                Você não respondeu todas as questões ({answeredCount}/{totalCount}). As questões não respondidas serão contadas como erradas. Deseja mesmo encerrar a prova?
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Continuar Prova</AlertDialogCancel>
                            <AlertDialogAction onClick={handleFinishExam} className="bg-destructive hover:bg-destructive/90">
                                Encerrar Mesmo Assim
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                )}
              </AlertDialog>
            </div>
          )}
        </div>
      ) : (
        <Card className="flex flex-col items-center justify-center h-64">
          <CardContent className="text-center">
            <p className="text-muted-foreground">
              Nenhuma questão encontrada para este simulado.
            </p>
            <Button variant="link" asChild>
              <Link href={backHref}>
                Voltar
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function SimulatedExamPage({ params, searchParams }: { params: { examId: string }, searchParams: { [key: string]: string | string[] | undefined }}) {
    const examId = params.examId;
    const from = typeof searchParams.from === 'string' ? searchParams.from : null;
    return <SimulatedExamContent examId={examId} from={from} />;
}
