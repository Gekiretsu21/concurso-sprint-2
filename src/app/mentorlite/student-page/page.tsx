'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CheckCircle2, PlayCircle, ExternalLink, Compass, Trophy, Lightbulb, Youtube, Layout, FileText, Users } from 'lucide-react';
import Link from 'next/link';

export default function StudentPage() {
  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2 text-primary">
          <Compass className="h-8 w-8" /> Página do Aluno
        </h1>
        <p className="text-muted-foreground text-lg">
          Seu guia definitivo para dominar a metodologia e acelerar sua aprovação.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="text-primary h-5 w-5" /> Primeiros Passos
            </CardTitle>
            <CardDescription>O que você deve fazer agora para começar com o pé direito.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-card rounded-lg border">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">1</span>
                <div>
                  <p className="font-semibold text-sm">Assista ao Vídeo de Boas-Vindas</p>
                  <p className="text-xs text-muted-foreground mt-1">Entenda como a Mentoria Academy vai transformar seu estudo.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-card rounded-lg border">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">2</span>
                <div>
                  <p className="font-semibold text-sm">Configure seu Dashboard</p>
                  <p className="text-xs text-muted-foreground mt-1">Defina suas metas e familiarize-se com as ferramentas de questões e flashcards.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-card rounded-lg border">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">3</span>
                <div>
                  <p className="font-semibold text-sm">Acesse o Material de Apoio</p>
                  <p className="text-xs text-muted-foreground mt-1">O link do Drive contém guias de redação, cronogramas e PDFs exclusivos.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-accent/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="text-accent h-5 w-5" /> Metas Semanais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 border rounded-md text-sm">
              <p className="font-medium">Mínimo de Questões</p>
              <p className="text-2xl font-bold text-primary">50/semana</p>
            </div>
            <div className="p-3 border rounded-md text-sm">
              <p className="font-medium">Flashcards Novos</p>
              <p className="text-2xl font-bold text-accent">20/semana</p>
            </div>
            <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" asChild>
              <Link href="/mentorlite/questions">Ir para Prática</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Manual da Aprovação</h2>
        <Accordion type="single" collapsible className="w-full space-y-2">
          <AccordionItem value="item-1" className="border rounded-lg px-4 bg-card">
            <AccordionTrigger className="hover:no-underline">Como usar o Banco de Questões?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              O segredo não é apenas resolver, mas analisar cada erro. Use os filtros por matéria e assunto para atacar suas maiores dificuldades primeiro. Sempre leia os comentários após responder!
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2" className="border rounded-lg px-4 bg-card">
            <AccordionTrigger className="hover:no-underline">O poder dos Flashcards (Aprendizado Ativo)</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              Nossos flashcards são baseados na Repetição Espaçada. Revise diariamente os cartões que você errou. Isso transfere o conhecimento da memória de curto prazo para a de longo prazo.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3" className="border rounded-lg px-4 bg-card">
            <AccordionTrigger className="hover:no-underline">Quando devo fazer um Simulado?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              Recomendamos um simulado completo a cada 15 dias. No MentorIA+, você tem acesso a simulados exclusivos de banca que replicam o nível real de dificuldade da sua prova.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Youtube className="text-red-600 h-5 w-5" /> Vídeos Recomendados
            </CardTitle>
            <CardDescription>Aulas e tutoriais essenciais.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start text-left h-auto py-3 px-4" asChild>
              <Link href="https://www.youtube.com/watch?v=1XfBaufahtM" target="_blank">
                <PlayCircle className="mr-3 h-5 w-5 shrink-0 text-red-600" />
                <div className="flex flex-col overflow-hidden">
                  <span className="font-semibold truncate">Mindset da Aprovação</span>
                  <span className="text-[10px] text-muted-foreground">Mentoria Academy</span>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start text-left h-auto py-3 px-4" asChild>
              <Link href="#" target="_blank">
                <PlayCircle className="mr-3 h-5 w-5 shrink-0 text-red-600" />
                <div className="flex flex-col overflow-hidden">
                  <span className="font-semibold truncate">Como Organizar seu Cronograma</span>
                  <span className="text-[10px] text-muted-foreground">Aula Prática</span>
                </div>
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layout className="text-primary h-5 w-5" /> Links e Documentos
            </CardTitle>
            <CardDescription>Acesso rápido aos seus materiais.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="secondary" className="w-full justify-between" asChild>
              <Link href="https://drive.google.com/drive/folders/1nt9Tek397SZFw5mOo14Y6fzCVdhsicLX?usp=drive_link" target="_blank">
                <span className="flex items-center gap-2"><FileText className="h-4 w-4" /> Drive de Materiais</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </Button>
            <Button variant="secondary" className="w-full justify-between" asChild>
              <Link href="https://api.whatsapp.com/send/?phone=5531984585846" target="_blank">
                <span className="flex items-center gap-2"><Users className="h-4 w-4" /> Suporte no WhatsApp</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <footer className="text-center py-8">
        <div className="flex items-center justify-center gap-2 p-4 bg-muted rounded-2xl">
          <Lightbulb className="h-5 w-5 text-accent" />
          <p className="text-sm font-medium italic">
            "A constância vence o talento quando o talento não tem constância." - Mentoria Academy
          </p>
        </div>
      </footer>
    </div>
  );
}