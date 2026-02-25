'use client';

import { ScrollGlobe } from '@/components/ui/scroll-globe';
import { useRouter } from 'next/navigation';

export default function StudentPage() {
  const router = useRouter();

  const sections = [
    {
      id: "welcome",
      badge: "Bússola do Aluno",
      title: "Página do Aluno",
      subtitle: "Seu Guia para a Aprovação",
      description: "Siga atentamente os passos abaixo para usufruir ao máximo da mentoria. A constância vence o talento, e aqui você encontra a estratégia certa.",
      align: "left" as const,
      actions: [
        { label: "Começar Agora", variant: "primary" as const, onClick: () => console.log("Start") },
        { label: "Suporte WhatsApp", variant: "secondary" as const, onClick: () => window.open('https://api.whatsapp.com/send/?phone=5531984585846', '_blank') },
      ]
    },
    {
      id: "steps",
      badge: "Primeiros Passos",
      title: "Roteiro de Onboarding",
      description: "O que você deve fazer agora para começar com o pé direito e garantir sua farda.",
      align: "center" as const,
      features: [
        { title: "1. Assista aos vídeos iniciais", description: "Veja a sequência de Mindset, Boas-vindas, Cronograma e MentorIA." },
        { title: "2. Verifique seu E-mail", description: "Aceite as instruções e tutoriais. Lá estão os links de acesso às ferramentas." },
        { title: "3. Explore a Plataforma", description: "Use Flashcards, Simulados, Questões e Provas Anteriores para complementar seus estudos." },
        { title: "4. SUPER STRIKE (SS)", description: "Assista o tutorial e gere o seu SS todos os dias logo após estudar." }
      ]
    },
    {
      id: "performance",
      badge: "Alta Performance",
      title: "Metas Semanais",
      subtitle: "Mantenha o Ritmo",
      description: "Nossa metodologia é focada em prática. Siga os indicadores mínimos para evolução constante.",
      align: "left" as const,
      features: [
        { title: "Mínimo de Questões", description: "Resolva ao menos 100 questões por semana analisando cada erro." },
        { title: "Flashcards Revisados", description: "Revise no mínimo 80 cartões por semana com repetição espaçada." },
        { title: "Manual da Aprovação", description: "O segredo não é apenas resolver, mas entender o porquê de cada acerto e erro." }
      ],
      actions: [
        { label: "Ir para Prática", variant: "primary" as const, onClick: () => router.push('/mentorlite/questions') }
      ]
    },
    {
      id: "resources",
      badge: "Arsenal Tático",
      title: "Links e Vídeos",
      subtitle: "Tudo em um só lugar",
      description: "Acesse rapidamente seus materiais de apoio e suporte direto com os mentores.",
      align: "center" as const,
      actions: [
        { label: "Arsenal - Drive de Materiais", variant: "primary" as const, onClick: () => window.open('https://drive.google.com/drive/folders/1nt9Tek397SZFw5mOo14Y6fzCVdhsicLX?usp=drive_link', '_blank') },
        { label: "Youtube - Mindset da Aprovação", variant: "secondary" as const, onClick: () => window.open('https://youtu.be/1XfBaufahtM', '_blank') }
      ]
    }
  ];

  return (
    <div className="-m-4 md:-m-6 lg:-m-8">
      <ScrollGlobe sections={sections} className="bg-background" />
    </div>
  );
}
