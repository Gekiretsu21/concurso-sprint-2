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
import { ClipboardPaste, FileText, Layers, Loader2, Users, Trash2, AlertCircle } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { importQuestions, importFlashcards, deleteDuplicateQuestions } from '@/firebase/actions';
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
import { collection, DocumentData } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// Helper to generate a URL-friendly slug from a subject name
const createSubjectSlug = (subject: string) => {
  return subject
    .toLowerCase()
    .normalize('NFD') // Normalize accents
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Remove duplicate hyphens
};

interface SubjectWithCount {
    name: string;
    count: number;
}

export default function ManagementPage() {
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const [questionText, setQuestionText] = useState('');
  const [flashcardText, setFlashcardText] = useState('');
  const [isImportingQuestions, setIsImportingQuestions] = useState(false);
  const [isImportingFlashcards, setIsImportingFlashcards] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
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

        if (subject && subject.trim().toLowerCase() !== 'materia' && !isHidden) {
            acc[subject] = (acc[subject] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);

    return Object.entries(subjectCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => a.name.localeCompare(b.name));

  }, [allQuestions]);

  const handleImportQuestions = async () => {
    if (!firestore) {
      toast({
        variant: 'destructive',
        title: 'Erro de Conexão',
        description:
          'Não foi possível conectar ao banco de dados. Tente novamente mais tarde.',
      });
      return;
    }
    setIsImportingQuestions(true);
    try {
        const examDetails = isPreviousExam ? { isPreviousExam, examName } : undefined;
        await importQuestions(firestore, questionText, examDetails);
        toast({
            title: 'Importação Concluída',
            description: 'As questões foram importadas com sucesso!',
        });
        setQuestionText('');
        setExamName('');
        setIsPreviousExam(false);
    } catch (error) {
      let message = 'Ocorreu um erro ao importar as questões.';
      if (error instanceof Error) {
        message = error.message;
      }
      toast({
        variant: 'destructive',
        title: 'Erro na Importação',
        description: message,
      });
    } finally {
      setIsImportingQuestions(false);
    }
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
  
    const handleCleanDuplicates = async () => {
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Erro de Conexão' });
      return;
    }
    setIsCleaning(true);
    try {
      const deletedCount = await deleteDuplicateQuestions(firestore);
      if (deletedCount > 0) {
        toast({
          title: 'Limpeza Concluída',
          description: `${deletedCount} questões duplicadas foram removidas.`,
        });
      } else {
        toast({
          title: 'Nenhuma Duplicata Encontrada',
          description: 'Seu banco de questões já está limpo.',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro na Limpeza',
        description: 'Não foi possível remover as questões duplicadas.',
      });
    } finally {
      setIsCleaning(false);
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Importar Questões</CardTitle>
            <Dialog>
              {isClient ? (
                <DialogTrigger asChild>
                  <Button disabled={isButtonDisabled}>
                    {isUserLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ClipboardPaste />
                    )}
                    {isUserLoading ? 'Carregando...' : 'Importar'}
                  </Button>
                </DialogTrigger>
              ) : (
                <Button disabled={true}>
                  <ClipboardPaste />
                  Importar
                </Button>
              )}
              <DialogContent className="sm:max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Importar Questões por Texto</DialogTitle>
                  <DialogDescription>
                    Cole o conteúdo no campo abaixo. Certifique-se de que o
                    formato esteja correto.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="question-text" className="text-right pt-2">
                      Conteúdo
                    </Label>
                    <Textarea
                      id="question-text"
                      className="col-span-3 min-h-[350px]"
                      placeholder="Cole seu texto aqui..."
                      value={questionText}
                      onChange={e => setQuestionText(e.target.value)}
                    />
                  </div>
                   <div className="col-span-4 grid grid-cols-4 items-center gap-4">
                      <div/>
                      <div className="col-span-3 space-y-4">
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
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancelar</Button>
                  </DialogClose>
                  <Button
                    onClick={handleImportQuestions}
                    disabled={isImportingQuestions || !questionText || (isPreviousExam && !examName.trim())}
                  >
                    {isImportingQuestions ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Importar Questões
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Use a caixa de diálogo para importar questões em massa a partir de
              um texto formatado.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Gerador de Simulados</CardTitle>
            <div>
              {isClient ? (
                <SimulatedExamDialog />
              ) : (
                <Button disabled>
                  <FileText />
                  Gerar
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Crie simulados personalizados selecionando matérias e o número de
              questões.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Importar Flashcards</CardTitle>
            <Dialog>
              {isClient ? (
                <DialogTrigger asChild>
                  <Button disabled={isButtonDisabled}>
                    {isUserLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Layers />
                    )}
                    {isUserLoading ? 'Carregando...' : 'Importar'}
                  </Button>
                </DialogTrigger>
              ) : (
                <Button disabled={true}>
                  <Layers />
                  Importar
                </Button>
              )}
              <DialogContent className="sm:max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Importar Flashcards por Texto</DialogTitle>
                  <DialogDescription>
                    Cole o conteúdo no campo abaixo no formato:
                    Materia/Pergunta/Resposta;
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="flashcard-text" className="text-right pt-2">
                      Conteúdo
                    </Label>
                    <Textarea
                      id="flashcard-text"
                      className="col-span-3 min-h-[350px]"
                      placeholder="Ex: Direito Administrativo/Quais são os atributos do ato administrativo?/Presunção de legitimidade, autoexecutoriedade, tipicidade e imperatividade (P-A-T-I);"
                      value={flashcardText}
                      onChange={e => setFlashcardText(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancelar</Button>
                  </DialogClose>
                  <Button
                    onClick={handleImportFlashcards}
                    disabled={isImportingFlashcards || !flashcardText}
                  >
                    {isImportingFlashcards ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Importar Flashcards
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Importe flashcards em massa para acelerar a criação de novos
              baralhos de estudo.
            </p>
          </CardContent>
        </Card>
        <Card className="bg-destructive/10 border-destructive/30">
            <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Limpar Duplicatas</CardTitle>
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                         <Button variant="destructive" disabled={isButtonDisabled}>
                            {isCleaning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 />}
                            Limpar
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2">
                                <AlertCircle className="text-destructive"/>
                                Tem certeza que deseja continuar?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta ação é irreversível. Ela irá verificar todas as questões no banco de dados e remover permanentemente as que tiverem o mesmo enunciado, mantendo apenas uma cópia de cada.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleCleanDuplicates} className="bg-destructive hover:bg-destructive/90">
                                Sim, remover duplicatas
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardHeader>
            <CardContent>
                 <p className="text-sm text-destructive/80">
                   Use esta ferramenta para remover questões duplicadas do banco de dados. Esta ação não pode ser desfeita.
                </p>
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
        <Card>
          <Link href="/mentorlite/management/users">
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users /> Usuários
                </CardTitle>
                <CardDescription className="mt-1">
                  Gerencie os usuários cadastrados na plataforma.
                </CardDescription>
              </div>
            </CardHeader>
          </Link>
        </Card>
      </div>
    </div>
  );
}

    