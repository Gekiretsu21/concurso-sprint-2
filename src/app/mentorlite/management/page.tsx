'use client';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
import { useToast } from '@/hooks/use-toast';
import { ClipboardPaste, FileText, Layers, Loader2, Trash2, ArchiveX, HelpCircle } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { importQuestions, importFlashcards, deletePreviousExams, deleteCommunitySimulados, deleteFlashcards } from '@/firebase/actions';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { useUser } from '@/firebase/auth/use-user';
import { SubjectCard } from '@/components/SubjectCard';
import { SimulatedExamDialog } from '@/components/SimulatedExamDialog';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import Link from 'next/link';
import { collection, DocumentData, query } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// Helper to generate a URL-friendly slug from a subject name
const createSubjectSlug = (subject: string) => {
  return subject
    .toLowerCase()
    .replace(/ /g, '-') // Replace spaces with hyphens for URL
    .normalize('NFD') // Normalize accents to separate them from letters
    .replace(/[\u0300-\u036f]/g, '') // Remove the accents
    .replace(/[^a-z0-9-]/g, ''); // Remove any remaining special characters
};

interface SubjectWithCount {
    name: string;
    count: number;
}

interface PreviousExam {
  id: string;
  name: string;
}

interface CommunitySimulado {
    id: string;
    name: string;
}

interface Flashcard {
  id: string;
  front: string;
  subject: string;
}


function DeletePreviousExamsDialog() {
  const { firestore } = useFirebase();
  const { user } = useUser();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedExams, setSelectedExams] = useState<string[]>([]);
  
  const examsQuery = useMemoFirebase(() =>
      firestore
        ? query(collection(firestore, `previousExams`))
        : null,
    [firestore]
  );
  const { data: exams, isLoading } = useCollection<PreviousExam>(examsQuery);

  const handleCheckboxChange = (examId: string) => {
    setSelectedExams(prev => 
      prev.includes(examId) ? prev.filter(id => id !== examId) : [...prev, examId]
    );
  };

  const handleDelete = async () => {
    if (!firestore || !user || selectedExams.length === 0) return;
    
    setIsDeleting(true);
    try {
      await deletePreviousExams(firestore, user.uid, selectedExams);
      toast({
        title: "Sucesso!",
        description: `${selectedExams.length} prova(s) anterior(es) foram excluídas.`
      });
      setSelectedExams([]);
      setIsOpen(false);
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Erro ao Excluir',
        description: 'Não foi possível excluir as provas selecionadas.',
      });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm" disabled={!user}>
          <ArchiveX />
          Excluir Provas
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Excluir Provas Anteriores</DialogTitle>
          <DialogDescription>
            Selecione as provas que você deseja excluir permanentemente. Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-72 my-4">
            <div className="space-y-4 pr-6">
            {isLoading && <div className="flex items-center justify-center p-4"><Loader2 className="h-6 w-6 animate-spin"/></div>}
            {!isLoading && exams && exams.length > 0 ? exams.map(exam => (
                <div key={exam.id} className="flex items-center space-x-2 rounded-md border p-3">
                    <Checkbox
                        id={`exam-${exam.id}`}
                        checked={selectedExams.includes(exam.id)}
                        onCheckedChange={() => handleCheckboxChange(exam.id)}
                    />
                    <Label htmlFor={`exam-${exam.id}`} className="flex-1 cursor-pointer">
                        {exam.name}
                    </Label>
                </div>
            )) : !isLoading && <p className="text-sm text-muted-foreground text-center py-4">Nenhuma prova anterior encontrada.</p>}
            </div>
        </ScrollArea>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting || selectedExams.length === 0}>
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Excluir ({selectedExams.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteCommunitySimuladosDialog() {
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedSimulados, setSelectedSimulados] = useState<string[]>([]);
  
  const simuladosQuery = useMemoFirebase(() =>
      firestore ? query(collection(firestore, `communitySimulados`)) : null,
    [firestore]
  );
  const { data: simulados, isLoading } = useCollection<CommunitySimulado>(simuladosQuery);

  const handleCheckboxChange = (simuladoId: string) => {
    setSelectedSimulados(prev => 
      prev.includes(simuladoId) ? prev.filter(id => id !== simuladoId) : [...prev, simuladoId]
    );
  };

  const handleDelete = async () => {
    if (!firestore || selectedSimulados.length === 0) return;
    
    setIsDeleting(true);
    try {
      await deleteCommunitySimulados(firestore, selectedSimulados);
      toast({
        title: "Sucesso!",
        description: `${selectedSimulados.length} simulado(s) da comunidade foram excluídos.`
      });
      setSelectedSimulados([]);
      setIsOpen(false);
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Erro ao Excluir',
        description: 'Não foi possível excluir os simulados selecionados.',
      });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm" disabled={!firestore}>
          <Trash2 />
          Excluir Simulados
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Excluir Simulados da Comunidade</DialogTitle>
          <DialogDescription>
            Selecione os simulados da comunidade que você deseja excluir permanentemente.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-72 my-4">
            <div className="space-y-4 pr-6">
            {isLoading && <div className="flex items-center justify-center p-4"><Loader2 className="h-6 w-6 animate-spin"/></div>}
            {!isLoading && simulados && simulados.length > 0 ? simulados.map(simulado => (
                <div key={simulado.id} className="flex items-center space-x-2 rounded-md border p-3">
                    <Checkbox
                        id={`simulado-${simulado.id}`}
                        checked={selectedSimulados.includes(simulado.id)}
                        onCheckedChange={() => handleCheckboxChange(simulado.id)}
                    />
                    <Label htmlFor={`simulado-${simulado.id}`} className="flex-1 cursor-pointer">
                        {simulado.name}
                    </Label>
                </div>
            )) : !isLoading && <p className="text-sm text-muted-foreground text-center py-4">Nenhum simulado da comunidade encontrado.</p>}
            </div>
        </ScrollArea>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting || selectedSimulados.length === 0}>
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Excluir ({selectedSimulados.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteFlashcardsDialog() {
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedFlashcards, setSelectedFlashcards] = useState<string[]>([]);
  
  const flashcardsQuery = useMemoFirebase(() =>
      firestore ? query(collection(firestore, `flashcards`)) : null,
    [firestore]
  );
  const { data: flashcards, isLoading } = useCollection<Flashcard>(flashcardsQuery);

  const handleCheckboxChange = (flashcardId: string) => {
    setSelectedFlashcards(prev => 
      prev.includes(flashcardId) ? prev.filter(id => id !== flashcardId) : [...prev, flashcardId]
    );
  };

  const handleDelete = async () => {
    if (!firestore || selectedFlashcards.length === 0) return;
    
    setIsDeleting(true);
    try {
      await deleteFlashcards(firestore, selectedFlashcards);
      toast({
        title: "Sucesso!",
        description: `${selectedFlashcards.length} flashcard(s) foram excluídos.`
      });
      setSelectedFlashcards([]);
      setIsOpen(false);
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Erro ao Excluir',
        description: 'Não foi possível excluir os flashcards selecionados.',
      });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm" disabled={!firestore}>
          <Layers />
          Excluir Flashcards
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Excluir Flashcards</DialogTitle>
          <DialogDescription>
            Selecione os flashcards que você deseja excluir permanentemente.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-72 my-4">
            <div className="space-y-4 pr-6">
            {isLoading && <div className="flex items-center justify-center p-4"><Loader2 className="h-6 w-6 animate-spin"/></div>}
            {!isLoading && flashcards && flashcards.length > 0 ? flashcards.map(flashcard => (
                <div key={flashcard.id} className="flex items-center space-x-2 rounded-md border p-3">
                    <Checkbox
                        id={`flashcard-${flashcard.id}`}
                        checked={selectedFlashcards.includes(flashcard.id)}
                        onCheckedChange={() => handleCheckboxChange(flashcard.id)}
                    />
                    <Label htmlFor={`flashcard-${flashcard.id}`} className="flex-1 cursor-pointer truncate">
                        {flashcard.front}
                    </Label>
                </div>
            )) : !isLoading && <p className="text-sm text-muted-foreground text-center py-4">Nenhum flashcard encontrado.</p>}
            </div>
        </ScrollArea>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting || selectedFlashcards.length === 0}>
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Excluir ({selectedFlashcards.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


export default function ManagementPage() {
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const [questionText, setQuestionText] = useState('');
  const [flashcardText, setFlashcardText] = useState('');
  const [isImportingQuestions, setIsImportingQuestions] = useState(false);
  const [isImportingFlashcards, setIsImportingFlashcards] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isPreviousExam, setIsPreviousExam] = useState(false);
  const [examName, setExamName] = useState('');

  useEffect(() => {
    setIsClient(true);
  }, []);

  const questionsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'questoes') : null),
    [firestore]
  );
  const { data: allQuestions, isLoading: isLoadingSubjects } = useCollection<DocumentData>(questionsQuery);

  const availableSubjects = useMemo((): SubjectWithCount[] => {
    if (!allQuestions) return [];

    const subjectCounts = allQuestions.reduce((acc, q) => {
        const subject = q.Materia;
        const isHidden = q.status === 'hidden';

        if (subject && subject.trim() && !isHidden) {
            let subjectName = subject.trim();
            
            if (subjectName.toLowerCase() !== 'materia') {
                if (!acc[subjectName]) {
                    acc[subjectName] = { name: subjectName, count: 0 };
                }
                acc[subjectName].count++;
            }
        }
        return acc;
    }, {} as Record<string, {name: string, count: number}>);
    
    // Unify "Língua Portuguesa" variations
    const portuguesComAcento = subjectCounts['Língua Portuguesa'];
    const portuguesSemAcento = subjectCounts['Lingua Portuguesa'];
    if (portuguesComAcento || portuguesSemAcento) {
        const total = (portuguesComAcento?.count || 0) + (portuguesSemAcento?.count || 0);
        if (portuguesComAcento) delete subjectCounts['Lingua Portuguesa'];
        if (portuguesSemAcento) delete subjectCounts['Língua Portuguesa'];
        subjectCounts['Língua Portuguesa'] = { name: 'Língua Portuguesa', count: total };
    }

    // Unify "Legislação Jurídica" variations
    const legislacaoComAcento = subjectCounts['Legislação Jurídica'];
    const legislacaoSemAcento = subjectCounts['Legislacao Juridica'];
     if (legislacaoComAcento || legislacaoSemAcento) {
        const total = (legislacaoComAcento?.count || 0) + (legislacaoSemAcento?.count || 0);
        if (legislacaoComAcento) delete subjectCounts['Legislacao Juridica'];
        if (legislacaoSemAcento) delete subjectCounts['Legislação Jurídica'];
        subjectCounts['Legislação Jurídica'] = { name: 'Legislação Jurídica', count: total };
    }
    
    // Unify "Legislação Institucional" variations
    const institucionalComAcento = subjectCounts['Legislação Institucional'];
    const institucionalSemAcento = subjectCounts['Legislacao Institucional'];
    if (institucionalComAcento || institucionalSemAcento) {
        const total = (institucionalComAcento?.count || 0) + (institucionalSemAcento?.count || 0);
        if (institucionalComAcento) delete subjectCounts['Legislacao Institucional'];
        if (institucionalSemAcento) delete subjectCounts['Legislação Institucional'];
        subjectCounts['Legislação Institucional'] = { name: 'Legislação Institucional', count: total };
    }


    return Object.values(subjectCounts)
        .sort((a, b) => a.name.localeCompare(b.name));
  }, [allQuestions]);

  const handleImportQuestions = () => {
    if (!firestore || !user) {
      toast({
        variant: 'destructive',
        title: 'Erro de Conexão',
        description: 'Não foi possível conectar ao banco de dados ou você não está logado.',
      });
      return;
    }
    setIsImportingQuestions(true);
    
    const examDetails = isPreviousExam ? { isPreviousExam, examName } : undefined;
    
    importQuestions(firestore, questionText, user.uid, examDetails)
      .then(() => {
        toast({
            title: 'Importação Iniciada',
            description: 'As questões estão sendo importadas em segundo plano.',
        });
        setQuestionText('');
        setExamName('');
        setIsPreviousExam(false);
      })
      .catch((error) => {
        let message = 'Ocorreu um erro ao importar as questões.';
        if (error instanceof Error) {
          message = error.message;
        }
        toast({
          variant: 'destructive',
          title: 'Erro na Importação',
          description: message,
        });
      })
      .finally(() => {
        setIsImportingQuestions(false);
      });
  };

  const handleImportFlashcards = async () => {
    if (!firestore) {
      toast({
        variant: 'destructive',
        title: 'Erro de Conexão',
        description: 'Não foi possível conectar ao banco de dados.',
      });
      return;
    }
    setIsImportingFlashcards(true);
    try {
      await importFlashcards(firestore, flashcardText);
      toast({
        title: 'Importação Concluída',
        description: 'Os flashcards foram importados com sucesso!',
      });
      setFlashcardText('');
    } catch (error) {
      let message = 'Ocorreu um erro ao importar os flashcards.';
      if (error instanceof Error) {
        message = error.message;
      }
      toast({
        variant: 'destructive',
        title: 'Erro na Importação',
        description: message,
      });
    } finally {
      setIsImportingFlashcards(false);
    }
  };

  const isButtonDisabled = !user || isUserLoading;

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Gerenciamento</h1>
        <p className="text-muted-foreground">
          Gerencie as configurações e dados do aplicativo.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6">
        <Card className="md:col-span-2">
            <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
                <CardDescription>Principais ferramentas para gerenciamento de conteúdo.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Importar Questões */}
                <div className="relative flex flex-col justify-between p-4 rounded-lg border h-full">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6">
                                <HelpCircle className="h-4 w-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                             <DialogHeader>
                                <DialogTitle>Modelo de Importação</DialogTitle>
                                <DialogDescription>
                                    Use o formato abaixo, separando cada campo com uma barra (`/`). Cada questão deve terminar com um ponto e vírgula (`;`).
                                </DialogDescription>
                            </DialogHeader>
                            <div className="w-fit rounded-md bg-muted p-4 text-sm font-mono mt-4">
                                Materia/Ano/Assunto/Cargo/Enunciado/a/b/c/d/e/correctAnswer;
                            </div>
                        </DialogContent>
                    </Dialog>
                    <div>
                        <h4 className="font-semibold">Importar Questões</h4>
                        <p className="text-sm text-muted-foreground mt-1">Importe questões em massa.</p>
                    </div>
                     <Dialog>
                        {isClient ? (
                            <DialogTrigger asChild>
                            <Button size="sm" className="mt-4" disabled={isButtonDisabled}>
                                {isUserLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ClipboardPaste />}
                                {isUserLoading ? 'Carregando...' : 'Importar'}
                            </Button>
                            </DialogTrigger>
                        ) : (
                            <Button size="sm" className="mt-4" disabled={true}><ClipboardPaste /> Importar</Button>
                        )}
                        <DialogContent className="sm:max-w-4xl">
                            <DialogHeader>
                            <DialogTitle>Importar Questões por Texto</DialogTitle>
                            <DialogDescription>
                                Cole o conteúdo no campo abaixo. Certifique-se de que o formato esteja correto.
                            </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="question-text">Conteúdo</Label>
                                <Textarea
                                id="question-text"
                                className="min-h-[350px]"
                                placeholder="Cole seu texto aqui..."
                                value={questionText}
                                onChange={e => setQuestionText(e.target.value)}
                                />
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="is-previous-exam" checked={isPreviousExam} onCheckedChange={(checked) => setIsPreviousExam(checked as boolean)} />
                                    <Label htmlFor="is-previous-exam">Prova Anterior</Label>
                                </div>
                                <div className={cn("transition-all duration-300 ease-in-out", isPreviousExam ? "max-h-40 opacity-100" : "max-h-0 opacity-0 overflow-hidden")}>
                                    {isPreviousExam && (
                                        <div className="space-y-2">
                                        <Label htmlFor="exam-name">Nome da Prova</Label>
                                        <Input id="exam-name" value={examName} onChange={(e) => setExamName(e.target.value)} placeholder="Ex: PMMG Soldado 2023"/>
                                        </div>
                                    )}
                                </div>
                            </div>
                            </div>
                            <DialogFooter>
                            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                            <Button
                                onClick={handleImportQuestions}
                                disabled={isImportingQuestions || !questionText || (isPreviousExam && !examName.trim())}
                            >
                                {isImportingQuestions ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Importar Questões
                            </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
                
                {/* Gerador de Simulados */}
                <div className="flex flex-col justify-between p-4 rounded-lg border h-full">
                    <div>
                        <h4 className="font-semibold">Gerador de Simulados</h4>
                        <p className="text-sm text-muted-foreground mt-1">Crie simulados para a comunidade.</p>
                    </div>
                     {isClient ? (
                        <SimulatedExamDialog />
                    ) : (
                        <Button size="sm" className="mt-4" disabled><FileText />Gerar</Button>
                    )}
                </div>

                {/* Importar Flashcards */}
                <div className="flex flex-col justify-between p-4 rounded-lg border h-full">
                    <div>
                        <h4 className="font-semibold">Importar Flashcards</h4>
                        <p className="text-sm text-muted-foreground mt-1">Importe flashcards em massa.</p>
                    </div>
                    <Dialog>
                        {isClient ? (
                            <DialogTrigger asChild>
                            <Button size="sm" className="mt-4" disabled={isButtonDisabled}>
                                {isUserLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Layers />}
                                {isUserLoading ? 'Carregando...' : 'Importar'}
                            </Button>
                            </DialogTrigger>
                        ) : (
                            <Button size="sm" className="mt-4" disabled={true}><Layers />Importar</Button>
                        )}
                        <DialogContent className="sm:max-w-4xl">
                            <DialogHeader>
                            <DialogTitle>Importar Flashcards por Texto</DialogTitle>
                            <DialogDescription>
                                Cole o conteúdo no campo abaixo, usando "|" como separador: Matéria | Assunto | Cargo | Pergunta | Resposta
                            </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="flashcard-text">Conteúdo</Label>
                                <Textarea
                                id="flashcard-text"
                                className="min-h-[350px]"
                                placeholder="Direito Administrativo | Atos Administrativos | Geral | Quais são os atributos do ato administrativo? | Presunção de legitimidade, autoexecutoriedade, tipicidade e imperatividade (mnemônico: PATI).
Língua Portuguesa | Crase | Analista Judiciário | Quando a crase é facultativa antes de nomes próprios femininos? | A crase é facultativa, pois o artigo 'a' antes do nome é opcional."
                                value={flashcardText}
                                onChange={e => setFlashcardText(e.target.value)}
                                />
                            </div>
                            </div>
                            <DialogFooter>
                            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                            <Button
                                onClick={handleImportFlashcards}
                                disabled={isImportingFlashcards || !flashcardText}
                            >
                                {isImportingFlashcards ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Importar Flashcards
                            </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

            </CardContent>
        </Card>

        <Card className="md:col-span-2">
            <CardHeader>
                <CardTitle>Ferramentas de Manutenção</CardTitle>
                <CardDescription>Ações para organizar e limpar seus dados.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="flex flex-col justify-between p-4 rounded-lg border h-full">
                    <div>
                        <h4 className="font-semibold">Excluir Provas</h4>
                        <p className="text-sm text-muted-foreground mt-1">Gerencie as provas importadas.</p>
                    </div>
                    <DeletePreviousExamsDialog />
                </div>
                 <div className="flex flex-col justify-between p-4 rounded-lg border h-full">
                    <div>
                        <h4 className="font-semibold">Excluir Simulados</h4>
                        <p className="text-sm text-muted-foreground mt-1">Gerencie os simulados criados.</p>
                    </div>
                    <DeleteCommunitySimuladosDialog />
                </div>
                <div className="flex flex-col justify-between p-4 rounded-lg border h-full">
                    <div>
                        <h4 className="font-semibold">Excluir Flashcards</h4>
                        <p className="text-sm text-muted-foreground mt-1">Gerencie os flashcards importados.</p>
                    </div>
                    <DeleteFlashcardsDialog />
                </div>
            </CardContent>
        </Card>
      </div>


      <div className="space-y-6">
        <h3 className="text-2xl font-bold tracking-tight">Recursos</h3>
        {isLoadingSubjects ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          availableSubjects.map(subject => (
            <SubjectCard 
              key={subject.name}
              subject={subject.name}
              questionCount={subject.count}
              href={`/mentorlite/management/${createSubjectSlug(subject.name)}`}
            />
          ))
        )}
        <Card>
            <Link href="/mentorlite/flashcards">
                <CardHeader className="flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2"><Layers /> Flashcards</CardTitle>
                        <CardDescription className="mt-1">
                        Acesse e estude todos os flashcards importados.
                        </CardDescription>
                    </div>
                </CardHeader>
            </Link>
        </Card>
      </div>
    </div>
  );
}
