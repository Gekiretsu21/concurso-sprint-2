'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useFirebase, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

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

const subjects = [
  'Direito Administrativo',
  'Direito Constitucional',
  'Direito Penal',
  'Português',
  'Informática',
  'Raciocínio Lógico',
];
const difficulties = ['Fácil', 'Média', 'Difícil'];

function QuestionDisplay({ questions }: { questions: Question[] }) {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);

    useEffect(() => {
        // Reset state when questions change
        setCurrentQuestionIndex(0);
        setSelectedAnswer(null);
        setIsAnswered(false);
    }, [questions]);


    if (!questions || questions.length === 0) {
        return (
             <Card className="mt-6">
                <CardContent className="flex flex-col items-center justify-center h-40 p-6">
                    <p className="text-muted-foreground">Nenhuma questão encontrada para os critérios selecionados.</p>
                </CardContent>
            </Card>
        )
    }

    const currentQuestion = questions[currentQuestionIndex];
    const alternativesKeys: (keyof Question)[] = ['a', 'b', 'c', 'd', 'e'];
    
    const handleAnswer = () => {
        setIsAnswered(true);
    };

    const handleNext = () => {
        setIsAnswered(false);
        setSelectedAnswer(null);
        setCurrentQuestionIndex((prev) => (prev + 1) % questions.length);
    }
    
     const isCorrect = String(selectedAnswer).toLowerCase() === String(currentQuestion.correctAnswer).toLowerCase();

    return (
        <Card className="mt-6">
            <CardHeader>
                <CardDescription>{currentQuestion.Materia} • {currentQuestion.Ano} • {currentQuestion.Assunto}</CardDescription>
                <CardTitle className="text-xl whitespace-pre-line">{currentQuestion.Enunciado}</CardTitle>
            </CardHeader>
            <CardContent>
                <RadioGroup onValueChange={setSelectedAnswer} value={selectedAnswer ?? undefined} disabled={isAnswered} className="space-y-3">
                    {alternativesKeys.map((key, index) => {
                        const optionText = currentQuestion[key];
                        if (!optionText) return null;

                        const optionKey = key.toString();
                        const isCorrectOption = optionKey.toLowerCase() === currentQuestion.correctAnswer.toLowerCase();
                        const isSelected = optionKey === selectedAnswer;
                        
                        return (
                            <div key={index} 
                                onClick={() => !isAnswered && setSelectedAnswer(optionKey)}
                                className={cn("flex items-center space-x-3 p-3 rounded-lg border transition-colors", 
                                  isAnswered && isCorrectOption && "bg-emerald-100 border-emerald-400 text-emerald-900 font-medium",
                                  isAnswered && isSelected && !isCorrectOption && "bg-destructive/10 border-destructive/40 text-destructive",
                                  !isAnswered && isSelected && "border-primary bg-secondary",
                                  !isAnswered && "cursor-pointer hover:bg-secondary/80"
                                )}>
                                <RadioGroupItem value={optionKey} id={`q${currentQuestion.id}-o${index}`} />
                                <Label htmlFor={`q${currentQuestion.id}-o${index}`} className="font-normal cursor-pointer flex-1">{optionText}</Label>
                            </div>
                        );
                    })}
                </RadioGroup>
            </CardContent>
            <CardFooter className="flex-col sm:flex-row justify-between items-center gap-4">
                 <div className="text-sm min-h-[1.25rem] text-left">
                    {isAnswered && isCorrect && (
                      <p className="text-emerald-600 font-medium">
                        Parabéns, resposta correta!
                      </p>
                    )}
                    {isAnswered && !isCorrect && (
                      <p className="text-destructive font-medium">
                        Você errou. Gabarito: Letra {currentQuestion.correctAnswer.toUpperCase()}
                      </p>
                    )}
                  </div>
                <div className="flex gap-2 self-end">
                    {isAnswered ? (
                        <Button onClick={handleNext}>Próxima</Button>
                    ) : (
                        <Button onClick={handleAnswer} disabled={!selectedAnswer}>Responder</Button>
                    )}
                </div>
            </CardFooter>
        </Card>
    );
}


export default function QuestionsPage() {
    const { firestore } = useFirebase();
    const [view, setView] = useState<'initial' | 'loading' | 'results'>('initial');

    // State for filters
    const [filterSubject, setFilterSubject] = useState<string>('');
    const [filterDifficulty, setFilterDifficulty] = useState<string>('');
    
    // State to trigger query
    const [activeQuery, setActiveQuery] = useState<any>(null);

    const questionsQuery = useMemoFirebase(() => activeQuery, [activeQuery]);
    const { data: questions, isLoading } = useCollection<Question>(questionsQuery);
    
    useEffect(() => {
        if (isLoading) {
            setView('loading');
        } else if (questions) {
            setView('results');
        }
    }, [isLoading, questions]);

    const handleChallengeClick = (subject: string) => {
        const newQuery = query(
            collection(firestore, 'questoes'),
            where('Materia', '==', subject),
            limit(20) // Fetch 20 random questions for challenge mode
        );
        setActiveQuery(newQuery);
    };

    const handleFilterSubmit = () => {
        if (!filterSubject) {
            // Maybe show a toast? For now, just console log.
            console.log("Selecione uma matéria para filtrar.");
            return;
        }

        let q = query(collection(firestore, 'questoes'), where('Materia', '==', filterSubject));

        // This is not a valid filter for Firestore, difficulty is not a field in the collection.
        // if (filterDifficulty && filterDifficulty !== 'todas') {
        //   q = query(q, where('difficulty', '==', filterDifficulty));
        // }

        setActiveQuery(q);
    };


  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Banco de Questões</h1>
        <p className="text-muted-foreground">Filtre as questões ou encare um desafio por matéria.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Filtros de Questões</CardTitle>
          <CardDescription>Selecione seus critérios e clique em "Buscar Questões" para começar a praticar.</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select value={filterSubject} onValueChange={setFilterSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Matéria" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                <SelectTrigger>
                  <SelectValue placeholder="Dificuldade (todas)" />
                </SelectTrigger>
                <SelectContent>
                   <SelectItem value="todas">Todas as dificuldades</SelectItem>
                   {difficulties.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button onClick={handleFilterSubmit} disabled={!filterSubject || view === 'loading'}>
                {view === 'loading' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Buscar Questões
             </Button>
            </div>
        </CardContent>
      </Card>
      
      {view === 'initial' && (
        <Card>
            <CardHeader>
                <CardTitle>Modo Desafio</CardTitle>
                <CardDescription>Se quer desafio, clique em alguma dessas matérias e encare o modo de estudo com questões das mais variadas dificuldades.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {subjects.map(subject => (
                    <Button key={subject} variant="secondary" onClick={() => handleChallengeClick(subject)}>
                        {subject}
                    </Button>
                ))}
            </CardContent>
        </Card>
      )}

      {view === 'loading' && (
         <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="ml-4 text-muted-foreground">Buscando questões...</p>
        </div>
      )}

      {view === 'results' && questions && (
        <QuestionDisplay questions={questions} />
      )}

    </div>
  );
}
