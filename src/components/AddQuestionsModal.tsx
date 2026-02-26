
'use client';

import { useState, useEffect } from 'react';
import { useFirebase, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { batchUpdateQuestions } from '@/firebase/actions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, Bot, Loader2, CheckCircle2, ShieldAlert, Timer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { doc, Timestamp } from 'firebase/firestore';

export function AddQuestionsModal() {
  const { firestore } = useFirebase();
  const { user } = useUser();
  const { toast } = useToast();
  
  const userDocRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, `users/${user.uid}`) : null),
    [user, firestore]
  );
  const { data: userData } = useDoc<any>(userDocRef);

  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'banned'>('idle');
  const [questionsDone, setQuestionsDone] = useState('');
  const [correctAnswers, setCorrectAnswers] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);

  // Lógica de verificação de ban e cronômetro
  useEffect(() => {
    if (!userData?.stats?.bannedFromAddingUntil) {
      if (status === 'banned') setStatus('idle');
      return;
    }

    const bannedUntil = (userData.stats.bannedFromAddingUntil as Timestamp).toDate();
    const now = new Date();

    if (bannedUntil > now) {
      setStatus('banned');
      const diff = Math.ceil((bannedUntil.getTime() - now.getTime()) / 1000);
      setTimeLeft(diff);

      const interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setStatus('idle');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setStatus('idle');
    }
  }, [userData, isOpen]);

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

    if (done > 100 && done <= 200) {
      return; // Botão já deve estar desabilitado pela UI
    }

    setStatus('loading');

    setTimeout(async () => {
      try {
        await batchUpdateQuestions(firestore, user.uid, done, correct);
        setStatus('success');
        
        setTimeout(() => {
          setIsOpen(false);
          setStatus('idle');
          setQuestionsDone('');
          setCorrectAnswers('');
          toast({ title: 'Progresso atualizado!', description: 'Sua evolução foi calculada com sucesso.' });
        }, 1500);
      } catch (error: any) {
        if (done > 200) {
          setStatus('banned');
        } else {
          setStatus('idle');
          toast({ variant: 'destructive', title: 'Erro ao salvar', description: 'Não foi possível atualizar seu progresso.' });
        }
      }
    }, 1800);
  };

  const isWarning = parseInt(questionsDone) > 100 && parseInt(questionsDone) <= 200;
  const isBanTrigger = parseInt(questionsDone) > 200;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full sm:w-auto border-accent/30 hover:bg-accent/10">
          <Sparkles className="mr-2 h-4 w-4 text-accent" />
          Adicionar questões de hoje
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        {status === 'banned' ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-6 text-center">
            <div className="relative">
              <Bot className="h-16 w-16 text-accent animate-bounce" />
              <ShieldAlert className="absolute -bottom-2 -right-2 h-8 w-8 text-destructive animate-pulse" />
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-slate-900">Uau, que ritmo intenso de estudos! 🤖</h3>
              <p className="text-sm text-slate-600 leading-relaxed px-4">
                Porém, para garantir a justiça do nosso ranking e processar seus dados corretamente, identificamos um volume incomum.
              </p>
              <div className="flex flex-col items-center gap-2 p-4 bg-slate-100 rounded-2xl border border-slate-200">
                <Timer className="h-5 w-5 text-accent" />
                <p className="text-xs font-bold text-slate-500 uppercase">Aguarde para registrar</p>
                <span className="text-2xl font-black text-accent">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
              </div>
              <p className="text-xs text-slate-400 italic">Por favor, descanse um pouco a mente e volte em breve.</p>
            </div>
          </div>
        ) : status === 'idle' ? (
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
                    className={isWarning || isBanTrigger ? 'border-destructive focus-visible:ring-destructive' : ''}
                  />
                  {isWarning && (
                    <p className="text-xs font-bold text-destructive animate-pulse">
                      ⚠️ Você só pode registrar até 100 questões por vez.
                    </p>
                  )}
                  {isBanTrigger && (
                    <p className="text-xs font-bold text-destructive uppercase tracking-tighter">
                      🚨 CUIDADO: Volume suspeito. Risco de bloqueio temporário.
                    </p>
                  )}
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
                <Button 
                  type="submit" 
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                  disabled={isWarning}
                >
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
