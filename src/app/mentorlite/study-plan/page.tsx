'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { handleGenerateStudyPlan } from './actions';
import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';

const formSchema = z.object({
  performanceStatistics: z.string().min(10, { message: 'Por favor, detalhe suas estatísticas.' }),
  goals: z.string().min(10, { message: 'Por favor, descreva seus objetivos.' }),
  availableResources: z.string().min(10, { message: 'Por favor, liste os recursos disponíveis.' }),
  availableTime: z.string().min(5, { message: 'Por favor, informe seu tempo disponível.' }),
});

const exampleData = {
    performanceStatistics: "Meu desempenho geral é de 65%. Tenho mais dificuldade em Direito Administrativo (50% de acerto) e Raciocínio Lógico (55%). Minhas melhores matérias são Português (80%) e Direito Constitucional (75%).",
    goals: "Meu objetivo principal é ser aprovado no concurso para Analista do Tribunal Regional Federal. Preciso aumentar meu percentual de acerto geral para pelo menos 85% nos próximos 3 meses.",
    availableResources: "Tenho acesso a videoaulas do curso 'Estratégia Concursos', PDFs de todas as matérias, e a plataforma de questões 'Qconcursos'.",
    availableTime: "Tenho 4 horas líquidas de estudo por dia de segunda a sexta, e 6 horas no sábado. Domingo é meu dia de descanso."
};


export default function StudyPlanPage() {
  const [studyPlan, setStudyPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      performanceStatistics: '',
      goals: '',
      availableResources: '',
      availableTime: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setError(null);
    setStudyPlan(null);
    try {
      const result = await handleGenerateStudyPlan(values);
      setStudyPlan(result.studyPlan);
    } catch (e) {
      setError('Ocorreu um erro ao gerar o plano. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }

  const fillExample = () => {
    form.setValue('performanceStatistics', exampleData.performanceStatistics);
    form.setValue('goals', exampleData.goals);
    form.setValue('availableResources', exampleData.availableResources);
    form.setValue('availableTime', exampleData.availableTime);
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Plano de Estudo Personalizado</h1>
          <p className="text-muted-foreground">Use nossa IA para criar um cronograma de estudos otimizado para você.</p>
        </div>
         <Button variant="outline" className="w-full md:w-auto" onClick={fillExample}>
          <Sparkles className="mr-2 h-4 w-4" />
          Preencher com Exemplo
        </Button>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="bg-black/60 border border-white/10 rounded-3xl shadow-lg shadow-black/30">
            <CardHeader className="p-6">
                <CardTitle className="text-xl">Suas Informações</CardTitle>
                <CardDescription>Quanto mais detalhes, melhor será o plano gerado.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                        control={form.control}
                        name="performanceStatistics"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Estatísticas de Desempenho</FormLabel>
                            <FormControl>
                            <Textarea placeholder="Ex: Acerto de 70% em Português, 55% em Direito Administrativo..." {...field} rows={4} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="goals"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Metas e Objetivos</FormLabel>
                            <FormControl>
                            <Textarea placeholder="Ex: Ser aprovado no concurso do TJ-SP, melhorar em Raciocínio Lógico..." {...field} rows={4} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="availableResources"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Recursos Disponíveis</FormLabel>
                            <FormControl>
                            <Textarea placeholder="Ex: Videoaulas do cursinho X, PDFs, Livro Y..." {...field} rows={3} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="availableTime"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tempo Disponível</FormLabel>
                            <FormControl>
                            <Textarea placeholder="Ex: 3 horas por dia durante a semana, 6 horas nos finais de semana." {...field} rows={3} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando...</>
                        ) : (
                            'Gerar Plano de Estudo'
                        )}
                    </Button>
                    </form>
                </Form>
            </CardContent>
        </div>

        <div className="bg-black/60 border border-white/10 rounded-3xl shadow-lg shadow-black/30 flex flex-col sticky top-4">
            <CardHeader className="p-6">
                <CardTitle className="text-xl">Seu Plano Gerado por IA</CardTitle>
                <CardDescription>Aqui está sua sugestão de cronograma e foco de estudo.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 flex-1 flex items-center justify-center min-h-[400px]">
                {isLoading && <Loader2 className="h-8 w-8 animate-spin text-primary" />}
                {error && <p className="text-destructive text-center">{error}</p>}
                {studyPlan && <div className="prose prose-sm dark:prose-invert max-w-none text-foreground whitespace-pre-wrap h-full overflow-y-auto max-h-[600px]">{studyPlan}</div>}
                {!isLoading && !studyPlan && !error && (
                    <div className="text-center text-muted-foreground p-8">
                        <Sparkles className="mx-auto h-12 w-12" />
                        <p className="mt-4">Seu plano de estudo aparecerá aqui após preencher as informações e clicar em "Gerar".</p>
                    </div>
                )}
            </CardContent>
        </div>
      </div>
    </div>
  );
}
