
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
import { type Question } from './QuestionList';
import { useFirebase } from '@/firebase';
import { updateQuestion } from '@/firebase/actions';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
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
  is_god_mode: z.boolean().default(false),
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
      Materia: question.Materia || '',
      Ano: question.Ano || '',
      Assunto: question.Assunto || '',
      Cargo: question.Cargo || '',
      Banca: question.Banca || '',
      Enunciado: question.Enunciado || '',
      a: question.a || '',
      b: question.b || '',
      c: question.c || '',
      d: question.d || '',
      e: question.e || '',
      correctAnswer: question.correctAnswer || '',
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
      is_god_mode: question.is_god_mode || false,
    },
  });

  const onSubmit = async (data: QuestionEditForm) => {
    if (!firestore) return;

    setIsSubmitting(true);
    try {
      await updateQuestion(firestore, question.id, data);
      toast({
        title: 'Sucesso!',
        description: 'A questão foi atualizada com sucesso.',
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="hover:bg-accent/10">
          <Pencil className="h-4 w-4" />
          <span className="sr-only">Editar Questão</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-5xl max-h-[95vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl rounded-2xl">
        <DialogHeader className="p-6 pb-2 bg-slate-950 text-white shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                <Pencil className="h-5 w-5 text-accent" /> Editor de Comando Tático
              </DialogTitle>
              <DialogDescription className="text-slate-400 font-medium">
                Gestão total de conteúdo e inteligência do Método Academy.
              </DialogDescription>
            </div>
            {form.watch('is_god_mode') && (
              <Badge className="bg-accent text-accent-foreground font-black px-4 py-1.5 rounded-full border-none">
                MODO ACADEMY ATIVO
              </Badge>
            )}
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-8 bg-slate-50/50" style={{ maxHeight: 'calc(95vh - 140px)' }}>
          <form id="edit-question-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-10 py-8 pb-32">
            
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-slate-900 font-black text-sm uppercase tracking-[0.2em] border-b pb-2 border-slate-200">
                <Info className="h-4 w-4 text-accent" /> 01. Identificação Estratégica
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-slate-500">Matéria</Label>
                  <Input {...form.register('Materia')} className="bg-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-slate-500">Assunto</Label>
                  <Input {...form.register('Assunto')} className="bg-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-slate-500">Banca Organizadora</Label>
                  <Input {...form.register('Banca')} className="bg-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-slate-500">Ano</Label>
                  <Input {...form.register('Ano')} className="bg-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-slate-500">Cargo Alvo</Label>
                  <Input {...form.register('Cargo')} className="bg-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-slate-500">Gabarito (Letra)</Label>
                  <Input {...form.register('correctAnswer')} placeholder="Ex: a" className="bg-white border-accent/30 focus:border-accent" />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3 text-slate-900 font-black text-sm uppercase tracking-[0.2em] border-b pb-2 border-slate-200">
                <BookOpen className="h-4 w-4 text-accent" /> 02. Enunciado e Alternativas
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-slate-500">Enunciado da Questão</Label>
                <Textarea rows={8} {...form.register('Enunciado')} className="bg-white font-medium leading-relaxed" />
              </div>
              <div className="grid grid-cols-1 gap-4">
                {(['a', 'b', 'c', 'd', 'e'] as const).map(alt => (
                  <div key={alt} className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Alternativa {alt.toUpperCase()}</Label>
                    <Input {...form.register(alt)} className="bg-white" />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-8 p-8 rounded-[2.5rem] bg-white border-2 border-slate-100 shadow-xl shadow-slate-200/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-blue-700 font-black text-sm uppercase tracking-[0.2em]">
                  <Sparkles className="h-5 w-5 fill-current" /> 03. Inteligência Método Academy
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="is_god_mode" 
                    {...form.register('is_god_mode')} 
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <Label htmlFor="is_god_mode" className="text-xs font-bold text-slate-600 cursor-pointer">Pertence ao Método Academy?</Label>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-8">
                <div className="space-y-4 p-6 rounded-2xl bg-blue-50/30 border border-blue-100">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-blue-600 tracking-wider">Título da Contextualização</Label>
                      <Input {...form.register('god_mode_context_title')} placeholder="Ex: CONTEXTO E CONCEITOS PRINCIPAIS" className="bg-white border-blue-200" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-blue-600 tracking-wider">Texto de Apoio Tático</Label>
                      <Textarea {...form.register('god_mode_context_text')} rows={5} className="bg-white border-blue-200" />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-blue-600 tracking-wider">Título do Bloco de Análise</Label>
                    <Input {...form.register('god_mode_analysis_title')} placeholder="Ex: ANÁLISE TÁTICA DAS ALTERNATIVAS" className="bg-white" />
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {(['a', 'b', 'c', 'd', 'e'] as const).map(alt => (
                      <div key={`academy-${alt}`} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start p-5 rounded-2xl bg-white border border-slate-100 shadow-sm">
                        <div className="space-y-2">
                          <Label className="text-[9px] uppercase font-black text-slate-400">Status Alt {alt.toUpperCase()}</Label>
                          <Input 
                            {...form.register(`god_mode_status_${alt}` as any)} 
                            placeholder="CORRETA / INCORRETA" 
                            className={cn(
                              "h-9 font-bold text-xs",
                              form.watch('correctAnswer').toLowerCase() === alt ? "border-emerald-500 text-emerald-600" : "border-red-200 text-red-600"
                            )} 
                          />
                        </div>
                        <div className="md:col-span-3 space-y-2">
                          <Label className="text-[9px] uppercase font-black text-slate-400">Justificativa Técnica</Label>
                          <Textarea {...form.register(`god_mode_justification_${alt}` as any)} rows={2} className="text-sm bg-slate-50/50" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4 p-6 rounded-2xl bg-indigo-50/30 border border-indigo-100">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-indigo-600">Título Conceito-Chave</Label>
                      <Input {...form.register('god_mode_concept_title')} className="bg-white border-indigo-200" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-indigo-600">Conteúdo do Conceito</Label>
                      <Textarea {...form.register('god_mode_concept_text')} rows={4} className="bg-white border-indigo-200" />
                    </div>
                  </div>
                  <div className="space-y-4 p-6 rounded-2xl bg-emerald-50/30 border border-emerald-100">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-emerald-600">Título Síntese de Revisão</Label>
                      <Input {...form.register('god_mode_summary_title')} className="bg-white border-emerald-200" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-emerald-600">Conteúdo da Síntese</Label>
                      <Textarea {...form.register('god_mode_summary_text')} rows={4} className="bg-white border-emerald-200 font-mono text-xs" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="p-6 border-t bg-slate-100/50 shrink-0 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          <DialogClose asChild>
            <Button type="button" variant="outline" className="rounded-xl px-8">
              Cancelar
            </Button>
          </DialogClose>
          <Button form="edit-question-form" type="submit" disabled={isSubmitting} className="font-black uppercase tracking-widest text-xs px-10 h-12 rounded-xl shadow-xl shadow-slate-900/10">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar Alterações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
