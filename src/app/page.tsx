'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  BrainCircuit,
  Crown,
  Library,
  Lock,
  MessageCircle,
  Rocket,
  Scale,
  Shield,
  ShieldCheck,
  Sparkles,
  XCircle,
  Zap,
  Menu,
} from 'lucide-react';
import { AuthButton } from '@/components/AuthButton';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';
import { useFirebase } from '@/firebase/provider';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isUserLoading } = useUser();
  const { auth } = useFirebase();
  const { toast } = useToast();


  const handleGoogleLogin = async () => {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code !== 'auth/cancelled-popup-request' && error.code !== 'auth/popup-closed-by-user') {
        console.error('Error signing in with Google: ', error);
        toast({
          variant: 'destructive',
          title: 'Erro de Login',
          description: 'Não foi possível fazer login com o Google. Verifique se os pop-ups estão ativados e tente novamente.',
        });
      }
    }
  };

  const navLinks = [
    { name: 'A Realidade', href: '#realidade' },
    { name: 'Mindset', href: '#mindset' },
    { name: 'Diferencial', href: '#diferencial' },
    { name: 'O Método', href: '#metodo' },
    { name: 'Mentores', href: '#mentores' },
    { name: 'Arsenal', href: '#arsenal' },
  ];
  
  const renderMentorLiteButton = (isMobile = false) => {
    const commonClasses = "bg-transparent border-accent text-accent hover:bg-accent/10 animate-pulse-glow";
    const size = isMobile ? 'lg' : 'sm';
    
    if (isUserLoading) {
      return <Button variant="outline" size={size} className={commonClasses} disabled>Mentor Lite</Button>;
    }
    
    if (user) {
      return (
        <Button asChild variant="outline" size={size} className={commonClasses}>
          <Link href="/mentorlite">
            Mentor Lite
          </Link>
        </Button>
      );
    }
    
    return (
      <Button variant="outline" size={size} className={commonClasses} onClick={handleGoogleLogin}>
        Mentor Lite
      </Button>
    );
  };
  
  const handleProtectedLinkClick = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>, href: string) => {
    if (!user) {
      e.preventDefault();
      handleGoogleLogin();
    } else {
      window.location.href = href;
    }
  };


  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-body antialiased">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-black to-gray-900 text-primary-foreground">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 text-lg font-bold whitespace-nowrap"
              >
                MENTORIA <Zap className="w-5 h-5 text-accent" /> ACADEMY
              </Link>
              <Link href="https://www.instagram.com/amentoriaacademy" target="_blank" rel="noopener noreferrer" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="w-6 h-6"
                >
                  <defs>
                    <radialGradient
                      id="insta-gradient"
                      cx="0.3"
                      cy="1"
                      r="1"
                    >
                      <stop offset="0" stopColor="#F58529" />
                      <stop offset="0.1" stopColor="#FEDA77" />
                      <stop offset="0.3" stopColor="#DD2A7B" />
                      <stop offset="0.5" stopColor="#8134AF" />
                      <stop offset="1" stopColor="#515BD4" />
                    </radialGradient>
                  </defs>
                  <rect
                    width="20"
                    height="20"
                    x="2"
                    y="2"
                    rx="5"
                    ry="5"
                    fill="none"
                    stroke="url(#insta-gradient)"
                    strokeWidth="2"
                  ></rect>
                  <circle cx="12" cy="12" r="5" fill="none" stroke="url(#insta-gradient)" strokeWidth="2"></circle>
                  <line x1="16.5" y1="7.5" x2="16.5" y2="7.5" fill="none" stroke="url(#insta-gradient)" strokeWidth="3" strokeLinecap="round"></line>
                </svg>
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <nav className="hidden lg:flex items-center gap-4 text-xs font-medium">
                {navLinks.map(link => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className='text-primary-foreground/80 hover:text-primary-foreground transition-colors'
                  >
                    {link.name}
                  </Link>
                ))}
              </nav>
              
              <div className="hidden lg:flex items-center gap-2">
                 {renderMentorLiteButton()}
                <AuthButton />
              </div>

              {/* Mobile Menu */}
              <div className="lg:hidden flex items-center">
                <AuthButton />
                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="hover:bg-primary/90">
                      <Menu />
                      <span className="sr-only">Abrir menu</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right">
                    <SheetHeader>
                      <SheetTitle className="sr-only">Navegação Principal</SheetTitle>
                    </SheetHeader>
                    <nav className="flex flex-col gap-6 text-base font-medium mt-8">
                       <Link
                          href="/mentorlite"
                          onClick={(e) => {
                            handleProtectedLinkClick(e, '/mentorlite');
                            setIsMobileMenuOpen(false);
                          }}
                          className='font-bold text-accent'
                        >
                          Mentor Lite
                        </Link>
                      {navLinks.map(link => (
                        <Link
                          key={link.name}
                          href={link.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className='text-muted-foreground'
                        >
                          {link.name}
                        </Link>
                      ))}
                    </nav>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Image Banner Section */}
      <section className="py-2">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative w-full max-w-[85%] mx-auto h-auto">
            <Image
              src="/LOGO/logotipo site.png"
              alt="Banner da Mentoria Academy"
              width={1920}
              height={640}
              className="w-full h-auto object-cover"
              priority
            />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section id="realidade" className="py-4">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <Card className="bg-[#E0F2FE] border-none p-4 transform -rotate-3 shadow-sm">
                <p className="text-gray-800">
                  "Eu estudo muito, mas parece que a matéria não entra na minha
                  cabeça"
                </p>
              </Card>
              <Card className="bg-[#E0E7FF] border-none p-4 transform rotate-2 ml-8 shadow-sm">
                <p className="text-gray-800">
                  "Já fiz o método tradicional e na hora da prova não consigo
                  acertar"
                </p>
              </Card>
              <Card className="bg-[#F5F5F4] border-none p-4 transform -rotate-1 shadow-sm">
                <p className="text-gray-800">
                  "Perdi as esperanças de passar em concurso"
                </p>
              </Card>
              <Card className="bg-[#E2E8F0] border-none p-4 transform rotate-1 ml-4 shadow-sm">
                <p className="text-gray-800">
                  "As vezes acho que todos conseguem, menos eu"
                </p>
              </Card>
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
                Se você se sente assim,
              </h1>
              <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-primary">
                VOCÊ PRECISA DE ESTRATÉGIA
              </h2>
              <p className="mt-6 text-lg text-muted-foreground">
                Não é falta de esforço, é falta de método. Os modelos antigos
                não funcionam para as provas atuais. Nós construímos a solução
                definitiva para você conquistar sua farda em 2026.
              </p>
              <Button
                asChild
                size="lg"
                className="mt-8 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Link href="#cta">Garantir Vaga</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Mindset Video Section */}
        <section id="mindset" className="py-20 sm:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Mindset da MentorIA Academy
            </h2>
            <div className="mt-8 max-w-4xl mx-auto">
              <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden shadow-2xl">
                <iframe
                  src="https://www.youtube.com/embed/1XfBaufahtM"
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                ></iframe>
              </div>
            </div>
          </div>
        </section>

        {/* Diferenciais Section */}
        <section id="diferencial" className="py-20 sm:py-32 bg-secondary/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Por que a MentorIA Academy é diferente?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Não somos um "Netflix de aulas". Somos um laboratório de aprovação
              focado em dados e prática.
            </p>
            <div className="mt-12 grid md:grid-cols-2 gap-8 text-left">
              <Card className="bg-card border-destructive/50 p-6 shadow-md">
                <header>
                  <h3 className="flex items-center gap-2 text-xl font-bold text-destructive">
                    <XCircle /> O Jeito Tradicional (Ultrapassado)
                  </h3>
                </header>
                <div className="pt-4 space-y-3 text-muted-foreground">
                  <p>
                    • Estudo passivo: horas lendo ou assistindo sem praticar.
                  </p>
                  <p>• Conteúdo genérico que não foca na sua banca.</p>
                  <p>• PDFs gigantescos impossíveis de revisar.</p>
                  <p>• Solidão: você estuda sem saber se está evoluindo.</p>
                </div>
              </Card>
              <Card className="bg-card border-primary p-6 shadow-md">
                <header>
                  <h3 className="flex items-center gap-2 text-xl font-bold text-primary">
                    <Zap /> O Jeito MentorIA (2026)
                  </h3>
                </header>
                <div className="pt-4 space-y-3 text-foreground">
                  <p>
                    • Aprendizado Ativo: Você aprende executando, com atividades
                    práticas constantes.
                  </p>
                  <p>
                    • Inteligência de Banca: Deciframos exatamente como eles
                    cobram.
                  </p>
                  <p>
                    • Estratégia + IA: Tecnologia para identificar e fortalecer
                    seus pontos fracos.
                  </p>
                  <p>
                    • Alta Performance: Foco em tirar +80 pontos e garantir a
                    vaga.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Pilares Section */}
        <section id="metodo" className="py-20 sm:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Os Pilares da Aprovação
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Nossa metodologia foi desenhada para quem não tem tempo a perder.
            </p>
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="bg-card p-8 text-center shadow-lg">
                <Scale className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-bold">Aprendizado estratégico</h3>
                <p className="mt-2 text-muted-foreground">
                  Estudo para concursos com estratégias eficientes.
                </p>
              </Card>
              <Card className="bg-card p-8 text-center shadow-lg">
                <Rocket className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-bold">Aceleração de Resultados</h3>
                <p className="mt-2 text-muted-foreground">
                  Método comprovado para 'zerar o processo' de estudos e
                  maximizar sua retenção de conteúdo.
                </p>
              </Card>
              <Card className="bg-card p-8 text-center shadow-lg">
                <ShieldCheck className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-bold">Foco na Aprovação</h3>
                <p className="mt-2 text-muted-foreground">
                  Estratégias de quem já foi aprovado em mais de 7 concursos
                  públicos militares e civis.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Mentores Section */}
        <section id="mentores" className="py-20 sm:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <Card className="flex items-center gap-6 p-6 bg-card shadow-sm">
                  <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Scale className="h-12 w-12 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Prof. Willian Toledo</h3>
                    <p className="text-primary font-semibold">
                      Aprovado na PMMG com 18 anos, CTSP (2X), CFO e OAB.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Bacharel em Direito, Bacharel em Ciências Militares e Pós-Graduado em Direito Público.
                    </p>
                  </div>
                </Card>
                <Card className="flex items-center gap-6 p-6 bg-card shadow-sm">
                  <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <BrainCircuit className="h-12 w-12 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Prof. Álvaro Torres</h3>
                    <p className="text-primary font-semibold">
                     Aprovado PMMG, PMGO, CBMMG, CBMERJ, CBMGO, GCM, ANALI. SIST, CAM. MUN.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Bacharel em Sistemas de Informação. Pós-Graduado em Inteligência e Segurança.
                    </p>
                  </div>
                </Card>
              </div>
              <div className="text-center md:text-right">
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                  A combinação perfeita entre{' '}
                  <span className="text-accent">Conhecimento</span> e{' '}
                  <span className="text-accent">Estratégia</span>.
                </h2>
              </div>
            </div>
          </div>
        </section>

        {/* Arsenal Section */}
        <section id="arsenal" className="py-20 sm:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold flex items-center justify-center gap-3">
              <Library /> Arsenal de Estudos
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Materiais táticos para sua preparação. Alguns são de acesso livre,
              outros são desafios exclusivos.
            </p>
            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-primary/10 p-6 flex flex-col text-left shadow-sm">
                <div className="flex-grow">
                  <Badge className="flex-shrink-0 mb-3 bg-green-500/20 text-green-700 hover:bg-green-500/30 border-none">
                    <Sparkles className="w-3 h-3 mr-1" /> Mentor Lite
                  </Badge>
                  <h3 className="font-bold">Acesso à Plataforma de IA</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Use nossas ferramentas de IA para praticar com questões, flashcards e mais.
                  </p>
                </div>
                <a
                    href="/mentorlite"
                    onClick={(e) => handleProtectedLinkClick(e, '/mentorlite')}
                    className="text-sm font-semibold text-primary mt-4 flex items-center gap-1 group"
                    >
                    Acessar Agora{' '}
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </a>
              </Card>
              
               <Card className="bg-primary/10 p-6 flex flex-col text-left shadow-sm">
                <div className="flex-grow">
                  <Badge className="flex-shrink-0 mb-3 bg-red-500/20 text-red-700 hover:bg-red-500/30 border-none">
                    <Shield className="w-3 h-3 mr-1" /> DESAFIO
                  </Badge>
                  <h3 className="font-bold">Simulados da Comunidade</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    A prática leva à aprovação. Teste seu conhecimento com simulados reais e vença a concorrência.
                  </p>
                </div>
                <a
                    href="/mentorlite/community-simulados"
                    onClick={(e) => handleProtectedLinkClick(e, '/mentorlite/community-simulados')}
                    className="text-sm font-semibold text-primary mt-4 flex items-center gap-1 group"
                    >
                    Encarar o Desafio{' '}
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </a>
              </Card>

              <Card className="bg-accent text-accent-foreground p-6 flex flex-col text-left shadow-sm">
                <div className="flex-grow">
                  <Badge variant="outline" className="flex-shrink-0 mb-3">
                    <Crown className="w-3 h-3 mr-1" /> VIP
                  </Badge>
                  <h3 className="font-bold">Correção de Redação</h3>
                  <p className="text-sm text-accent-foreground/80 mt-1">
                    Somente para quem quer tirar 90+ na redação. Correção
                    individual detalhada.
                  </p>
                </div>
                <Link
                  href="https://api.whatsapp.com/send/?phone=5531984585846&text=Quero%20saber%20mais%20sobre%20a%20corre%C3%A7%C3%A3o%20de%20Reda%C3%A7%C3%A3o"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-background mt-4 flex items-center gap-1 group"
                >
                  Adquirir correção{' '}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Card>
              <Card className="bg-[#E2E8F0] p-6 flex flex-col text-left col-span-1 md:col-span-2 lg:col-span-1 border-none shadow-sm">
                <div className="flex-grow">
                  <Badge className="flex-shrink-0 mb-3 bg-blue-500/20 text-blue-700 hover:bg-blue-500/30 border-none">
                    DRIVE
                  </Badge>
                  <h3 className="font-bold text-gray-800">
                    Drive com guia de redação e muito mais...
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Do zero à aprovação. Estruturas prontas...
                  </p>
                </div>
                <Link
                  href="https://drive.google.com/drive/folders/1nt9Tek397SZFw5mOo14Y6fzCVdhsicLX?usp=drive_link"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-primary mt-4 flex items-center gap-1 group"
                >
                  Acessar Drive{' '}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section id="cta" className="py-20 sm:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-primary rounded-2xl p-8 sm:p-12 text-center shadow-2xl shadow-primary/20">
              <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground">
                Pronto para a Aprovação?
              </h2>
              <p className="mt-4 text-lg text-primary-foreground/80 max-w-2xl mx-auto">
                Não queira resultados diferentes se você continua fazendo as
                mesmas coisas. Clique abaixo e transforme a maneira que você
                estuda para concursos.
              </p>
              <Button
                size="lg"
                className="mt-8 bg-background hover:bg-background/90 text-primary font-bold text-lg"
                asChild
              >
                <Link
                  href="https://api.whatsapp.com/send/?phone=5531984585846&text=Quero%20ser%20aprovado%20em%20Concurso%20P%C3%BAblico"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="mr-2" /> QUERO SER APROVADO
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Mobile FAB for Mentor Lite */}
       <button 
        onClick={() => {
          handleProtectedLinkClick({} as React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>, '/mentorlite');
        }}
        className="lg:hidden fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg z-50 bg-accent text-accent-foreground animate-pulse-glow inline-flex items-center justify-center">
        <Sparkles />
        <span className="sr-only">Mentor Lite</span>
      </button>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-muted-foreground text-sm">
          <div className="flex justify-center gap-4 mb-4">
            <Link href="#" className="hover:text-foreground">
              Termos
            </Link>
            <Link href="#" className="hover:text-foreground">
              Privacidade
            </Link>
            <Link href="#" className="hover:text-foreground">
              Instagram
            </Link>
          </div>
          <p>© {new Date().getFullYear()} MentorIA Academy. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
