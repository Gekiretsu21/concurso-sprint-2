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
import { ClipboardPaste, ExternalLink, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { importQuestions } from '@/firebase/actions';
import { useFirebase } from '@/firebase';
import { useUser } from '@/firebase/auth/use-user';
import Link from 'next/link';
import { SubjectCard } from '@/components/SubjectCard';

export default function ManagementPage() {
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const { user } = useUser();
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

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Gerenciamento</h1>
        <p className="text-muted-foreground">
          Gerencie as configurações e dados do aplicativo.
        </p>
      </header>
      <div className="flex flex-col items-center gap-6">
        <div className="relative w-full max-w-4xl group">
            <div className="relative z-10 h-full flex items-center justify-between bg-gradient-to-r from-green-900 via-blue-400 to-blue-900 border border-white/10 p-6 rounded-3xl shadow-lg shadow-black/30 transition-transform duration-300 group-hover:scale-[1.02] group-hover:border-white/20">
                <h2 className="text-xl font-bold text-white">Importar Questões</h2>
                <div>
                    <Dialog>
                    {isClient ? (
                      <DialogTrigger asChild>
                          <Button disabled={!user} className="bg-black text-white hover:bg-gray-800">
                          <ClipboardPaste />
                          Importar
                          </Button>
                      </DialogTrigger>
                    ) : (
                      <Button disabled={true} className="bg-black text-white hover:bg-gray-800">
                        <ClipboardPaste />
                        Importar
                      </Button>
                    )}
                    <DialogContent className="sm:max-w-[812px] bg-gradient-to-br from-green-900/80 to-blue-900/80 border-white/20 text-white">
                        <DialogHeader>
                        <DialogTitle>Importar Questões por Texto</DialogTitle>
                        <DialogDescription className="text-white/80">
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
                            className="col-span-3 min-h-[250px] bg-black/50 border-white/20 text-white"
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
                            className="bg-black text-white hover:bg-gray-800"
                        >
                            {isImporting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            Importar Questões
                        </Button>
                        </DialogFooter>
                    </DialogContent>
                    </Dialog>
                </div>
            </div>
        </div>

        <SubjectCard subject='Direito Administrativo' href='/mentorlite/management/administrative-law' />
        <SubjectCard subject='Direito Constitucional' href='/mentorlite/management/constitutional-law' />
        <SubjectCard subject='Direito Penal' href='/mentorlite/management/penal-law' />

      </div>
    </div>
  );
}
