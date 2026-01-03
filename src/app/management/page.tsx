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
import { useState } from 'react';
import { importQuestions } from './actions';

export default function ManagementPage() {
  const { toast } = useToast();
  const [questionText, setQuestionText] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const handleImport = async () => {
    setIsImporting(true);
    const result = await importQuestions(questionText);
    setIsImporting(false);

    if (result.success) {
      toast({
        title: 'Importação Concluída',
        description: result.message,
      });
      setQuestionText('');
    } else {
      toast({
        variant: 'destructive',
        title: 'Erro na Importação',
        description: result.message,
      });
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
      <Card>
        <CardHeader>
          <CardTitle>Importar Questões</CardTitle>
          <CardDescription>
            Cole o texto para adicionar novas questões ao banco de dados.
            Use "/" para separar os campos e ";" para separar as questões.
            Formato: matéria/dificuldade/texto da questão/opção1/opção2/.../resposta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <ClipboardPaste />
                Importar
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
              <DialogHeader>
                <DialogTitle>Importar Questões por Texto</DialogTitle>
                <DialogDescription>
                  Cole o conteúdo no campo abaixo. Certifique-se
                  de que o formato esteja correto.
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
                <Button onClick={handleImport} disabled={isImporting}>
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
    </div>
  );
}
