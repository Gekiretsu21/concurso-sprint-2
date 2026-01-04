'use client';

import { useMemo, useState } from 'react';
import { useDoc, useFirebase } from '@/firebase';
import { doc, getDoc, DocumentReference } from 'firebase/firestore';
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

interface SimulatedExam {
  id: string;
  name: string;
  questionIds: string[];
}

function formatEnunciado(text: string) {
  if (!text) return '';
  return text.replace(/\b(I|II|III|IV|V|VI|VII|VIII|IX|X)[\s-]/g, '\n$&');
}

function QuestionCard({
  question,
  index,
}: {
  question: Question;
  index: number;
}) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const alternativesKeys: (keyof Question)[] = ['a', 'b', 'c', 'd', 'e'];
  const selected = selectedAnswer;
  const isCorrect = String(selected).toLowerCase() === String(question.correctAnswer).toLowerCase();
  const userHasCorrectlyAnswered = isAnswered && isCorrect;
  const userHasIncorrectlyAnswered = isAnswered && !isCorrect;

  const handleSelectAnswer = (questionId: string, answer: string) => {
    if (isAnswered) return;
    setSelectedAnswer(prev => (prev === answer ? null : answer));
  };

  const handleConfirmAnswer = () => {
    setIsAnswered(true);
  };
  
  const getAlternativeClassName = () => {
    const currentKeyNormalized = (key: string) => key.toLowerCase();
    const correctAnswerNormalized = String(question.correctAnswer).toLowerCase();
    const selectedNormalized = String(selected).toLowerCase();

    return (key: string) => {
      const normalizedKey = currentKeyNormalized(key);
      if (!isAnswered) {
        if (selectedNormalized === normalizedKey) return 'bg-gray-600/50 border-gray-500 text-foreground';
        return 'bg-background/30 border-white/10 hover:bg-white/20 text-muted-foreground';
      }

      if (isCorrect) {
         if (selectedNormalized === normalizedKey) return 'bg-teal-500/80 border-teal-400 text-white font-bold';
         return 'bg-background/30 border-white/5 opacity-50';
      }

      if (!isCorrect) {
        if (normalizedKey === correctAnswerNormalized) return 'bg-teal-500/80 border-teal-400 text-white font-bold';
        if (selectedNormalized === normalizedKey) return 'bg-destructive/50 border-destructive text-gray-400';
        return 'bg-background/20 border-white/5 opacity-30';
      }
    }
  };

  const alternativeClassNameFn = getAlternativeClassName();


  return (
    <div className="bg-black/60 border border-white/10 rounded-3xl shadow-lg shadow-black/30">
      <CardHeader className="p-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Questão {index + 1}</CardTitle>
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
      <CardContent className="p-6">
        <div className="space-y-3">
          {alternativesKeys.map((key, optIndex) => {
            const alternativeText = question[key];
            if (!alternativeText) return null;
            const alternativeKey = key.toString();
            return (
              <div
                key={optIndex}
                onClick={() => handleSelectAnswer(question.id, alternativeKey)}
                className={cn(
                  'flex items-start space-x-3 p-3 rounded-lg border transition-all duration-300',
                  isAnswered ? 'cursor-not-allowed' : 'cursor-pointer',
                  alternativeClassNameFn(alternativeKey)
                )}
              >
                <div
                  className={cn(
                    'flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full border text-sm font-bold',
                    isAnswered && !isCorrect && alternativeKey.toLowerCase() === String(question.correctAnswer).toLowerCase() ? 'bg-white text-teal-600 border-white' : 'bg-background border-white/20'
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
       <CardFooter className="p-6 flex flex-col items-stretch gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div className="text-sm min-h-[1.25rem]">
          {userHasCorrectlyAnswered && (
            <p className="text-teal-400 font-medium">Parabéns, resposta correta.</p>
          )}
          {userHasIncorrectlyAnswered && (
            <p className="text-gray-400 font-medium">
              Você errou. Gabarito: Letra {String(question.correctAnswer).toUpperCase()}
            </p>
          )}
        </div>
        <div className="flex gap-2 self-end sm:self-auto">
          <Button
            variant="outline"
            onClick={handleConfirmAnswer}
            disabled={!selected || isAnswered}
            className={isAnswered ? 'opacity-50' : ''}
          >
            {isAnswered ? 'Respondido' : 'Responder'}
          </Button>
          <Button variant="outline">Comentários</Button>
        </div>
      </CardFooter>
    </div>
  );
}

export default function SimulatedExamPage({
  params,
}: {
  params: { examId: string };
}) {
  const { firestore, user } = useFirebase();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);

  const examDocRef = useMemo(
    () =>
      firestore && user
        ? (doc(
            firestore,
            `users/${user.uid}/simulatedExams`,
            params.examId
          ) as DocumentReference<SimulatedExam>)
        : null,
    [firestore, user, params.examId]
  );

  const { data: exam, isLoading: isLoadingExam } = useDoc<SimulatedExam>(examDocRef);

  useEffect(() => {
    const fetchQuestions = async () => {
      if (!exam || !firestore) return;

      setIsLoadingQuestions(true);
      const fetchedQuestions: Question[] = [];
      for (const questionId of exam.questionIds) {
        const questionRef = doc(firestore, 'questoes', questionId);
        const questionSnap = await getDoc(questionRef);
        if (questionSnap.exists()) {
          fetchedQuestions.push({
            id: questionSnap.id,
            ...(questionSnap.data() as Omit<Question, 'id'>),
          });
        }
      }
      setQuestions(fetchedQuestions);
      setIsLoadingQuestions(false);
    };

    fetchQuestions();
  }, [exam, firestore]);
  
  const isLoading = isLoadingExam || isLoadingQuestions;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-center gap-4">
        <Button asChild variant="outline" size="icon">
          <Link href="/mentorlite/simulated-exams">
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
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : questions.length > 0 ? (
        <div className="space-y-6">
          {questions.map((q, index) => (
            <QuestionCard key={q.id} question={q} index={index} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 rounded-3xl border border-dashed border-white/20 bg-black/60">
          <p className="text-muted-foreground">
            Nenhuma questão encontrada para este simulado.
          </p>
          <Button variant="link" asChild>
            <Link href="/mentorlite/simulated-exams">
              Voltar para Simulados
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
