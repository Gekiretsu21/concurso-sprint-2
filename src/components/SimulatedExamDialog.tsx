'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { FileText, Loader2 } from 'lucide-react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { useFirebase, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { createSimulatedExam } from '@/firebase/actions';
import { useToast } from '@/hooks/use-toast';
import { collection, DocumentData } from 'firebase/firestore';

const QUESTION_COUNTS = Array.from({ length: 20 }, (_, i) => i + 1);

interface SubjectSelection {
  [subject: string]: number;
}

export function SimulatedExamDialog() {
  const { firestore } = useFirebase();
  const { user } = useUser();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [examName, setExamName] = useState('');
  const [subjectSelections, setSubjectSelections] = useState<SubjectSelection>(
    {}
  );
  
  const questionsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'questoes') : null),
    [firestore]
  );
  const { data: allQuestions, isLoading: isLoadingSubjects } = useCollection<DocumentData>(questionsQuery);
  
  const availableSubjects = useMemo((): string[] => {
    if (!allQuestions) return [];
    
    const subjects = new Set<string>();
    allQuestions.forEach(q => {
        const subject = q.Materia;
        const isHidden = q.status === 'hidden';
        if (subject && subject.trim().toLowerCase() !== 'materia' && !isHidden) {
            subjects.add(subject);
        }
    });

    return Array.from(subjects).sort();
  }, [allQuestions]);


  const handleGenerate = async () => {
    if (!firestore || !user) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Você precisa estar logado para criar um simulado.',
      });
      return;
    }
    if (!examName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Erro de Validação',
        description: 'Por favor, insira um nome para o simulado.',
      });
      return;
    }
    const selectedSubjects = Object.entries(subjectSelections).filter(
      ([, count]) => count > 0
    );
    if (selectedSubjects.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Erro de Validação',
        description: 'Selecione pelo menos uma matéria e a quantidade de questões.',
      });
      return;
    }

    setIsLoading(true);
    try {
      await createSimulatedExam(firestore, user.uid, {
        name: examName,
        subjects: Object.fromEntries(selectedSubjects),
      });
      toast({
        title: 'Sucesso!',
        description: `Simulado "${examName}" criado com sucesso.`,
      });
      setExamName('');
      setSubjectSelections({});
      setIsOpen(false);
    } catch (error) {
      console.error(error);
      let message = 'Não foi possível gerar o simulado. Tente novamente.';
      if (error instanceof Error) {
        message = error.message;
      }
      toast({
        variant: 'destructive',
        title: 'Erro na Geração',
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubjectCountChange = (subject: string, value: string) => {
    const count = Number(value);
    setSubjectSelections(prev => ({ ...prev, [subject]: count }));
  };
  
  useEffect(() => {
    // Reset selections when the dialog is closed
    if (!isOpen) {
      setExamName('');
      setSubjectSelections({});
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <FileText />
          Gerar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Gerar Novo Simulado</DialogTitle>
          <DialogDescription>
            Configure seu simulado selecionando as matérias e o número de
            questões.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="exam-name">Nome do Simulado</Label>
            <Input
              id="exam-name"
              placeholder="Ex: Simulado PPMG 2024"
              value={examName}
              onChange={e => setExamName(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            <Label>Matérias e Questões</Label>
            {isLoadingSubjects ? (
                 <div className="flex items-center justify-center p-4"><Loader2 className="h-6 w-6 animate-spin"/></div>
            ) : (
                <div className="space-y-3">
                {availableSubjects.map(subject => (
                    <div
                    key={subject}
                    className="grid grid-cols-2 items-center gap-4"
                    >
                    <Label htmlFor={`subject-${subject}`} className="text-sm">
                        {subject}
                    </Label>
                    <Select
                        value={String(subjectSelections[subject] || 0)}
                        onValueChange={value =>
                        handleSubjectCountChange(subject, value)
                        }
                    >
                        <SelectTrigger>
                        <SelectValue placeholder="Nº de Questões" />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="0">0 questões</SelectItem>
                        {QUESTION_COUNTS.map(count => (
                            <SelectItem key={count} value={String(count)}>
                            {count} questões
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    </div>
                ))}
                </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button
            onClick={handleGenerate}
            disabled={isLoading || isLoadingSubjects}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Gerar Simulado
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
