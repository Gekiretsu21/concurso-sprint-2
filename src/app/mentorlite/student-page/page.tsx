'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { ExternalLink, FileText, PlayCircle, MessageSquare, BookOpen, Target, CheckCircle2, Users } from 'lucide-react';
import Link from 'next/link';

export default function StudentPage() {
  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Página do Aluno</h1>
        <p className="text-muted-foreground">
          Siga atentamente os passos abaixo para usufruir ao máximo da mentoria. A constância vence o talento, e aqui você encontra a estratégia certa.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" /> Primeiros Passos
            </CardTitle>
            <CardDescription>O que você deve fazer agora para começar com o pé direito.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">1</div>
              <div>
                <p className="font-semibold">Assista aos vídeos iniciais</p>
                <p className="text-sm text-muted-foreground">Ali embaixo temos uma sequência de vídeos: Mindset, Boas-vindas, Cronograma e MentorIA.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">2</div>
              <div>
                <p className="font-semibold">Aceite no seu e-mail e siga as instruções</p>
                <p className="text-sm text-muted-foreground">No seu e-mail, haverá os links para acessar as ferramentas. Acesse cada uma delas.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">3</div>
              <div>
                <p className="font-semibold">Visite as funções do Site</p>
                <p className="text-sm text-muted-foreground">Nosso site possui o complemento ideal para seus estudos: Flashcards, Simulados, Questões e Provas Anteriores.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">4</div>
              <div>
                <p className="font-semibold">SUPER STRIKE (SS)</p>
                <p className="text-sm text-muted-foreground">Assista o Tutorial do Super Strike. Gere o SS todos os dias logo após estudar.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" /> Metas Semanais
            </CardTitle>
            <CardDescription>Mantenha o ritmo de aprovação.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2 text-center p-4 rounded-lg bg-muted/50 border border-dashed">
              <p className="text-sm font-medium text-muted-foreground">Mínimo de Questões</p>
              <p className="text-3xl font-bold">100<span className="text-sm font-normal text-muted-foreground">/sem</span></p>
            </div>
            <div className="space-y-2 text-center p-4 rounded-lg bg-muted/50 border border-dashed">
              <p className="text-sm font-medium text-muted-foreground">Flashcards revisados</p>
              <p className="text-3xl font-bold">80<span className="text-sm font-normal text-muted-foreground">/sem</span></p>
            </div>
            <Button asChild className="w-full">
              <Link href="/mentorlite/questions">Ir para Prática</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BookOpen className="h-6 w-6" /> Manual da Aprovação
        </h2>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>Como usar o Banco de Questões?</AccordionTrigger>
            <AccordionContent>
              Utilize os filtros para focar na sua banca e cargo. O segredo não é apenas resolver, mas entender o porquê de cada acerto e erro. Analise os comentários e tire suas dúvidas.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>O poder dos Flashcards (Aprendizado Ativo)</AccordionTrigger>
            <AccordionContent>
              A repetição espaçada é a melhor forma de memorizar conceitos complexos. Revise seus flashcards diariamente para garantir que o conhecimento não escape da memória de longo prazo.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>Quando devo fazer um Simulado?</AccordionTrigger>
            <AccordionContent>
              Recomendamos simulados quinzenais ou mensais, dependendo da sua fase de estudo. Eles servem para testar sua gestão de tempo, controle emocional e identificar lacunas no conteúdo.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-xl">Vídeos Recomendados para iniciar os estudos</CardTitle>
            <CardDescription>Tudo que precisa para iniciar o caminho da sua aprovação.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start h-auto py-3 px-4 text-left" asChild>
              <Link href="https://youtu.be/1XfBaufahtM" target="_blank">
                <div className="flex items-center gap-3">
                  <PlayCircle className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-semibold leading-none">Mindset da Aprovação</p>
                    <p className="text-xs text-muted-foreground mt-1">Blindando sua mente</p>
                  </div>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start h-auto py-3 px-4 text-left" asChild>
              <Link href="https://youtu.be/ygGsansZ8nM" target="_blank">
                <div className="flex items-center gap-3">
                  <PlayCircle className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-semibold leading-none">Onboard</p>
                    <p className="text-xs text-muted-foreground mt-1">Seja bem-vindo à Mentoria Academy</p>
                  </div>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start h-auto py-3 px-4 text-left" asChild>
              <Link href="https://youtu.be/EUNubrYsuzo" target="_blank">
                <div className="flex items-center gap-3">
                  <PlayCircle className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-semibold leading-none">Seu Cronograma</p>
                    <p className="text-xs text-muted-foreground mt-1">Entenda como funciona o seu cronograma</p>
                  </div>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start h-auto py-3 px-4 text-left" asChild>
              <Link href="https://youtu.be/EjNubrYsuzo" target="_blank">
                <div className="flex items-center gap-3">
                  <PlayCircle className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-semibold leading-none">SUPER STRIKE</p>
                    <p className="text-xs text-muted-foreground mt-1">Um grande diferencial na sua aprovação</p>
                  </div>
                </div>
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" /> Links e Documentos
            </CardTitle>
            <CardDescription>Acesso rápido aos seus materiais.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="secondary" className="w-full justify-between" asChild>
              <Link href="https://drive.google.com/drive/folders/1nt9Tek397SZFw5mOo14Y6fzCVdhsicLX?usp=drive_link" target="_blank">
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Arsenal - Drive de Materiais
                </span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-between" asChild>
              <Link href="https://api.whatsapp.com/send/?phone=5531984585846" target="_blank">
                <span className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" /> Suporte no WhatsApp
                </span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <footer className="text-center py-12 border-t border-dashed mt-8">
        <p className="text-muted-foreground italic">"A constância vence o talento." - Mentoria Academy</p>
      </footer>
    </div>
  );
}
