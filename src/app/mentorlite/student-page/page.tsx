'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { ExternalLink, FileText, PlayCircle, MessageSquare, BookOpen, Target, CheckCircle2, Users, Trophy, ChevronRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { GlowingEffect } from '@/components/ui/glowing-effect';

export default function StudentPage() {
  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto pb-20">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent animate-pulse" />
            <span className="text-xs font-bold tracking-widest text-accent uppercase">Área do MentorIA+</span>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-950">Guia de Aprovação</h1>
        <p className="text-lg text-slate-700 max-w-3xl leading-relaxed">
          Siga a estratégia validada pelos aprovados. A constância vence o talento, e aqui você encontra o mapa do tesouro.
        </p>
      </header>

      {/* Seção Principal: Trilha e Metas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Lado Esquerdo: Timeline de Passos */}
        <section className="lg:col-span-2">
          <div className="relative h-full rounded-[1.5rem] border-[0.75px] border-border p-1">
            <GlowingEffect
              spread={40}
              glow={true}
              disabled={false}
              proximity={64}
              inactiveZone={0.01}
              borderWidth={3}
            />
            <Card className="relative z-10 border-none shadow-xl shadow-black/5 bg-white overflow-hidden h-full">
              <CardHeader className="bg-slate-50/50 border-b">
                <CardTitle className="text-2xl flex items-center gap-2 text-slate-900">
                  <Target className="h-6 w-6 text-accent" /> Sua Trilha Inicial
                </CardTitle>
                <CardDescription className="text-slate-600">Complete estas etapas para configurar seu mindset.</CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="relative space-y-12">
                  {/* Linha vertical conectando os passos */}
                  <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gradient-to-b from-accent via-accent/50 to-transparent z-0 hidden sm:block" />
                  
                  {/* Passo 1 */}
                  <div className="relative z-10 flex gap-6 group">
                    <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-accent text-accent-foreground font-bold text-sm shadow-lg ring-4 ring-white transition-transform group-hover:scale-110">1</div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-900 mb-1">Dê o Play no Mindset</h4>
                      <p className="text-slate-600 leading-relaxed">Assista aos vídeos de Mindset, Boas-vindas e Cronograma localizados no final desta página.</p>
                    </div>
                  </div>

                  {/* Passo 2 */}
                  <div className="relative z-10 flex gap-6 group">
                    <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-accent text-accent-foreground font-bold text-sm shadow-lg ring-4 ring-white transition-transform group-hover:scale-110">2</div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-900 mb-1">Configuração de Acesso</h4>
                      <p className="text-slate-600 leading-relaxed">Verifique seu e-mail e aceite os convites. Siga cada tutorial para liberar suas ferramentas táticas.</p>
                    </div>
                  </div>

                  {/* Passo 3 */}
                  <div className="relative z-10 flex gap-6 group">
                    <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-accent text-accent-foreground font-bold text-sm shadow-lg ring-4 ring-white transition-transform group-hover:scale-110">3</div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-900 mb-1">Explore o Ecossistema</h4>
                      <p className="text-slate-600 leading-relaxed">Navegue pelas abas de Flashcards, Simulados e Questões. Familiarize-se com onde você passará a maior parte do seu tempo.</p>
                    </div>
                  </div>

                  {/* Passo 4 */}
                  <div className="relative z-10 flex gap-6 group">
                    <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-accent text-accent-foreground font-bold text-sm shadow-lg ring-4 ring-white transition-transform group-hover:scale-110">4</div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-900 mb-1">Rotina Super Strike (SS)</h4>
                      <p className="text-slate-600 leading-relaxed">Assista ao tutorial do Super Strike. Gere o seu SS todos os dias sem exceção logo após fechar os livros.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Lado Direito: Metas e Status */}
        <section className="space-y-6">
          <div className="relative rounded-[1.5rem] border-[0.75px] border-border p-1">
            <GlowingEffect
              spread={40}
              glow={true}
              disabled={false}
              proximity={64}
              inactiveZone={0.01}
              borderWidth={3}
            />
            <Card className="relative z-10 border-none shadow-xl bg-gradient-to-b from-white to-slate-50 overflow-hidden ring-1 ring-accent/20">
              <CardHeader className="text-center pb-2">
                <Trophy className="h-10 w-10 text-accent mx-auto mb-2 animate-bounce" />
                <CardTitle className="text-xl font-bold text-slate-900">Metas da Vitória</CardTitle>
                <CardDescription>Mantenha esse ritmo mensal (Meta: 200)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex flex-col items-center p-4 rounded-xl bg-white border border-accent/10 shadow-sm">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Mínimo de Questões</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-accent">50</span>
                      <span className="text-slate-400 font-medium">/sem</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center p-4 rounded-xl bg-white border border-accent/10 shadow-sm">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Flashcards Revisados</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-accent">20</span>
                      <span className="text-slate-400 font-medium">/sem</span>
                    </div>
                  </div>
                </div>
                
                <Button asChild className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-black py-6 text-lg shadow-lg shadow-accent/30 group transition-all">
                  <Link href="/mentorlite/questions" className="flex items-center justify-center gap-2">
                    BATER META AGORA <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Links Rápidos Compactos */}
          <div className="relative rounded-[1.5rem] border-[0.75px] border-border p-1">
            <GlowingEffect
              spread={40}
              glow={true}
              disabled={false}
              proximity={64}
              inactiveZone={0.01}
              borderWidth={3}
            />
            <Card className="relative z-10 border-none shadow-md bg-white overflow-hidden">
              <CardHeader className="py-4">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
                      <FileText className="h-4 w-4 text-accent" /> Documentos Úteis
                  </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 px-4 pb-4">
                  <Button variant="outline" className="w-full justify-between h-12 text-slate-700 hover:bg-accent/5 hover:text-accent border-accent/20" asChild>
                      <Link href="https://drive.google.com/drive/folders/1nt9Tek397SZFw5mOo14Y6fzCVdhsicLX?usp=drive_link" target="_blank">
                          <span className="flex items-center gap-2 font-semibold">Drive de Materiais</span>
                          <ExternalLink className="h-4 w-4" />
                      </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-between h-12 text-slate-700 hover:bg-accent/5 hover:text-accent border-accent/20" asChild>
                      <Link href="https://api.whatsapp.com/send/?phone=5531984585846" target="_blank">
                          <span className="flex items-center gap-2 font-semibold">Suporte no WhatsApp</span>
                          <MessageSquare className="h-4 w-4" />
                      </Link>
                  </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>

      {/* Seção Central: Manual */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-slate-900">
          <BookOpen className="h-6 w-6 text-accent" /> Manual do Guerreiro
        </h2>
        <div className="relative rounded-[1.5rem] border-[0.75px] border-border p-1">
          <GlowingEffect
            spread={40}
            glow={true}
            disabled={false}
            proximity={64}
            inactiveZone={0.01}
            borderWidth={3}
          />
          <Card className="relative z-10 border-none shadow-lg bg-white overflow-hidden">
              <CardContent className="p-2">
                  <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1" className="border-b-accent/10 px-4">
                      <AccordionTrigger className="hover:text-accent font-bold text-slate-800 py-4">Como usar o Banco de Questões?</AccordionTrigger>
                      <AccordionContent className="text-slate-600 text-base leading-relaxed">
                      Utilize os filtros para focar na sua banca e cargo. O segredo não é apenas resolver, mas entender o porquê de cada acerto e erro. Analise os comentários e tire suas dúvidas.
                      </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-2" className="border-b-accent/10 px-4">
                      <AccordionTrigger className="hover:text-accent font-bold text-slate-800 py-4">O poder dos Flashcards (Aprendizado Ativo)</AccordionTrigger>
                      <AccordionContent className="text-slate-600 text-base leading-relaxed">
                      A repetição espaçada é a melhor forma de memorizar conceitos complexos. Revise seus flashcards diariamente para garantir que o conhecimento não escape da memória de longo prazo.
                      </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-3" className="border-none px-4">
                      <AccordionTrigger className="hover:text-accent font-bold text-slate-800 py-4">Quando devo fazer um Simulado?</AccordionTrigger>
                      <AccordionContent className="text-slate-600 text-base leading-relaxed">
                      Recomendamos simulados quinzenais ou mensais, dependendo da sua fase de estudo. Eles servem para testar sua gestão de tempo, controle emocional e identificar lacunas no conteúdo.
                      </AccordionContent>
                  </AccordionItem>
                  </Accordion>
              </CardContent>
          </Card>
        </div>
      </section>

      {/* Seção Inferior: Vídeos */}
      <section className="space-y-6">
        <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-slate-900">
                <PlayCircle className="h-6 w-6 text-accent" /> Vídeos Recomendados
            </h2>
            <p className="text-slate-600 font-medium">Fundamentos essenciais para iniciar sua jornada.</p>
        </div>
        
        <div className="relative rounded-[1.5rem] border-[0.75px] border-border p-1">
          <GlowingEffect
            spread={40}
            glow={true}
            disabled={false}
            proximity={64}
            inactiveZone={0.01}
            borderWidth={3}
          />
          <Card className="relative z-10 border-none shadow-xl bg-white overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col gap-4">
                  <Button variant="outline" className="group w-full justify-start h-auto py-4 px-5 text-left border-accent/20 hover:bg-accent/10 hover:border-accent/40 transition-all" asChild>
                  <Link href="https://youtu.be/1XfBaufahtM" target="_blank">
                      <div className="flex items-center gap-4">
                      <div className="bg-accent/10 p-3 rounded-full group-hover:bg-accent/20 transition-colors">
                          <PlayCircle className="h-8 w-8 text-accent" />
                      </div>
                      <div>
                          <p className="font-black text-slate-900 leading-tight">Mindset da Aprovação</p>
                          <p className="text-sm text-slate-500 mt-1">Prepare sua mente para a guerra.</p>
                      </div>
                      </div>
                  </Link>
                  </Button>

                  <Button variant="outline" className="group w-full justify-start h-auto py-4 px-5 text-left border-accent/20 hover:bg-accent/10 hover:border-accent/40 transition-all" asChild>
                  <Link href="https://youtu.be/yGg5ansZ8nM" target="_blank">
                      <div className="flex items-center gap-4">
                      <div className="bg-accent/10 p-3 rounded-full group-hover:bg-accent/20 transition-colors">
                          <PlayCircle className="h-8 w-8 text-accent" />
                      </div>
                      <div>
                          <p className="font-black text-slate-900 leading-tight">Onboard MentorIA</p>
                          <p className="text-sm text-slate-500 mt-1">Conheça cada detalhe da plataforma.</p>
                      </div>
                      </div>
                  </Link>
                  </Button>

                  <Button variant="outline" className="group w-full justify-start h-auto py-4 px-5 text-left border-accent/20 hover:bg-accent/10 hover:border-accent/40 transition-all" asChild>
                  <Link href="https://youtu.be/EjMubrYSuzo" target="_blank">
                      <div className="flex items-center gap-4">
                      <div className="bg-accent/10 p-3 rounded-full group-hover:bg-accent/20 transition-colors">
                          <PlayCircle className="h-8 w-8 text-accent" />
                      </div>
                      <div>
                          <p className="font-black text-slate-900 leading-tight">Seu Cronograma</p>
                          <p className="text-sm text-slate-500 mt-1">Aprenda a executar o seu plano tático.</p>
                      </div>
                      </div>
                  </Link>
                  </Button>

                  <Button variant="outline" className="group w-full justify-start h-auto py-4 px-5 text-left border-accent/20 hover:bg-accent/10 hover:border-accent/40 transition-all" asChild>
                  <Link href="https://youtu.be/ybnbcWxMSok" target="_blank">
                      <div className="flex items-center gap-4">
                      <div className="bg-accent/10 p-3 rounded-full group-hover:bg-accent/20 transition-colors">
                          <PlayCircle className="h-8 w-8 text-accent" />
                      </div>
                      <div>
                          <p className="font-black text-slate-900 leading-tight">SUPER STRIKE</p>
                          <p className="text-sm text-slate-500 mt-1">O diferencial que te coloca na frente.</p>
                      </div>
                      </div>
                  </Link>
                  </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <footer className="text-center py-12 border-t border-accent/10 mt-8">
        <p className="text-slate-400 italic text-lg">"A constância vence o talento." - Mentoria Academy</p>
      </footer>
    </div>
  );
}
