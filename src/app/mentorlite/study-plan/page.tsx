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
import { Input } from '@/components/ui/input';

const formSchema = z.object({
  hoursPerDay: z.string().min(1, { message: 'Informe as horas.' }),
  daysOfWeek: z.string().min(5, { message: 'Informe os dias.' }),
  goals: z.string().min(10, { message: 'Por favor, descreva seus objetivos.' }),
  examDate: z.string().min(5, { message: 'Informe a data da prova.' }),
});

const exampleData = {
    hoursPerDay: "4 horas por dia",
    daysOfWeek: "Segunda a Sábado",
    goals: "Ser aprovado no concurso para Soldado da PMMG. Preciso focar em Português e Direitos Humanos, que são meus pontos fracos.",
    examDate: "Daqui a 6 meses"
};


export default function StudyPlanPage() {
  const [studyPlan, setStudyPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      hoursPerDay: '',
      daysOfWeek: '',
      goals: '',
      examDate: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setError(null);
    setStudyPlan(null);
    try {
      const result = await handleGenerateStudyPlan(values);
      setStudyPlan(result.studyPlan);
    } catch (e: any) {
      setError(e.message || 'Ocorreu um erro ao gerar o plano. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }

  const fillExample = () => {
    form.setValue('hoursPerDay', exampleData.hoursPerDay);
    form.setValue('daysOfWeek', exampleData.daysOfWeek);
    form.setValue('goals', exampleData.goals);
    form.setValue('examDate', exampleData.examDate);
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
        <Card>
            <CardHeader>
                <CardTitle>Suas Informações</CardTitle>
                <CardDescription>Quanto mais detalhes, melhor será o plano gerado.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                        control={form.control}
                        name="hoursPerDay"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Quantidade de horas por dia</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: 3 horas líquidas" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="daysOfWeek"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Quais dias da semana pode estudar?</FormLabel>
                            <FormControl>
                               <Input placeholder="Ex: Segunda a Sexta" {...field} />
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
                        name="examDate"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Data provável da prova</FormLabel>
                            <FormControl>
                               <Input placeholder="Ex: Daqui a 3 meses" {...field} />
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
        </Card>

        <Card className="flex flex-col sticky top-4">
            <CardHeader>
                <CardTitle>Seu Plano Gerado por IA</CardTitle>
                <CardDescription>Aqui está sua sugestão de cronograma e foco de estudo.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center min-h-[400px]">
                {isLoading && <Loader2 className="h-8 w-8 animate-spin text-primary" />}
                {error && <p className="text-destructive text-center">{error}</p>}
                {studyPlan && <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap h-full overflow-y-auto max-h-[600px]">{studyPlan}</div>}
                {!isLoading && !studyPlan && !error && (
                    <div className="text-center text-muted-foreground p-8">
                        <Sparkles className="mx-auto h-12 w-12" />
                        <p className="mt-4">Seu plano de estudo aparecerá aqui após preencher as informações e clicar em "Gerar".</p>
                    </div>
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
