
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useFirebase, useUser, useDoc, useMemoFirebase, useCollection } from '@/firebase';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Bot, Loader2, CheckCircle2, ShieldAlert, Timer, Search, ChevronDown, Check, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { doc, Timestamp, collection } from 'firebase/firestore';
import { cn } from '@/lib/utils';

export function AddQuestionsModal() {
  const { firestore } = useFirebase();
  const { user } = useUser();
  const { toast } = useToast();
  
  const userDocRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, `users/${user.uid}`) : null),
    [user, firestore]
  );
  const { data: userData } = useDoc<any>(userDocRef);

  // Busca todas as matérias disponíveis no sistema de questões para popular o seletor
  const questionsQuery = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'questoes') : null),
    [firestore, user]
  );
  const { data: allQuestions, isLoading: isLoadingQuestions } = useCollection(questionsQuery);

  const dynamicSubjects = useMemo(() => {
    const subjectSet = new Set<string>();
    
    // Matérias base para garantir que a lista nunca esteja vazia no início
    const baseSubjects = ["Português", "Matemática", "Raciocínio Lógico", "Direito Constitucional", "Direito Administrativo", "Informática", "Direito Penal", "Direito Processual Penal", "Legislação Extravagante"];
    baseSubjects.forEach(s => subjectSet.add(s));

    if (allQuestions) {
      allQuestions
        .filter(q => q.status !== 'hidden' && q.Materia && q.Materia.trim())
        .forEach(q => {
          let subjectName = q.Materia.trim();
          const subjectLower = subjectName.toLowerCase();
          
          if (subjectLower === 'lingua portuguesa') {
            subjectSet.add('Língua Portuguesa');
          } else if (subjectLower === 'legislacao juridica') {
            subjectSet.add('Legislação Jurídica');
          } else if (subjectLower === 'legislacao institucional') {
            subjectSet.add('Legislação Institucional');
          } else {
            const formatted = subjectName.split(' ').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            ).join(' ');
            
            if (formatted.toLowerCase() !== 'materia') {
                subjectSet.add(formatted);
            }
          }
        });
    }
    
    const sorted = Array.from(subjectSet).sort((a, b) => a.localeCompare(b, 'pt-BR'));
    return [...sorted, "Outros"];
  }, [allQuestions]);

  const [isMainOpen, setIsMainOpen] = useState(false);
  const [isSubjectPopupOpen, setIsSubjectPopupOpen] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'banned'>('idle');
  const [questionsDone, setQuestionsDone] = useState('');
  const [correctAnswers, setCorrectAnswers] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [subjectSearch, setSubjectSearch] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);

  const filteredSubjects = useMemo(() => {
    const searchNormalized = subjectSearch.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return dynamicSubjects.filter(s => 
      s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(searchNormalized)
    );
  }, [dynamicSubjects, subjectSearch]);

  // Lógica de bloqueio temporário por excesso de volume (Anti-Spam)
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
  }, [userData, isMainOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user) return;

    if (!selectedSubject) {
      toast({ variant: 'destructive', title: 'Matéria obrigatória', description: 'Por favor, selecione a disciplina.' });
      return;
    }

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

    setTimeout(async () => {
      try {
        await batchUpdateQuestions(firestore, user.uid, done, correct, selectedSubject);
        setStatus('success');
        
        setTimeout(() => {
          setIsMainOpen(false);
          setStatus('idle');
          setQuestionsDone('');
          setCorrectAnswers('');
          setSelectedSubject('');
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

  return (
    <div className="flex flex-col gap-8">
      <Dialog open={isMainOpen} onOpenChange={setIsMainOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="default" 
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-black uppercase tracking-widest text-[10px] sm:text-xs py-7 shadow-2xl shadow-accent/30 animate-pulse-glow group rounded-2xl relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] transition-transform" />
            <div className="flex items-center justify-center gap-3 relative z-10">
              <Sparkles className="h-5 w-5 animate-bounce group-hover:scale-125 transition-transform" />
              <span className="drop-shadow-md">Registrar Evolução de Hoje</span>
              <Sparkles className="h-5 w-5 animate-bounce group-hover:scale-125 transition-transform" />
            </div>
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
                <h3 className="text-xl font-bold text-slate-900">Uau, que ritmo intenso! 🤖</h3>
                <p className="text-sm text-slate-600 leading-relaxed px-4">
                  Para garantir a integridade dos dados, identificamos um volume acima do limite de segurança.
                </p>
                <div className="flex flex-col items-center gap-2 p-4 bg-slate-100 rounded-2xl border border-slate-200">
                  <Timer className="h-5 w-5 text-accent" />
                  <p className="text-xs font-bold text-slate-500 uppercase">Tempo de resfriamento</p>
                  <span className="text-2xl font-black text-accent">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
                </div>
                <p className="text-xs text-slate-400 italic">Aproveite para descansar a mente por alguns minutos.</p>
              </div>
            </div>
          ) : status === 'idle' ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-accent" /> Registrar Atividade
                </DialogTitle>
                <DialogDescription>
                  Informe o seu desempenho de hoje para atualizar seu nível e conquistas.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6 py-4">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Disciplina Estudada</Label>
                    
                    <Dialog open={isSubjectPopupOpen} onOpenChange={setIsSubjectPopupOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between font-normal text-left h-11 border-slate-200 bg-white"
                        >
                          <span className="truncate">
                            {selectedSubject ? selectedSubject : "Selecione a disciplina..."}
                          </span>
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden flex flex-col h-[80vh] sm:h-[500px]">
                        <DialogHeader className="p-4 border-b bg-slate-50">
                          <DialogTitle className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-accent" /> Selecionar Matéria
                          </DialogTitle>
                        </DialogHeader>
                        <div className="p-4 border-b bg-white">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                              placeholder="Digite para pesquisar..."
                              className="pl-10 h-11"
                              value={subjectSearch}
                              onChange={(e) => setSubjectSearch(e.target.value)}
                              autoFocus
                            />
                          </div>
                        </div>
                        <ScrollArea className="flex-1">
                          <div className="p-2 space-y-1">
                            {isLoadingQuestions ? (
                              <div className="flex flex-col items-center justify-center py-12 gap-3">
                                <Loader2 className="h-8 w-8 animate-spin text-accent" />
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sincronizando Banco...</p>
                              </div>
                            ) : filteredSubjects.length > 0 ? (
                              filteredSubjects.map((subject) => (
                                <button
                                  key={subject}
                                  type="button"
                                  className={cn(
                                    "w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-semibold transition-all text-left",
                                    selectedSubject === subject 
                                      ? "bg-accent text-accent-foreground shadow-lg shadow-accent/20" 
                                      : "hover:bg-slate-100 text-slate-700"
                                  )}
                                  onClick={() => {
                                    setSelectedSubject(subject);
                                    setIsSubjectPopupOpen(false);
                                    setSubjectSearch("");
                                  }}
                                >
                                  {subject}
                                  {selectedSubject === subject && <Check className="h-4 w-4" />}
                                </button>
                              ))
                            ) : (
                              <div className="py-12 text-center">
                                <Search className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                                <p className="text-sm text-slate-400 font-medium">Nenhuma disciplina encontrada.</p>
                              </div>
                            )}
                          </div>
                        </ScrollArea>
                        <div className="p-4 border-t bg-slate-50 text-[10px] text-center text-slate-400 font-bold uppercase tracking-tight">
                          Total de {dynamicSubjects.length} matérias disponíveis
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                          <Label htmlFor="done">Total Resolvidas</Label>
                          <Input
                              id="done"
                              type="number"
                              placeholder="Ex: 50"
                              value={questionsDone}
                              onChange={(e) => setQuestionsDone(e.target.value)}
                              required
                              className={cn("h-11", isWarning && 'border-destructive focus-visible:ring-destructive')}
                          />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="correct">Total Acertos</Label>
                          <Input
                              id="correct"
                              type="number"
                              placeholder="Ex: 42"
                              value={correctAnswers}
                              onChange={(e) => setCorrectAnswers(e.target.value)}
                              required
                              className="h-11"
                          />
                      </div>
                  </div>
                  {isWarning && (
                      <p className="text-[10px] font-black text-destructive animate-pulse uppercase tracking-wider text-center">
                          ⚠️ Limite de 100 questões por registro.
                      </p>
                  )}
                </div>
                <DialogFooter>
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-accent text-accent-foreground hover:bg-accent/90 font-bold"
                    disabled={isWarning || !selectedSubject}
                  >
                    Processar Resultados
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
                <h3 className="text-lg font-bold text-slate-900">Pensando...</h3>
                <p className="text-sm text-slate-500 animate-pulse">
                  A IA está processando os seus dados.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
              <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center mb-2">
                  <CheckCircle2 className="h-12 w-12 text-emerald-600 animate-in zoom-in duration-300" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black text-emerald-700 uppercase tracking-tight">Registro Concluído!</h3>
                <p className="text-sm text-slate-500 font-medium">
                  Sua disciplina foi atualizada e seu nível recalculado.
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <style jsx global>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
