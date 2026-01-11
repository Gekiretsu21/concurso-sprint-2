'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
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
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Loader2, Pencil } from 'lucide-react';
import { useFirebase } from '@/firebase';
import { updateFlashcard } from '@/firebase/actions';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from './ui/scroll-area';

interface Flashcard {
  id: string;
  front: string;
  back: string;
}

const flashcardEditSchema = z.object({
  front: z.string().min(1, 'A frente do flashcard é obrigatória.'),
  back: z.string().min(1, 'O verso do flashcard é obrigatório.'),
});

type FlashcardEditForm = z.infer<typeof flashcardEditSchema>;

interface EditFlashcardDialogProps {
  flashcard: Flashcard;
}

export function EditFlashcardDialog({ flashcard }: EditFlashcardDialogProps) {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FlashcardEditForm>({
    resolver: zodResolver(flashcardEditSchema),
    defaultValues: {
      front: flashcard.front,
      back: flashcard.back,
    },
  });

  const onSubmit = async (data: FlashcardEditForm) => {
    if (!firestore) return;

    setIsSubmitting(true);
    try {
      await updateFlashcard(firestore, flashcard.id, data);
      toast({
        title: 'Sucesso!',
        description: 'O flashcard foi atualizado.',
      });
      setIsOpen(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível atualizar o flashcard.',
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
          <span className="sr-only">Editar Flashcard</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Editar Flashcard</DialogTitle>
          <DialogDescription>
            Faça as alterações necessárias na frente e no verso do flashcard.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="front">Frente (Pergunta)</Label>
            <Textarea
              id="front"
              rows={6}
              {...form.register('front')}
            />
             {form.formState.errors.front && <p className="text-sm text-destructive">{form.formState.errors.front.message}</p>}
          </div>

           <div className="space-y-2">
            <Label htmlFor="back">Verso (Resposta)</Label>
            <Textarea
              id="back"
              rows={6}
              {...form.register('back')}
            />
             {form.formState.errors.back && <p className="text-sm text-destructive">{form.formState.errors.back.message}</p>}
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
