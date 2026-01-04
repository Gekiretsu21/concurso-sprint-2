'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const questions = [
  {
    id: 1,
    subject: 'Direito Constitucional',
    difficulty: 'Média',
    text: 'De acordo com a Constituição Federal de 1988, qual dos seguintes não é um direito social?',
    options: ['Educação', 'Saúde', 'Moradia', 'Propriedade'],
    answer: 'Propriedade',
  },
  {
    id: 2,
    subject: 'Português',
    difficulty: 'Fácil',
    text: 'Assinale a alternativa em que a concordância verbal está INCORRETA.',
    options: ['Faltam apenas dois dias para a prova.', 'Houveram muitos problemas na organização.', 'Mais de um aluno chegou atrasado.', 'Fomos nós que resolvemos a questão.'],
    answer: 'Houveram muitos problemas na organização.',
  }
];

export default function QuestionsPage() {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);

    const currentQuestion = questions[currentQuestionIndex];
    
    const handleAnswer = () => {
        setIsAnswered(true);
    };

    const handleNext = () => {
        setIsAnswered(false);
        setSelectedAnswer(null);
        setCurrentQuestionIndex((prev) => (prev + 1) % questions.length);
    }

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Banco de Questões</h1>
        <p className="text-muted-foreground">Filtre as questões e teste seus conhecimentos.</p>
      </header>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <h2 className="text-xl font-bold">Filtros</h2>
            <div className="flex gap-4">
              <Select>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Matéria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="portugues">Português</SelectItem>
                  <SelectItem value="constitucional">Direito Constitucional</SelectItem>
                  <SelectItem value="administrativo">Direito Administrativo</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Dificuldade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="facil">Fácil</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="dificil">Difícil</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
            <CardDescription>{currentQuestion.subject} • {currentQuestion.difficulty}</CardDescription>
            <CardTitle className="text-xl">{currentQuestion.text}</CardTitle>
        </CardHeader>
        <CardContent>
            <RadioGroup onValueChange={setSelectedAnswer} value={selectedAnswer ?? undefined} disabled={isAnswered} className="space-y-3">
                {currentQuestion.options.map((option, index) => {
                    const isCorrect = option === currentQuestion.answer;
                    const isSelected = option === selectedAnswer;
                    
                    return (
                        <div key={index} className={cn("flex items-center space-x-3 p-3 rounded-lg border transition-colors", 
                          isAnswered && isCorrect && "bg-emerald-100 border-emerald-400 text-emerald-900",
                          isAnswered && isSelected && !isCorrect && "bg-destructive/10 border-destructive/40 text-destructive",
                          "hover:bg-secondary/80"
                        )}>
                            <RadioGroupItem value={option} id={`q${currentQuestion.id}-o${index}`} />
                            <Label htmlFor={`q${currentQuestion.id}-o${index}`} className="font-normal cursor-pointer flex-1">{option}</Label>
                        </div>
                    );
                })}
            </RadioGroup>
        </CardContent>
        <CardFooter className="justify-end gap-2">
            {isAnswered ? (
                 <Button onClick={handleNext}>Próxima</Button>
            ) : (
                <Button onClick={handleAnswer} disabled={!selectedAnswer}>Responder</Button>
            )}
        </CardFooter>
      </Card>
    </div>
  );
}
