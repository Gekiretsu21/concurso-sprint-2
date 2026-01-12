'use client';

import { FeedPost } from '@/types';
import { FeedCard } from '@/components/FeedCard';

// Mock data to simulate feed posts
const mockFeed: FeedPost[] = [
  {
    id: '1',
    title: '📌 ATENÇÃO: Nova data para o Simulado Geral PPMG!',
    content: 'O simulado geral para a PPMG foi remarcado para o próximo domingo, dia 25/08, às 14h. Prepare-se e não perca a chance de testar seus conhecimentos em um ambiente que simula o dia da prova!',
    type: 'text',
    audience: 'all',
    isPinned: true,
    isActive: true,
    createdAt: { seconds: Math.floor(Date.now() / 1000) - 3600, nanoseconds: 0 }, // 1 hour ago
  },
  {
    id: '2',
    title: 'Análise Completa do Último Edital da Polícia Civil',
    content: 'Nosso mentor Willian Toledo fez uma análise em vídeo de todos os pontos do novo edital da PC-SP. Essencial para direcionar seus estudos.',
    type: 'youtube',
    url: 'https://www.youtube.com/watch?v=1XfBaufahtM',
    audience: 'all',
    isPinned: false,
    isActive: true,
    createdAt: { seconds: Math.floor(Date.now() / 1000) - 86400, nanoseconds: 0 }, // 1 day ago
  },
  {
    id: '3',
    title: 'Novos Flashcards de Direito Administrativo (VIP)',
    content: 'Assinantes MentorIA+ agora têm acesso a mais de 100 novos flashcards focados em Atos Administrativos e Licitações. Acesse o Arsenal VIP para conferir.',
    type: 'link',
    url: '/mentorlite/arsenal-vip',
    imageUrl: 'https://images.unsplash.com/photo-1556761175-577380e2595b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxzdHVkeSUyMGdyb3VwfGVufDB8fHx8MTc2NzM5NjMwMXww&ixlib=rb-4.1.0&q=80&w=1080',
    audience: 'plus',
    isPinned: false,
    isActive: true,
    createdAt: { seconds: Math.floor(Date.now() / 1000) - 172800, nanoseconds: 0 }, // 2 days ago
  },
   {
    id: '4',
    title: 'Dica Rápida: Mnemônico para Princípios da Administração',
    content: 'Lembre-se sempre do LIMPE: Legalidade, Impessoalidade, Moralidade, Publicidade e Eficiência. Simples, mas sempre cai em prova!',
    type: 'text',
    audience: 'all',
    isPinned: false,
    isActive: true,
    createdAt: { seconds: Math.floor(Date.now() / 1000) - 259200, nanoseconds: 0 }, // 3 days ago
  },
];


export default function FeedPage() {
  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Feed de Notícias</h1>
        <p className="text-muted-foreground">Fique por dentro das últimas novidades e avisos.</p>
      </header>
      <section className="space-y-6">
        {mockFeed && mockFeed.length > 0 ? (
          <div className="flex flex-col max-w-4xl mx-auto w-full">
            {mockFeed.map(post => <FeedCard key={post.id} post={post} />)}
          </div>
        ) : (
          <div className="col-span-full flex items-center justify-center p-8 border-dashed border rounded-lg min-h-[40vh]">
            <p className="text-muted-foreground">Nenhuma novidade por aqui ainda.</p>
          </div>
        )}
      </section>
    </div>
  );
}
