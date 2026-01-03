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
import { ClipboardPaste, ExternalLink, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { importQuestions } from '@/firebase/actions';
import { useFirebase } from '@/firebase';
import { useUser } from '@/firebase/auth/use-user';
import Link from 'next/link';

export default function ManagementPage() {
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const { user } = useUser();
  const [questionText, setQuestionText] = useState('');
  const [isImporting, setIsImporting] = useState(false);

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
        <Card className="hover:border-primary transition-colors">
          <Link href="/management/administrative-law" className="block h-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Direito Administrativo
                <ExternalLink className="h-5 w-5 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Clique aqui para visualizar todas as questões cadastradas para esta matéria.
              </p>
            </CardContent>
          </Link>
        </Card>
      </div>
    </div>
  );
}
