'use client';

import { useState } from 'react';
import { useFirebase, useUser } from '@/firebase';
import { batchUpdateQuestions } from '@/firebase/actions';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, Bot, Loader2, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function AddQuestionsModal() {
  const { firestore } = useFirebase();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [questionsDone, setQuestionsDone] = useState('');
  const [correctAnswers, setCorrectAnswers] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user) return;

    const done = parseInt(questionsDone);
    const correct = parseInt(correctAnswers);

    if (isNaN(done) || isNaN(correct) || correct > done) {
      toast({
        variant: 'destructive',
        title: 'Dados inválidos',
        description: 'Verifique se o número de acertos não é maior que o total.',
      });
      return;
    }

    setStatus('loading');

    // Simula o tempo de "pensamento" da IA solicitado (1.5s - 2s)
    setTimeout(async () => {
      try {
        await batchUpdateQuestions(firestore, user.uid, done, correct);
        setStatus('success');
        
        // Mantém o estado de sucesso por um momento antes de fechar
        setTimeout(() => {
          setIsOpen(false);
          setStatus('idle');
          setQuestionsDone('');
          setCorrectAnswers('');
          toast({
            title: 'Progresso atualizado!',
            description: 'Sua evolução foi calculada com sucesso.',
          });
        }, 1500);
      } catch (error) {
        setStatus('idle');
        toast({
          variant: 'destructive',
          title: 'Erro ao salvar',
          description: 'Não foi possível atualizar seu progresso.',
        });
      }
    }, 1800);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full sm:w-auto border-accent/30 hover:bg-accent/10">
          <Sparkles className="mr-2 h-4 w-4 text-accent" />
          Adicionar questões de hoje
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        {status === 'idle' ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-accent" /> Registrar Atividade
              </DialogTitle>
              <DialogDescription>
                Informe o volume de questões resolvidas fora da plataforma para atualizar seu nível.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 py-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="done">Quantas questões você fez?</Label>
                  <Input
                    id="done"
                    type="number"
                    placeholder="Ex: 50"
                    value={questionsDone}
                    onChange={(e) => setQuestionsDone(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="correct">Quantas você acertou?</Label>
                  <Input
                    id="correct"
                    type="number"
                    placeholder="Ex: 42"
                    value={correctAnswers}
                    onChange={(e) => setCorrectAnswers(e.target.value)}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                  Calcular Evolução
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : status === 'loading' ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
            <div className="relative">
              <Bot className="h-16 w-16 text-accent animate-bounce" />
              <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-accent animate-pulse" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold">Processando seus resultados...</h3>
              <p className="text-sm text-muted-foreground animate-pulse">
                A IA está calculando sua evolução e recalibrando seus níveis...
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
            <CheckCircle2 className="h-16 w-16 text-emerald-500 animate-in zoom-in duration-300" />
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-emerald-600">Evolução Concluída!</h3>
              <p className="text-sm text-muted-foreground">
                Seu novo ranking foi atualizado. Continue assim!
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
