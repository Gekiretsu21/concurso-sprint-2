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
import { ClipboardPaste, FileText, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { importQuestions } from '@/firebase/actions';
import { useFirebase } from '@/firebase';
import { useUser } from '@/firebase/auth/use-user';
import { SubjectCard } from '@/components/SubjectCard';
import { SimulatedExamDialog } from '@/components/SimulatedExamDialog';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function ManagementPage() {
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const [questionText, setQuestionText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

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
    setIsImporting(true);
    try {
      await importQuestions(firestore, questionText);
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
                      <Button
                        disabled={isButtonDisabled}
                      >
                        {isUserLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ClipboardPaste />}
                        {isUserLoading ? 'Carregando...' : 'Importar'}
                      </Button>
                    </DialogTrigger>
                  ) : (
                    <Button disabled={true} >
                      <ClipboardPaste />
                      Importar
                    </Button>
                  )}
                  <DialogContent className="sm:max-w-[812px]">
                    <DialogHeader>
                      <DialogTitle>Importar Questões por Texto</DialogTitle>
                      <DialogDescription>
                        Cole o conteúdo no campo abaixo. Certifique-se de que o
                        formato esteja correto.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-start gap-4">
                        <Label
                          htmlFor="question-text"
                          className="text-right pt-2"
                        >
                          Conteúdo
                        </Label>
                        <Textarea
                          id="question-text"
                          className="col-span-3 min-h-[250px]"
                          placeholder="Cole seu texto aqui..."
                          value={questionText}
                          onChange={e => setQuestionText(e.target.value)}
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
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Use a caixa de diálogo para importar questões em massa a partir de um texto formatado.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Gerador de Simulados</CardTitle>
                <div>
                  {isClient ? <SimulatedExamDialog /> : <Button disabled><FileText />Gerar</Button>}
                </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Crie simulados personalizados selecionando matérias e o número de questões.</p>
            </CardContent>
          </Card>
        </div>

      <div className="space-y-6">
        <h3 className="text-2xl font-bold tracking-tight">Banco de Questões</h3>
        <SubjectCard
          subject="Direito Administrativo"
          href="/mentorlite/management/administrative-law"
        />
        <SubjectCard
          subject="Direito Constitucional"
          href="/mentorlite/management/constitutional-law"
        />
        <SubjectCard subject="Direito Penal" href="/mentorlite/management/penal-law" />
      </div>
    </div>
  );
}
