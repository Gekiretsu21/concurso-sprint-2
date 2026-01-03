'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { ClipboardPaste, Loader2 } from 'lucide-react';
import { useState, useMemo } from 'react';
import { importQuestions } from '@/firebase/actions';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { useUser } from '@/firebase/auth/use-user';
import { collection } from 'firebase/firestore';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export default function ManagementPage() {
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const { user } = useUser();
  const [questionText, setQuestionText] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const questionsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'questoes') : null),
    [firestore]
  );
  const { data: questions, isLoading: isLoadingQuestions } =
    useCollection(questionsQuery);

  const groupedQuestions = useMemo(() => {
    if (!questions) return {};
    return questions.reduce((acc, q) => {
      const subject = q.subject || 'Outros';
      if (!acc[subject]) {
        acc[subject] = [];
      }
      acc[subject].push(q);
      return acc;
    }, {} as Record<string, any[]>);
  }, [questions]);

  const handleImport = async () => {
    if (!firestore) {
      toast({
        variant: 'destructive',
        title: 'Erro de Conexão',
        description:
          'Não foi possível conectar ao banco de dados. Tente novamente mais tarde.',
      });
      return;
    }
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Não Autenticado',
        description: 'Você precisa estar logado para importar questões.',
      });
      return;
    }
    setIsImporting(true);
    try {
      await importQuestions(firestore, user.uid, questionText);
      toast({
        title: 'Importação Concluída',
        description: 'As questões foram importadas com sucesso!',
      });
      setQuestionText('');
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
      setIsImporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Gerenciamento</h1>
        <p className="text-muted-foreground">
          Gerencie as configurações e dados do aplicativo.
        </p>
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <Card>
          <CardHeader>
            <CardTitle>Importar Questões</CardTitle>
            <CardDescription>
              Cole o texto para adicionar novas questões ao banco de dados. Use
              &quot;/&quot; para separar os campos e &quot;;&quot; para
              separar as questões. Formato:
              matéria/dificuldade/texto/opção1/opção2/.../resposta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog>
              <DialogTrigger asChild>
                <Button disabled={!user}>
                  <ClipboardPaste />
                  Importar
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[625px]">
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
                      className="col-span-3 min-h-[250px]"
                      placeholder="Cole seu texto aqui..."
                      value={questionText}
                      onChange={(e) => setQuestionText(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancelar</Button>
                  </DialogClose>
                  <Button
                    onClick={handleImport}
                    disabled={isImporting || !questionText}
                  >
                    {isImporting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Importar Questões
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Questões Importadas</CardTitle>
            <CardDescription>
              Visualize as questões existentes no banco de dados.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingQuestions ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : Object.keys(groupedQuestions).length > 0 ? (
              <Accordion
                type="single"
                collapsible
                className="w-full max-h-[500px] overflow-y-auto"
              >
                {Object.entries(groupedQuestions).map(([subject, qs]) => (
                  <AccordionItem value={subject} key={subject}>
                    <AccordionTrigger>
                      {subject} ({qs.length})
                    </AccordionTrigger>
                    <AccordionContent>
                      <ul className="space-y-4 pl-4">
                        {qs.map((q) => (
                          <li key={q.id} className="text-sm">
                            <p className="font-semibold">{q.text}</p>
                            <p className="text-muted-foreground">
                              Resposta: {q.correctAnswer}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <p className="text-muted-foreground text-center">
                Nenhuma questão importada ainda.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
