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
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Loader2, Pencil, Info, Sparkles, BookOpen } from 'lucide-react';
import { Question } from './QuestionList';
import { useFirebase } from '@/firebase';
import { updateQuestion } from '@/firebase/actions';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { cn } from '@/lib/utils';

const questionEditSchema = z.object({
  Materia: z.string().min(1, 'A matéria é obrigatória.'),
  Ano: z.string().min(1, 'O ano é obrigatório.'),
  Assunto: z.string().min(1, 'O assunto é obrigatório.'),
  Cargo: z.string().min(1, 'O cargo é obrigatório.'),
  Banca: z.string().optional().nullable(),
  Enunciado: z.string().min(1, 'O enunciado é obrigatório.'),
  a: z.string().optional().nullable(),
  b: z.string().optional().nullable(),
  c: z.string().optional().nullable(),
  d: z.string().optional().nullable(),
  e: z.string().optional().nullable(),
  correctAnswer: z.string().min(1, 'É necessário definir a resposta correta.'),
  // Academy Fields
  god_mode_context_title: z.string().optional().nullable(),
  god_mode_context_text: z.string().optional().nullable(),
  god_mode_analysis_title: z.string().optional().nullable(),
  god_mode_status_a: z.string().optional().nullable(),
  god_mode_justification_a: z.string().optional().nullable(),
  god_mode_status_b: z.string().optional().nullable(),
  god_mode_justification_b: z.string().optional().nullable(),
  god_mode_status_c: z.string().optional().nullable(),
  god_mode_justification_c: z.string().optional().nullable(),
  god_mode_status_d: z.string().optional().nullable(),
  god_mode_justification_d: z.string().optional().nullable(),
  god_mode_status_e: z.string().optional().nullable(),
  god_mode_justification_e: z.string().optional().nullable(),
  god_mode_concept_title: z.string().optional().nullable(),
  god_mode_concept_text: z.string().optional().nullable(),
  god_mode_summary_title: z.string().optional().nullable(),
  god_mode_summary_text: z.string().optional().nullable(),
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
      Materia: question.Materia,
      Ano: question.Ano,
      Assunto: question.Assunto,
      Cargo: question.Cargo,
      Banca: question.Banca || '',
      Enunciado: question.Enunciado,
      a: question.a || '',
      b: question.b || '',
      c: question.c || '',
      d: question.d || '',
      e: question.e || '',
      correctAnswer: question.correctAnswer,
      god_mode_context_title: question.god_mode_context_title || '',
      god_mode_context_text: question.god_mode_context_text || '',
      god_mode_analysis_title: question.god_mode_analysis_title || '',
      god_mode_status_a: question.god_mode_status_a || '',
      god_mode_justification_a: question.god_mode_justification_a || '',
      god_mode_status_b: question.god_mode_status_b || '',
      god_mode_justification_b: question.god_mode_justification_b || '',
      god_mode_status_c: question.god_mode_status_c || '',
      god_mode_justification_c: question.god_mode_justification_c || '',
      god_mode_status_d: question.god_mode_status_d || '',
      god_mode_justification_d: question.god_mode_justification_d || '',
      god_mode_status_e: question.god_mode_status_e || '',
      god_mode_justification_e: question.god_mode_justification_e || '',
      god_mode_concept_title: question.god_mode_concept_title || '',
      god_mode_concept_text: question.god_mode_concept_text || '',
      god_mode_summary_title: question.god_mode_summary_title || '',
      god_mode_summary_text: question.god_mode_summary_text || '',
    },
  });

  const onSubmit = async (data: QuestionEditForm) => {
    if (!firestore) return;

    setIsSubmitting(true);
    try {
      await updateQuestion(firestore, question.id, data);
      toast({
        title: 'Sucesso!',
        description: 'A questão foi atualizada no banco de dados.',
      });
      setIsOpen(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro na atualização',
        description: 'Não foi possível salvar as alterações.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAcademy = question.is_god_mode;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Pencil className="h-4 w-4" />
          <span className="sr-only">Editar Questão</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Pencil className="h-5 w-5 text-primary" /> Editar Registro de Questão
          </DialogTitle>
          <DialogDescription>
            Altere qualquer campo da questão. As mudanças serão refletidas imediatamente para os alunos.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 px-6">
          <form id="edit-question-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 py-4 pb-10">
            
            {/* Seção 1: Metadados */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider">
                <Info className="h-4 w-4" /> Classificação e Identificação
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="Materia">Matéria</Label>
                  <Input id="Materia" {...form.register('Materia')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="Assunto">Assunto</Label>
                  <Input id="Assunto" {...form.register('Assunto')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="Ano">Ano</Label>
                  <Input id="Ano" {...form.register('Ano')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="Banca">Banca</Label>
                  <Input id="Banca" {...form.register('Banca')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="Cargo">Cargo</Label>
                  <Input id="Cargo" {...form.register('Cargo')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="correctAnswer">Resposta Correta (Letra)</Label>
                  <Input id="correctAnswer" placeholder="Ex: a" {...form.register('correctAnswer')} />
                </div>
              </div>
            </div>

            <Separator />

            {/* Seção 2: Enunciado e Alternativas */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider">
                <BookOpen className="h-4 w-4" /> Conteúdo da Questão
              </div>
              <div className="space-y-2">
                <Label htmlFor="Enunciado">Enunciado</Label>
                <Textarea id="Enunciado" rows={6} {...form.register('Enunciado')} className="font-medium" />
              </div>
              <div className="grid grid-cols-1 gap-4">
                {(['a', 'b', 'c', 'd', 'e'] as const).map(alt => (
                  <div key={alt} className="space-y-2">
                    <Label htmlFor={`alt-${alt}`}>Alternativa {alt.toUpperCase()}</Label>
                    <Input id={`alt-${alt}`} {...form.register(alt)} />
                  </div>
                ))}
              </div>
            </div>

            {/* Seção 3: Método Academy (Opcional) */}
            {isAcademy && (
              <>
                <Separator className="bg-blue-100" />
                <div className="space-y-6 p-6 rounded-2xl bg-blue-50/50 border border-blue-100">
                  <div className="flex items-center gap-2 text-blue-700 font-black text-sm uppercase tracking-widest">
                    <Sparkles className="h-4 w-4 fill-current" /> Inteligência Método Academy
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Título da Contextualização</Label>
                      <Input {...form.register('god_mode_context_title')} placeholder="Ex: CONTEXTO HISTÓRICO" />
                    </div>
                    <div className="space-y-2">
                      <Label>Texto da Contextualização</Label>
                      <Textarea {...form.register('god_mode_context_text')} rows={4} />
                    </div>
                  </div>

                  <div className="space-y-4 pt-4">
                    <Label className="text-blue-800 font-bold">Análise Tática das Alternativas</Label>
                    {(['a', 'b', 'c', 'd', 'e'] as const).map(alt => (
                      <div key={`academy-${alt}`} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start p-4 rounded-xl bg-white border border-blue-100">
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase font-black">Status Alt {alt.toUpperCase()}</Label>
                          <Input {...form.register(`god_mode_status_${alt}` as any)} placeholder="Ex: INCORRETA" />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <Label className="text-[10px] uppercase font-black">Justificativa Alt {alt.toUpperCase()}</Label>
                          <Textarea {...form.register(`god_mode_justification_${alt}` as any)} rows={2} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Título Conceito-Chave</Label>
                        <Input {...form.register('god_mode_concept_title')} />
                      </div>
                      <div className="space-y-2">
                        <Label>Texto Conceito-Chave</Label>
                        <Textarea {...form.register('god_mode_concept_text')} rows={3} />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Título Síntese</Label>
                        <Input {...form.register('god_mode_summary_title')} />
                      </div>
                      <div className="space-y-2">
                        <Label>Texto Síntese</Label>
                        <Textarea {...form.register('god_mode_summary_text')} rows={3} className="font-mono text-xs" />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </form>
        </ScrollArea>

        <DialogFooter className="p-6 border-t bg-slate-50">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </DialogClose>
          <Button form="edit-question-form" type="submit" disabled={isSubmitting} className="font-bold">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
