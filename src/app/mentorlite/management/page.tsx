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
import { ClipboardPaste, FileText, Layers, Loader2, Trash2, ArchiveX, HelpCircle, Sparkles, User, Crown, Search } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { importQuestions, importFlashcards, deletePreviousExams, deleteCommunitySimulados, deleteAllFlashcards, deleteFlashcardsByFilter, deleteFlashcardsByIds, deleteQuestionsByIds, deleteDuplicateQuestions, deleteDuplicateFlashcards, updateUserPlan } from '@/firebase/actions';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';


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
  topic: string;
  targetRole: string;
}

interface Question {
  id: string;
  Enunciado: string;
  Materia: string;
  Ano: string;
  Cargo: string;
  status?: 'active' | 'hidden';
}

interface UserProfile {
    id: string;
    name: string;
    email: string;
    subscription?: {
        plan: 'standard' | 'plus';
        status: 'active' | 'inactive' | 'canceled';
    };
}


function DeleteQuestionsDialog({ availableResources, allQuestions, isLoadingQuestions }: { availableResources: any, allQuestions: Question[] | null, isLoadingQuestions: boolean }) {
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterAno, setFilterAno] = useState<string>('all');
  const [filterCargo, setFilterCargo] = useState<string>('all');
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);

  // Reset filters and selection when dialog is closed/opened
  useEffect(() => {
    if (!isOpen) {
      setFilterSubject('all');
      setFilterAno('all');
      setFilterCargo('all');
      setSelectedQuestions([]);
    }
  }, [isOpen]);
  
  const filteredQuestions = useMemo(() => {
    if (!allQuestions) return [];
    return allQuestions.filter(q => {
      const subjectMatch = filterSubject === 'all' || q.Materia === filterSubject;
      const anoMatch = filterAno === 'all' || q.Ano === filterAno;
      const cargoMatch = filterCargo === 'all' || q.Cargo === filterCargo;
      return subjectMatch && anoMatch && cargoMatch;
    });
  }, [allQuestions, filterSubject, filterAno, filterCargo]);

  const handleCheckboxChange = (questionId: string) => {
    setSelectedQuestions(prev => 
      prev.includes(questionId) ? prev.filter(id => id !== questionId) : [...prev, questionId]
    );
  };

  const handleDeleteSelected = async () => {
    if (!firestore || selectedQuestions.length === 0) return;
    
    setIsDeleting(true);
    try {
      await deleteQuestionsByIds(firestore, selectedQuestions);
      toast({
        title: "Sucesso!",
        description: `${selectedQuestions.length} questão(ões) foram excluídas.`
      });
      setSelectedQuestions([]);
      // Do not close dialog, allow for more deletions
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Erro ao Excluir',
        description: 'Não foi possível excluir as questões selecionadas.',
      });
    } finally {
      setIsDeleting(false);
    }
  }

  const handleDeleteDuplicates = async () => {
    if (!firestore) return;
    setIsDeleting(true);
    try {
        const deletedCount = await deleteDuplicateQuestions(firestore);
        toast({
            title: "Limpeza Concluída",
            description: `${deletedCount} questão(ões) duplicada(s) foram excluídas.`,
        });
        setIsOpen(false);
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Erro na Limpeza',
            description: 'Ocorreu um erro ao tentar excluir questões duplicadas.',
        });
    } finally {
        setIsDeleting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm" disabled={isLoadingQuestions}>
          <Trash2 />
          Excluir Questões
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Excluir Questões</DialogTitle>
          <DialogDescription>
            Use os filtros para encontrar e excluir questões específicas.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
            <Select value={filterSubject} onValueChange={setFilterSubject}>
                <SelectTrigger><SelectValue placeholder="Matéria" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todas as Matérias</SelectItem>
                    {availableResources.questionSubjects.map((s: string) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
            </Select>
            <Select value={filterAno} onValueChange={setFilterAno}>
                <SelectTrigger><SelectValue placeholder="Ano" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos os Anos</SelectItem>
                    {availableResources.questionAnos.map((y: string) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                </SelectContent>
            </Select>
            <Select value={filterCargo} onValueChange={setFilterCargo}>
                <SelectTrigger><SelectValue placeholder="Cargo" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos os Cargos</SelectItem>
                    {availableResources.questionCargos.map((r: string) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
            </Select>
        </div>

        <ScrollArea className="max-h-72 my-4 border rounded-md">
            <div className="space-y-2 p-4">
            {isLoadingQuestions && <div className="flex items-center justify-center p-4"><Loader2 className="h-6 w-6 animate-spin"/></div>}
            {!isLoadingQuestions && filteredQuestions.length > 0 ? filteredQuestions.map(question => (
                <div key={question.id} className="flex items-center space-x-3 rounded-md border p-3 bg-muted/50">
                    <Checkbox
                        id={`question-${question.id}`}
                        checked={selectedQuestions.includes(question.id)}
                        onCheckedChange={() => handleCheckboxChange(question.id)}
                    />
                    <Label htmlFor={`question-${question.id}`} className="flex-1 cursor-pointer text-sm truncate">
                        {question.Enunciado}
                    </Label>
                </div>
            )) : !isLoadingQuestions && <p className="text-sm text-muted-foreground text-center py-4">Nenhuma questão corresponde aos filtros.</p>}
            </div>
        </ScrollArea>
        <DialogFooter className="sm:justify-between flex-wrap gap-2">
            <Button variant="outline" onClick={handleDeleteDuplicates} disabled={isDeleting}>
                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Sparkles className="mr-2 h-4 w-4" />
                Excluir Duplicadas
            </Button>
          <div className="flex gap-2">
            <DialogClose asChild><Button variant="outline">Fechar</Button></DialogClose>
             <Button variant="destructive" onClick={handleDeleteSelected} disabled={isDeleting || selectedQuestions.length === 0}>
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir ({selectedQuestions.length})
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


function DeletePreviousExamsDialog() {
  const { firestore } = useFirebase();
  const { user } = useUser();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedExams, setSelectedExams] = useState<string[]>([]);
  
  const examsQuery = useMemoFirebase(() =>
      firestore && user
        ? query(collection(firestore, `previousExams`))
        : null,
    [firestore, user]
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
  const { user } = useUser();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedSimulados, setSelectedSimulados] = useState<string[]>([]);
  
  const simuladosQuery = useMemoFirebase(() =>
      firestore && user ? query(collection(firestore, `communitySimulados`)) : null,
    [firestore, user]
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
        <Button variant="destructive" size="sm" disabled={!user}>
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

function DeleteFlashcardsDialog({ availableResources, allFlashcards, isLoadingFlashcards }: { availableResources: any, allFlashcards: Flashcard[] | null, isLoadingFlashcards: boolean }) {
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterTopic, setFilterTopic] = useState<string>('all');
  const [filterCargo, setFilterCargo] = useState<string>('all');
  const [selectedFlashcards, setSelectedFlashcards] = useState<string[]>([]);

  useEffect(() => {
    // Reset dependent filters when the main filter changes
    setFilterTopic('all');
    setFilterCargo('all');
    setSelectedFlashcards([]); // Also reset selection
  }, [filterSubject]);
  
  // Also reset selection when these filters change
  useEffect(() => setSelectedFlashcards([]), [filterTopic, filterCargo]);


  const filteredFlashcards = useMemo(() => {
    if (!allFlashcards) return [];
    return allFlashcards.filter(fc => {
      const subjectMatch = filterSubject === 'all' || fc.subject === filterSubject;
      const topicMatch = filterTopic === 'all' || fc.topic === filterTopic;
      const cargoMatch = filterCargo === 'all' || fc.targetRole === filterCargo;
      return subjectMatch && topicMatch && cargoMatch;
    });
  }, [allFlashcards, filterSubject, filterTopic, filterCargo]);

  const handleCheckboxChange = (flashcardId: string) => {
    setSelectedFlashcards(prev => 
      prev.includes(flashcardId) ? prev.filter(id => id !== flashcardId) : [...prev, flashcardId]
    );
  };

  const handleDeleteSelected = async () => {
    if (!firestore || selectedFlashcards.length === 0) return;
    
    setIsDeleting(true);
    try {
      await deleteFlashcardsByIds(firestore, selectedFlashcards);
      toast({
        title: "Sucesso!",
        description: `${selectedFlashcards.length} flashcard(s) foram excluídos.`
      });
      setSelectedFlashcards([]);
      // We don't close the dialog, just clear selection
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


  const handleDeleteByFilter = async () => {
    if (!firestore) return;
    if (filterSubject === 'all' && filterTopic === 'all' && filterCargo === 'all') {
      toast({
        variant: 'destructive',
        title: 'Ação Necessária',
        description: 'Selecione pelo menos um filtro para exclusão em massa, ou use "Excluir Todos".'
      });
      return;
    }
    
    setIsDeleting(true);
    try {
      const deletedCount = await deleteFlashcardsByFilter(firestore, {
        subject: filterSubject === 'all' ? undefined : filterSubject,
        topic: filterTopic === 'all' ? undefined : filterTopic,
        cargo: filterCargo === 'all' ? undefined : filterCargo,
      });
      toast({
        title: "Sucesso!",
        description: `${deletedCount} flashcard(s) foram excluídos com base nos filtros.`
      });
      // Reset filters after deletion
      setFilterSubject('all');
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

  const handleDeleteAll = async () => {
    if (!firestore) return;
    setIsDeleting(true);
    try {
      await deleteAllFlashcards(firestore);
      toast({
        title: "Sucesso!",
        description: "Todos os flashcards foram excluídos."
      });
      setIsOpen(false);
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Erro ao Excluir Tudo',
        description: 'Não foi possível excluir todos os flashcards.',
      });
    } finally {
      setIsDeleting(false);
    }
  }

  const handleDeleteDuplicates = async () => {
    if (!firestore) return;
    setIsDeleting(true);
    try {
        const deletedCount = await deleteDuplicateFlashcards(firestore);
        toast({
            title: "Limpeza Concluída",
            description: `${deletedCount} flashcard(s) duplicado(s) foram excluídos.`,
        });
        setIsOpen(false);
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Erro na Limpeza',
            description: 'Ocorreu um erro ao tentar excluir flashcards duplicados.',
        });
    } finally {
        setIsDeleting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm" disabled={isLoadingFlashcards}>
          <Layers />
          Excluir Flashcards
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Excluir Flashcards</DialogTitle>
          <DialogDescription>
            Selecione filtros para excluir flashcards em massa, ou apague todos de uma vez.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
            <Select value={filterSubject} onValueChange={setFilterSubject}>
                <SelectTrigger><SelectValue placeholder="Matéria" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todas as Matérias</SelectItem>
                    {availableResources.flashcardSubjects.map((s: string) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
            </Select>
            <Select value={filterTopic} onValueChange={setFilterTopic} disabled={filterSubject === 'all'}>
                <SelectTrigger><SelectValue placeholder="Assunto" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos os Assuntos</SelectItem>
                    {(availableResources.topicsByFlashcardSubject[filterSubject] || []).map((t: string) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
            </Select>
            <Select value={filterCargo} onValueChange={setFilterCargo}>
                <SelectTrigger><SelectValue placeholder="Cargo" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos os Cargos</SelectItem>
                    {availableResources.flashcardCargos.map((r: string) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
            </Select>
        </div>

        <ScrollArea className="max-h-72 my-4 border rounded-md">
            <div className="space-y-2 p-4">
            {isLoadingFlashcards && <div className="flex items-center justify-center p-4"><Loader2 className="h-6 w-6 animate-spin"/></div>}
            {!isLoadingFlashcards && filteredFlashcards.length > 0 ? filteredFlashcards.map(flashcard => (
                <div key={flashcard.id} className="flex items-center space-x-3 rounded-md border p-3 bg-muted/50">
                    <Checkbox
                        id={`flashcard-${flashcard.id}`}
                        checked={selectedFlashcards.includes(flashcard.id)}
                        onCheckedChange={() => handleCheckboxChange(flashcard.id)}
                    />
                    <Label htmlFor={`flashcard-${flashcard.id}`} className="flex-1 cursor-pointer text-sm truncate">
                        {flashcard.front}
                    </Label>
                </div>
            )) : !isLoadingFlashcards && <p className="text-sm text-muted-foreground text-center py-4">Nenhum flashcard corresponde aos filtros.</p>}
            </div>
        </ScrollArea>
        <DialogFooter className="sm:justify-between flex-wrap gap-2">
            <div>
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={isDeleting || isLoadingFlashcards || !allFlashcards || allFlashcards.length === 0}>
                        Excluir Todos
                    </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
                        <AlertDialogDescription>
                        Esta ação é irreversível e apagará todos os flashcards da plataforma.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAll} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Sim, excluir tudo
                        </AlertDialogAction>
                    </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                <Button variant="outline" onClick={handleDeleteDuplicates} disabled={isDeleting} className="ml-2">
                    {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Sparkles className="mr-2 h-4 w-4" />
                    Excluir Duplicadas
                </Button>
            </div>
          <div className="flex gap-2">
            <DialogClose asChild><Button variant="outline">Fechar</Button></DialogClose>
             <Button variant="destructive" onClick={handleDeleteSelected} disabled={isDeleting || selectedFlashcards.length === 0}>
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir ({selectedFlashcards.length})
            </Button>
          </div>
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
  const [userSearchQuery, setUserSearchQuery] = useState('');


  useEffect(() => {
    setIsClient(true);
  }, []);

  const questionsQuery = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'questoes') : null),
    [firestore, user]
  );
  const { data: allQuestions, isLoading: isLoadingSubjects } = useCollection<Question>(questionsQuery);
  
  const flashcardsQuery = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'flashcards') : null),
    [firestore, user]
  );
  const { data: allFlashcards, isLoading: isLoadingFlashcards } = useCollection<Flashcard>(flashcardsQuery);
  
  const usersQuery = useMemoFirebase(
    () => (firestore && user ? query(collection(firestore, 'users')) : null),
    [firestore, user]
  );
  const { data: allUsers, isLoading: isLoadingUsers } = useCollection<UserProfile>(usersQuery);
  
  const filteredUsers = useMemo(() => {
    if (!allUsers) return [];
    if (!userSearchQuery) return allUsers;
    
    const lowercasedQuery = userSearchQuery.toLowerCase();
    return allUsers.filter(u => 
      u.name?.toLowerCase().includes(lowercasedQuery) || 
      u.email?.toLowerCase().includes(lowercasedQuery)
    );
  }, [allUsers, userSearchQuery]);

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

  const availableFlashcardResources = useMemo(() => {
    if (!allFlashcards) return { flashcardSubjects: [], topicsByFlashcardSubject: {}, flashcardCargos: [] };
    
    const subjects = new Set<string>();
    const topicsBySubject: Record<string, Set<string>> = {};
    const cargos = new Set<string>();

    for (const fc of allFlashcards) {
        if(fc.subject) {
            subjects.add(fc.subject);
            if (!topicsBySubject[fc.subject]) {
                topicsBySubject[fc.subject] = new Set();
            }
            if(fc.topic) {
                topicsBySubject[fc.subject].add(fc.topic);
            }
        }
        if(fc.targetRole) {
            cargos.add(fc.targetRole);
        }
    }

    return {
        flashcardSubjects: Array.from(subjects).sort(),
        topicsByFlashcardSubject: Object.entries(topicsBySubject).reduce((acc, [subject, topicsSet]) => {
            acc[subject] = Array.from(topicsSet).sort();
            return acc;
        }, {} as Record<string, string[]>),
        flashcardCargos: Array.from(cargos).sort(),
    };
}, [allFlashcards]);

  const availableQuestionResources = useMemo(() => {
    if (!allQuestions) return { questionSubjects: [], questionAnos: [], questionCargos: [] };
    
    const subjects = new Set<string>();
    const anos = new Set<string>();
    const cargos = new Set<string>();

    for (const q of allQuestions) {
        if(q.Materia) subjects.add(q.Materia);
        if(q.Ano) anos.add(q.Ano);
        if(q.Cargo) cargos.add(q.Cargo);
    }

    return {
        questionSubjects: Array.from(subjects).sort(),
        questionAnos: Array.from(anos).sort((a,b) => b.localeCompare(a)), // sort descending
        questionCargos: Array.from(cargos).sort(),
    };
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

  const handlePlanChange = async (userId: string, currentPlan: 'standard' | 'plus') => {
    if (!firestore) return;
    const newPlan = currentPlan === 'plus' ? 'standard' : 'plus';
    try {
        await updateUserPlan(firestore, userId, newPlan);
        toast({
            title: 'Sucesso!',
            description: `Plano do usuário atualizado para ${newPlan}.`
        });
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Erro ao Atualizar Plano',
            description: 'Não foi possível alterar o plano do usuário.'
        });
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
        <Card>
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
                        <DialogContent className="sm:max-w-2xl">
                             <DialogHeader>
                                <DialogTitle>Modelo de Importação</DialogTitle>
                                <DialogDescription>
                                  Use o formato abaixo, separando cada campo com um pipe (`|`). Cada questão deve estar em uma nova linha.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="rounded-md bg-muted p-4 text-sm font-mono mt-4 break-words">
                                Materia | Ano | Assunto | Cargo | Enunciado | a | b | c | d | e | correctAnswer
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
                <div className="relative flex flex-col justify-between p-4 rounded-lg border h-full">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6">
                                <HelpCircle className="h-4 w-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-2xl">
                             <DialogHeader>
                                <DialogTitle>Modelo de Importação de Flashcards</DialogTitle>
                                <DialogDescription>
                                    Use o formato abaixo, separando cada campo com um pipe (`|`). Cada flashcard deve estar em uma nova linha.
                                </DialogDescription>
                            </DialogHeader>
                             <div className="rounded-md bg-muted p-4 text-sm font-mono mt-4 space-y-2 break-words">
                                <p className='font-bold'>Formato:</p>
                                <p>Matéria | Assunto | Cargo | Pergunta | Resposta</p>
                                <p className='font-bold pt-4'>Exemplos:</p>
                                <p>Direito Administrativo | Atos Administrativos | Geral | Quais são os atributos do ato administrativo? | Presunção de legitimidade, autoexecutoriedade, tipicidade e imperatividade (mnemônico: PATI).</p>
                                <p>Língua Portuguesa | Crase | Analista Judiciário | Quando a crase é facultativa antes de nomes próprios femininos? | A crase é facultativa, pois o artigo 'a' antes do nome é opcional.</p>
                            </div>
                        </DialogContent>
                    </Dialog>
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

        <Card>
            <CardHeader>
                <CardTitle>Ferramentas de Manutenção</CardTitle>
                <CardDescription>Ações para organizar e limpar seus dados.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="flex flex-col justify-between p-4 rounded-lg border h-full">
                    <div>
                        <h4 className="font-semibold">Excluir Questões</h4>
                        <p className="text-sm text-muted-foreground mt-1">Filtre e apague questões.</p>
                    </div>
                    <DeleteQuestionsDialog
                      availableResources={availableQuestionResources}
                      allQuestions={allQuestions}
                      isLoadingQuestions={isLoadingSubjects}
                    />
                </div>
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
                    <DeleteFlashcardsDialog 
                      availableResources={availableFlashcardResources} 
                      allFlashcards={allFlashcards}
                      isLoadingFlashcards={isLoadingFlashcards}
                    />
                </div>
            </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Gerenciamento de Usuários</CardTitle>
            <CardDescription>Visualize e gerencie os planos de assinatura dos usuários.</CardDescription>
        </CardHeader>
        <CardContent>
             <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Pesquisar por nome ou e-mail..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>
             <ScrollArea className="h-96">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Usuário</TableHead>
                            <TableHead>Plano</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoadingUsers ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-8 w-48" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-8 w-24" /></TableCell>
                                </TableRow>
                            ))
                        ) : filteredUsers && filteredUsers.length > 0 ? (
                            filteredUsers.map(u => {
                                const plan = u.subscription?.plan || 'standard';
                                const isPlus = plan === 'plus';
                                return (
                                    <TableRow key={u.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar>
                                                    <AvatarImage src={(u as any).photoURL || ''} />
                                                    <AvatarFallback>{u.name?.charAt(0) || 'U'}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium">{u.name || 'Usuário sem nome'}</p>
                                                    <p className="text-sm text-muted-foreground">{u.email || 'E-mail não disponível'}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={isPlus ? 'default' : 'secondary'} className={cn(isPlus && 'bg-accent text-accent-foreground')}>
                                                {isPlus && <Crown className="mr-1 h-3 w-3" />}
                                                {plan === 'plus' ? 'MentorIA+' : 'Standard'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handlePlanChange(u.id, plan)}
                                            >
                                                {isPlus ? 'Rebaixar para Standard' : 'Promover para Plus'}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        ) : (
                           <TableRow>
                                <TableCell colSpan={3} className="text-center h-24">
                                  {userSearchQuery ? 'Nenhum usuário encontrado para sua busca.' : 'Nenhum usuário encontrado.'}
                                </TableCell>
                           </TableRow> 
                        )}
                    </TableBody>
                </Table>
            </ScrollArea>
        </CardContent>
      </Card>


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
