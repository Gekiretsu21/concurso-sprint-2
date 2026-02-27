
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useFirebase, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, Timestamp } from 'firebase/firestore';
import { addStudyTask, toggleStudyTask, deleteStudyTask } from '@/firebase/actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Calendar as CalendarIcon, CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface StudyTask {
  id: string;
  title: string;
  subject: string;
  date: any; // Firestore Timestamp
  isCompleted: boolean;
}

const subjects = [
  "Português", "Direito Constitucional", "Direito Administrativo", 
  "Direito Penal", "Raciocínio Lógico", "Informática", "Doutrina Operacional", "Outros"
];

const DAYS_OF_WEEK = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

export default function StudyPlanPage() {
  const { firestore } = useFirebase();
  const { user } = useUser();
  const { toast } = useToast();

  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', subject: '', dayOffset: '0' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // HYDRATION FIX: Defer dynamic "isToday" styling until after client hydration
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Calculate current week dates
  const weekStart = useMemo(() => {
    return startOfWeek(new Date(), { weekStartsOn: 1 });
  }, []);

  const weekDates = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const tasksQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, `users/${user.uid}/study_tasks`),
      orderBy('date', 'asc')
    );
  }, [firestore, user]);

  const { data: tasks, isLoading } = useCollection<StudyTask>(tasksQuery);

  const handleAddTask = async () => {
    if (!firestore || !user || !newTask.title || !newTask.subject) return;

    setIsSubmitting(true);
    try {
      const selectedDate = addDays(weekStart, parseInt(newTask.dayOffset));
      await addStudyTask(firestore, user.uid, {
        title: newTask.title,
        subject: newTask.subject,
        date: selectedDate,
      });
      setIsAddTaskOpen(false);
      setNewTask({ title: '', subject: '', dayOffset: '0' });
      toast({ title: "Meta adicionada!", description: "Seu plano foi atualizado com sucesso." });
    } catch (e) {
      toast({ variant: "destructive", title: "Erro ao salvar", description: "Não foi possível adicionar a tarefa." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleTask = async (taskId: string, currentStatus: boolean) => {
    if (!firestore || !user) return;
    await toggleStudyTask(firestore, user.uid, taskId, !currentStatus);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!firestore || !user) return;
    await deleteStudyTask(firestore, user.uid, taskId);
  };

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Plano de Estudos</h1>
          <p className="text-muted-foreground">Organize sua semana e domine o edital.</p>
        </div>
        
        <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground font-bold shadow-lg hover:shadow-primary/20">
              <Plus className="mr-2 h-4 w-4" /> Adicionar Meta
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Nova Meta de Estudo</DialogTitle>
              <DialogDescription>Defina o que e quando você vai estudar nesta semana.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">O que estudar?</Label>
                <Input 
                  id="title" 
                  placeholder="Ex: Revisão de Atos Administrativos" 
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Disciplina</Label>
                <Select value={newTask.subject} onValueChange={(v) => setNewTask({...newTask, subject: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a matéria" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="day">Dia da Semana</Label>
                <Select value={newTask.dayOffset} onValueChange={(v) => setNewTask({...newTask, dayOffset: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map((day, i) => (
                      <SelectItem key={day} value={String(i)}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddTask} disabled={isSubmitting || !newTask.title || !newTask.subject}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Agendar Estudo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      {/* Weekly View */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4 overflow-x-auto pb-4">
        {weekDates.map((date, index) => {
          const dayTasks = tasks?.filter(t => {
            const taskDate = t.date instanceof Timestamp ? t.date.toDate() : new Date(t.date);
            return isSameDay(taskDate, date);
          }) || [];

          // Highlight "today" only after the client component has hydrated to avoid server/client mismatch
          const isToday = isMounted && isSameDay(new Date(), date);

          return (
            <div key={index} className="flex flex-col gap-3 min-w-[200px] md:min-w-0">
              <div className={cn(
                "p-3 rounded-xl text-center border-b-2 transition-all",
                isToday ? "bg-primary/5 border-primary" : "bg-muted/30 border-transparent"
              )}>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{DAYS_OF_WEEK[index]}</p>
                <p className="text-xl font-bold">{format(date, 'dd')}</p>
              </div>

              <div className="space-y-3 min-h-[300px]">
                {isLoading ? (
                  <div className="space-y-2">
                    <Card className="h-20 animate-pulse bg-muted/20" />
                  </div>
                ) : dayTasks.length > 0 ? (
                  dayTasks.map(task => (
                    <Card key={task.id} className={cn(
                      "group relative border shadow-sm transition-all duration-300",
                      task.isCompleted ? "opacity-50 border-emerald-200 bg-emerald-50/10" : "hover:border-primary/40 hover:shadow-md"
                    )}>
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <Checkbox 
                            checked={task.isCompleted} 
                            onCheckedChange={() => handleToggleTask(task.id, task.isCompleted)}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              "text-xs font-bold leading-tight break-words",
                              task.isCompleted && "line-through text-muted-foreground"
                            )}>
                              {task.title}
                            </p>
                            <span className="text-[9px] font-black uppercase text-accent mt-1 block">{task.subject}</span>
                          </div>
                          <button 
                            onClick={() => handleDeleteTask(task.id)}
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full border-2 border-dashed rounded-2xl opacity-20">
                    <Circle className="h-6 w-6" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
