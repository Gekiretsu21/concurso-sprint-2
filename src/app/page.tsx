'use client';

import {
  BarChart2,
  BrainCircuit,
  ClipboardList,
  FileText,
  Flame,
  Gift,
  Layers,
  Timer,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const mainFeatures = [
  {
    title: 'Questões',
    href: '/questions',
    icon: ClipboardList,
    description: 'Pratique com milhares de questões de concurso.',
    cta: 'Começar a praticar',
  },
  {
    title: 'Simulados',
    href: '/simulated-exams',
    icon: FileText,
    description: 'Crie e realize simulados personalizados.',
    cta: 'Gerar Simulado',
  },
  {
    title: 'Flashcards',
    href: '/flashcards',
    icon: Layers,
    description: 'Memorize conceitos chave com nosso sistema de flashcards.',
    cta: 'Estudar Flashcards',
  },
  {
    title: 'Plano de Estudo IA',
    href: '/study-plan',
    icon: BrainCircuit,
    description: 'Receba um plano de estudo personalizado pela nossa IA.',
    cta: 'Gerar Plano',
  },
];

const stats = [
  {
    title: 'Tempo total de estudo',
    value: '127h 45m',
    icon: Timer,
  },
  {
    title: 'Estatísticas Gerais',
    value: '72% Acerto',
    icon: BarChart2,
    href: '/analytics',
  },
  {
    title: 'Strike de dias',
    value: '12 dias',
    icon: Flame,
    color: 'text-accent',
  },
  {
    title: 'Bônus',
    value: 'Disponível',
    icon: Gift,
  },
];

export default function Home() {
  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="text-3xl font-bold tracking-tight mb-4">Seja bem-vindo, Concurseiro!</h1>
        <p className="text-muted-foreground">O que você gostaria de fazer hoje?</p>
      </section>
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 text-muted-foreground ${stat.color || ''}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {stat.href ? (
                <Link href={stat.href} className="text-xs text-muted-foreground hover:underline">
                  Ver detalhes
                </Link>
              ) : (
                <p className="text-xs text-muted-foreground">Atualizado recentemente</p>
              )}
            </CardContent>
          </Card>
        ))}
      </section>
      <section>
        <h2 className="text-2xl font-bold tracking-tight mb-4">Principais Ferramentas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mainFeatures.map((feature, index) => {
            return (
              <Card key={feature.title} className="flex flex-col group hover:bg-card/90 transition-all">
                <CardHeader className="flex-row gap-4 items-start">
                    <div className="bg-primary/10 p-3 rounded-lg w-fit">
                        <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{feature.description}</p>
                    </div>
                </CardHeader>
                <CardContent className="flex-grow" />
                <div className="p-6 pt-0">
                    <Button asChild className="w-full md:w-auto">
                        <Link href={feature.href}>{feature.cta}</Link>
                    </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
