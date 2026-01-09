
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
import { FileText, Loader2, ChevronDown } from 'lucide-react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useFirebase, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { createSimulatedExam } from '@/firebase/actions';
import { useToast } from '@/hooks/use-toast';
import { collection, DocumentData, query, where } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';


const QUESTION_COUNTS = Array.from({ length: 20 }, (_, i) => i + 1);

interface SubjectSelection {
  [subject: string]: {
    count: number;
    topics: string[];
  };
}

export function SimulatedExamDialog() {
  const { firestore } = useFirebase();
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [examName, setExamName] = useState('');
  const [selectedCargo, setSelectedCargo] = useState<string>('all');
  const [subjectSelections, setSubjectSelections] = useState<SubjectSelection>(
    {}
  );
  
  const questionsQuery = useMemoFirebase(
    () => (firestore && user ? query(collection(firestore, 'questoes')) : null),
    [firestore, user]
  );
  const { data: allQuestions, isLoading: isLoadingQuestions } = useCollection<DocumentData>(questionsQuery);
  
  const availableResources = useMemo(() => {
    if (!allQuestions) return { subjects: [], topicsBySubject: {}, cargos: [] };
    
    const subjectCounts: Record<string, { name: string; count: number }> = {};
    const topicsBySubject: Record<string, Set<string>> = {};
    const cargosSet = new Set<string>();

    allQuestions.forEach(q => {
        const subject = q.Materia;
        const topic = q.Assunto;
        const cargo = q.Cargo;
        const isHidden = q.status === 'hidden';

        if (cargo && cargo.trim() && !isHidden) {
            cargosSet.add(cargo.trim());
        }

        if (subject && subject.trim() && !isHidden) {
            let subjectName = subject.trim();
            
            // Normalize subject names
            const subjectLower = subjectName.toLowerCase();
            if (subjectLower === 'lingua portuguesa') subjectName = 'Língua Portuguesa';
            if (subjectLower === 'legislacao juridica') subjectName = 'Legislação Jurídica';
            if (subjectLower === 'legislacao institucional') subjectName = 'Legislação Institucional';

            if (subjectName.toLowerCase() !== 'materia') {
                if (!subjectCounts[subjectName]) {
                    subjectCounts[subjectName] = { name: subjectName, count: 0 };
                    topicsBySubject[subjectName] = new Set();
                }
                subjectCounts[subjectName].count++;
                if (topic && topic.trim()) {
                    topicsBySubject[subjectName].add(topic.trim());
                }
            }
        }
    });

    return {
        subjects: Object.keys(subjectCounts).sort((a, b) => a.localeCompare(b)),
        topicsBySubject: Object.entries(topicsBySubject).reduce((acc, [subject, topicsSet]) => {
            acc[subject] = Array.from(topicsSet).sort();
            return acc;
        }, {} as Record<string, string[]>),
        cargos: Array.from(cargosSet).sort(),
    };
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
      ([, selection]) => selection.count > 0
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
        const examData = {
            name: examName,
            cargo: selectedCargo === 'all' ? undefined : selectedCargo,
            subjects: Object.fromEntries(selectedSubjects.map(([subject, selection]) => [subject, selection])),
        };
        const newExamId = await createSimulatedExam(firestore, user.uid, examData);
        
        toast({
            title: 'Sucesso!',
            description: `Simulado "${examName}" criado para a comunidade.`,
        });
        setExamName('');
        setSubjectSelections({});
        setSelectedCargo('all');
        setIsOpen(false);
        router.push(`/mentorlite/community-simulados`);

    } catch (error) {
        console.error(error);
        let message = 'Não foi possível iniciar a geração do simulado. Tente novamente.';
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
    setSubjectSelections(prev => ({
       ...prev, 
       [subject]: { ...prev[subject], count } 
    }));
  };
  
  const handleTopicChange = (subject: string, topic: string, checked: boolean) => {
    setSubjectSelections(prev => {
        const currentTopics = prev[subject]?.topics || [];
        const newTopics = checked
            ? [...currentTopics, topic]
            : currentTopics.filter(t => t !== topic);
        return {
            ...prev,
            [subject]: { ...prev[subject], topics: newTopics }
        };
    });
  };
  
  useEffect(() => {
    if (!isOpen) {
      setExamName('');
      setSubjectSelections({});
      setSelectedCargo('all');
    }
  }, [isOpen]);

  const getTopicButtonLabel = (subject: string) => {
    const selectedTopics = subjectSelections[subject]?.topics || [];
    if (selectedTopics.length === 0) {
      return "Todos os Assuntos";
    }
    if (selectedTopics.length === 1) {
      return selectedTopics[0];
    }
    return `${selectedTopics.length} assuntos selecionados`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button disabled={!user}>
          <FileText />
          Gerar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Gerar Novo Simulado para Comunidade</DialogTitle>
          <DialogDescription>
            Este simulado ficará disponível para todos os usuários.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="exam-name">Nome do Simulado</Label>
              <Input
                id="exam-name"
                placeholder="Ex: Simulado PPMG 2024"
                value={examName}
                onChange={e => setExamName(e.target.value)}
              />
            </div>
             <div className="space-y-2">
                <Label htmlFor="cargo-select">Cargo Alvo</Label>
                <Select value={selectedCargo} onValueChange={setSelectedCargo}>
                    <SelectTrigger id="cargo-select">
                        <SelectValue placeholder="Selecione o Cargo" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os Cargos</SelectItem>
                        {availableResources.cargos.map(cargo => (
                            <SelectItem key={cargo} value={cargo}>{cargo}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 px-2 font-medium">
                <Label>Matéria</Label>
                <Label>Assuntos</Label>
                <Label>Nº de Questões</Label>
            </div>
            {isLoadingQuestions ? (
                 <div className="flex items-center justify-center p-4"><Loader2 className="h-6 w-6 animate-spin"/></div>
            ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
                {availableResources.subjects.map(subject => (
                    <div
                    key={subject}
                    className="grid grid-cols-3 items-center gap-4"
                    >
                    <Label htmlFor={`subject-${subject}`} className="text-sm font-normal truncate">
                        {subject}
                    </Label>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between font-normal truncate">
                           {getTopicButtonLabel(subject)}
                           <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56" align="start">
                        {(availableResources.topicsBySubject[subject] || []).map(topic => (
                          <DropdownMenuCheckboxItem
                            key={topic}
                            checked={(subjectSelections[subject]?.topics || []).includes(topic)}
                            onCheckedChange={(checked) => handleTopicChange(subject, topic, !!checked)}
                             onSelect={(e) => e.preventDefault()}
                          >
                            {topic}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Select
                        value={String(subjectSelections[subject]?.count || 0)}
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
            disabled={isLoading || isLoadingQuestions}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Publicar Simulado
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
