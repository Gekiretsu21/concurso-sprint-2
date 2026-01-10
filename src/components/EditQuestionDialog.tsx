'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Loader2, Pencil } from 'lucide-react';
import { Question } from './QuestionList';
import { useFirebase } from '@/firebase';
import { updateQuestion } from '@/firebase/actions';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from './ui/scroll-area';

const questionEditSchema = z.object({
  Enunciado: z.string().min(1, 'O enunciado é obrigatório.'),
  a: z.string().optional(),
  b: z.string().optional(),
  c: z.string().optional(),
  d: z.string().optional(),
  e: z.string().optional(),
  correctAnswer: z.string().min(1, 'É necessário definir a resposta correta.'),
});

type QuestionEditForm = z.infer<typeof questionEditSchema>;

interface EditQuestionDialogProps {
  question: Question;
}

export function EditQuestionDialog({ question }: EditQuestionDialogProps) {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<QuestionEditForm>({
    resolver: zodResolver(questionEditSchema),
    defaultValues: {
      Enunciado: question.Enunciado,
      a: question.a,
      b: question.b,
      c: question.c,
      d: question.d,
      e: question.e,
      correctAnswer: question.correctAnswer,
    },
  });

  const onSubmit = async (data: QuestionEditForm) => {
    if (!firestore) return;

    setIsSubmitting(true);
    try {
      await updateQuestion(firestore, question.id, data);
      toast({
        title: 'Sucesso!',
        description: 'A questão foi atualizada.',
      });
      setIsOpen(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível atualizar a questão.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Pencil className="h-4 w-4" />
          <span className="sr-only">Editar Questão</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Editar Questão</DialogTitle>
          <DialogDescription>
            Faça as alterações necessárias no enunciado e nas alternativas.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="enunciado">Enunciado</Label>
            <Textarea
              id="enunciado"
              rows={8}
              {...form.register('Enunciado')}
            />
             {form.formState.errors.Enunciado && <p className="text-sm text-destructive">{form.formState.errors.Enunciado.message}</p>}
          </div>

          {(['a', 'b', 'c', 'd', 'e'] as const).map(alt => (
            <div key={alt} className="space-y-2">
              <Label htmlFor={`alt-${alt}`}>Alternativa {alt.toUpperCase()}</Label>
              <Input id={`alt-${alt}`} {...form.register(alt)} />
            </div>
          ))}

          <div className="space-y-2">
            <Label htmlFor="correctAnswer">Resposta Correta</Label>
            <Input
              id="correctAnswer"
              placeholder="Ex: a, b, c..."
              {...form.register('correctAnswer')}
            />
             {form.formState.errors.correctAnswer && <p className="text-sm text-destructive">{form.formState.errors.correctAnswer.message}</p>}
          </div>
          
           <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="outline">
                    Cancelar
                    </Button>
                </DialogClose>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar Alterações
                </Button>
            </DialogFooter>
        </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
