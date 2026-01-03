import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Award, BookOpen, CheckCircle, Crown, FileText, FolderKanban, GraduationCap, Laptop, Lightbulb, Lock, Mic, Rocket, Scale, ShieldCheck, Sparkles, Star, Zap, XCircle, MessageSquare, Quote, BrainCircuit, Bot, Library, MessageCircle } from 'lucide-react';

export default function LandingPage() {
  const navLinks = [
    { name: 'A Realidade', href: '#realidade' },
    { name: 'Diferencial', href: '#diferencial' },
    { name: 'O Método', href: '#metodo' },
    { name: 'Mentores', href: '#mentores' },
    { name: 'Arsenal', href: '#arsenal' },
    { name: 'Mentor Lite', href: '/mentorlite', special: true },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-body antialiased">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-center py-2 text-sm font-semibold flex items-center justify-center gap-2">
        <Rocket className="w-4 h-4" />
        <span>Vagas da Segunda Turma liberadas</span>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold">
              MENTORIA <Zap className="w-5 h-5 text-primary" /> ACADEMY
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
              {navLinks.map(link => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={
                    link.special
                      ? 'font-bold text-accent hover:text-accent/90 transition-colors'
                      : 'text-muted-foreground hover:text-foreground transition-colors'
                  }
                >
                  {link.name}
                </Link>
              ))}
            </nav>
            <Button asChild>
              <Link href="#cta">Garantir Vaga</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section id="realidade" className="py-20 sm:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <Card className="bg-secondary/50 border-border p-4 transform -rotate-3">
                <p>"Eu estudo muito, mas parece que a matéria não entra na minha cabeça"</p>
              </Card>
              <Card className="bg-secondary/50 border-border p-4 transform rotate-2 ml-8">
                <p>"Já fiz o método tradicional e na hora da prova não consigo acertar"</p>
              </Card>
              <Card className="bg-secondary/50 border-border p-4 transform -rotate-1">
                <p>"Perdi as esperanças de passar em concurso"</p>
              </Card>
              <Card className="bg-secondary/50 border-border p-4 transform rotate-1 ml-4">
                <p>"As vezes acho que todos conseguem, menos eu"</p>
              </Card>
            </div>
            <div className="text-center md:text-left">
              <Quote className="w-16 h-16 text-accent mx-auto md:mx-0" />
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mt-4">Se você se sente assim,</h1>
              <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-accent">VOCÊ PRECISA DE ESTRATÉGIA</h2>
              <p className="mt-6 text-lg text-muted-foreground">
                Não é falta de esforço, é falta de método. Os modelos antigos não funcionam para as provas atuais. Nós construímos a solução definitiva para você conquistar sua farda em 2026.
              </p>
            </div>
          </div>
        </section>

        {/* Diferenciais Section */}
        <section id="diferencial" className="py-20 sm:py-32 bg-secondary/20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold">Por que a MentorIA Academy é diferente?</h2>
            <p className="mt-4 text-lg text-muted-foreground">Não somos um "Netflix de aulas". Somos um laboratório de aprovação focado em dados e prática.</p>
            <div className="mt-12 grid md:grid-cols-2 gap-8 text-left">
              <Card className="bg-background/50 border-destructive/50 p-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl text-destructive"><XCircle /> O Jeito Tradicional (Ultrapassado)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-muted-foreground">
                  <p>• Estudo passivo: horas lendo ou assistindo sem praticar.</p>
                  <p>• Conteúdo genérico que não foca na sua banca.</p>
                  <p>• PDFs gigantescos impossíveis de revisar.</p>
                  <p>• Solidão: você estuda sem saber se está evoluindo.</p>
                </CardContent>
              </Card>
              <Card className="bg-background/50 border-primary p-6">
                 <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl text-primary"><Zap /> O Jeito MentorIA (2026)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p>• Aprendizado Ativo: Você aprende executando, com atividades práticas constantes.</p>
                  <p>• Inteligência de Banca: Deciframos exatamente como eles cobram.</p>
                  <p>• Estratégia + IA: Tecnologia para identificar e fortalecer seus pontos fracos.</p>
                  <p>• Alta Performance: Foco em tirar +80 pontos e garantir a vaga.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        
        {/* Pilares Section */}
        <section id="metodo" className="py-20 sm:py-32">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h2 className="text-3xl sm:text-4xl font-bold">Os Pilares da Aprovação</h2>
                <p className="mt-4 text-lg text-muted-foreground">Nossa metodologia foi desenhada para quem não tem tempo a perder.</p>
                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <Card className="bg-secondary/30 border-border p-8 text-center">
                        <Scale className="w-12 h-12 text-primary mx-auto mb-4"/>
                        <h3 className="text-xl font-bold">Inteligência Jurídica</h3>
                        <p className="mt-2 text-muted-foreground">Aprenda o Direito com quem vive a prática. Constitucional e Administrativo direto ao ponto da prova.</p>
                    </Card>
                    <Card className="bg-secondary/30 border-border p-8 text-center">
                        <Rocket className="w-12 h-12 text-primary mx-auto mb-4"/>
                        <h3 className="text-xl font-bold">Aceleração de Resultados</h3>
                        <p className="mt-2 text-muted-foreground">Método comprovado para 'zerar o processo' de estudos e maximizar sua retenção de conteúdo.</p>
                    </Card>
                     <Card className="bg-secondary/30 border-border p-8 text-center">
                        <ShieldCheck className="w-12 h-12 text-primary mx-auto mb-4"/>
                        <h3 className="text-xl font-bold">Foco na Aprovação</h3>
                        <p className="mt-2 text-muted-foreground">Estratégias de quem já foi aprovado em mais de 7 concursos públicos militares e civis.</p>
                    </Card>
                </div>
            </div>
        </section>

        {/* IA Section */}
        <section id="mentor-ia" className="py-20 sm:py-32 bg-gradient-to-b from-secondary/20 to-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-block bg-primary/10 text-primary font-semibold px-3 py-1 rounded-full text-sm mb-4">
              ✨ POWERED BY GEMINI
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold">O Mentor da Aprovação ✨</h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">Teste nosso Mentor IA. Escolha um comando abaixo para descobrir o melhor caminho:</p>
            <div className="mt-8 max-w-3xl mx-auto">
              <Card className="p-6 bg-background/70">
                <div className="flex flex-wrap gap-2 justify-center">
                  {["Qual o método mais rápido para ser aprovado?", "Vale a pena estudar por videoaulas longas?", "Como conciliar trabalho e estudo?", "Qual a melhor estratégia para carreiras policiais?"].map(tag => (
                    <Button key={tag} variant="secondary" size="sm">{tag}</Button>
                  ))}
                </div>
                <div className="mt-6 flex gap-2">
                  <input type="text" placeholder="Ou digite sua dúvida aqui..." className="flex-grow bg-input text-foreground rounded-md px-4"/>
                  <Button>Consultar</Button>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Mentores Section */}
        <section id="mentores" className="py-20 sm:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <Card className="flex items-center gap-6 p-6 bg-secondary/30">
                  <img src="https://picsum.photos/seed/mentor1/100/100" alt="Prof. Willian Toledo" className="w-24 h-24 rounded-full object-cover" />
                  <div>
                    <h3 className="text-xl font-bold">Prof. Willian Toledo</h3>
                    <p className="text-primary font-semibold">1º Tenente da PMMG</p>
                    <p className="text-sm text-muted-foreground mt-2">Bacharel em Direito Público.<br />Pós-graduado em Ciências Militares.</p>
                  </div>
                </Card>
                <Card className="flex items-center gap-6 p-6 bg-secondary/30">
                  <img src="https://picsum.photos/seed/mentor2/100/100" alt="Prof. Álvaro Torres" className="w-24 h-24 rounded-full object-cover" />
                  <div>
                    <h3 className="text-xl font-bold">Prof. Álvaro Torres</h3>
                    <p className="text-primary font-semibold">Aprovado PM, CBM, GCM, ANALI. SIST.</p>
                    <p className="text-sm text-muted-foreground mt-2">Bacharel em Sistemas de Informação.<br />Pós-Graduado em Inteligência e Segurança.</p>
                  </div>
                </Card>
              </div>
              <div className="text-center md:text-right">
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">A combinação perfeita entre <span className="text-accent">Conhecimento Jurídico</span> e <span className="text-accent">Estratégia de Prova</span>.</h2>
              </div>
            </div>
          </div>
        </section>
        
        {/* Cronograma Section */}
        <section className="py-20 sm:py-32 bg-secondary/20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h2 className="text-3xl sm:text-4xl font-bold">Cronograma da Mentoria</h2>
                <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {["Planejamento Estratégico", "Resolução de Questões", "Alta Performance", "Legislação Extravagante", "Técnicas de Resolução", "Simulados Comentados", "Redação Nota Máxima", "Reta Final & Revisão"].map((step, index) => (
                         <Card key={step} className="p-4 bg-background/50 text-center">
                            <div className="text-primary font-bold text-lg">0{index + 1}</div>
                            <h3 className="font-semibold mt-1">{step}</h3>
                         </Card>
                    ))}
                </div>
            </div>
        </section>

        {/* Arsenal Section */}
        <section id="arsenal" className="py-20 sm:py-32">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h2 className="text-3xl sm:text-4xl font-bold flex items-center justify-center gap-3">
                    <Library /> Arsenal de Estudos
                </h2>
                <p className="mt-4 text-lg text-muted-foreground">Materiais táticos para sua preparação. Alguns são de acesso livre, outros são desafios exclusivos.</p>
                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card className="bg-secondary/30 p-6 flex flex-col text-left">
                        <div className="flex-grow">
                          <Badge variant="destructive" className="flex-shrink-0 mb-3"><Lock className="w-3 h-3 mr-1" /> BLOQUEADO</Badge>
                          <h3 className="font-bold">Simulado 02 - PPMG</h3>
                          <p className="text-sm text-muted-foreground mt-1">Acesso Restrito: Para acessar, você precisa da Palavra-Chave.</p>
                        </div>
                        <Link href="#" className="text-sm font-semibold text-primary mt-4 flex items-center gap-1 group">Desbloquear Simulado <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" /></Link>
                    </Card>
                     <Card className="bg-secondary/30 p-6 flex flex-col text-left opacity-50">
                        <div className="flex-grow">
                          <Badge variant="outline" className="flex-shrink-0 mb-3"><XCircle className="w-3 h-3 mr-1" /> EXPIRADO</Badge>
                          <h3 className="font-bold">Simulado 01 - PPMG</h3>
                          <p className="text-sm text-muted-foreground mt-1">Prazo Encerrado</p>
                        </div>
                    </Card>
                     <Card className="bg-secondary/30 p-6 flex flex-col text-left">
                        <div className="flex-grow">
                          <Badge className="flex-shrink-0 mb-3 bg-green-500/20 text-green-300 hover:bg-green-500/30"><Sparkles className="w-3 h-3 mr-1" /> EXTRA</Badge>
                          <h3 className="font-bold">2026 é meu ano da APROVAÇÃO!</h3>
                        </div>
                        <Link href="/mentorlite" className="text-sm font-semibold text-primary mt-4 flex items-center gap-1 group">Acessar Agora <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" /></Link>
                    </Card>
                     <Card className="bg-secondary/30 p-6 flex flex-col text-left">
                        <div className="flex-grow">
                          <Badge className="flex-shrink-0 mb-3 bg-accent/20 text-accent hover:bg-accent/30"><Crown className="w-3 h-3 mr-1" /> VIP</Badge>
                          <h3 className="font-bold">Correção de Redação</h3>
                           <p className="text-sm text-muted-foreground mt-1">Somente para quem quer tirar 90+ na redação. Correção individual detalhada.</p>
                        </div>
                        <Link href="#" className="text-sm font-semibold text-primary mt-4 flex items-center gap-1 group">Adquirir correção <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" /></Link>
                    </Card>
                    <Card className="bg-secondary/30 p-6 flex flex-col text-left col-span-1 md:col-span-2 lg:col-span-1">
                        <div className="flex-grow">
                          <Badge className="flex-shrink-0 mb-3 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30">DRIVE</Badge>
                          <h3 className="font-bold">Drive com guia de redação e muito mais...</h3>
                           <p className="text-sm text-muted-foreground mt-1">Do zero à aprovação. Estruturas prontas...</p>
                        </div>
                    </Card>
                </div>
            </div>
        </section>

        {/* CTA Section */}
        <section id="cta" className="py-20 sm:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-r from-primary to-purple-800 rounded-2xl p-8 sm:p-12 text-center shadow-2xl shadow-primary/20">
              <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground">Pronto para a Aprovação?</h2>
              <p className="mt-4 text-lg text-primary-foreground/80 max-w-2xl mx-auto">
                Não queira resultados diferentes se você continua fazendo as mesmas coisas. Clique abaixo e transforme a maneira que você estuda para concursos.
              </p>
              <Button size="lg" className="mt-8 bg-green-500 hover:bg-green-600 text-foreground font-bold text-lg" asChild>
                <Link href="#">
                  <MessageCircle className="mr-2" /> QUERO SER APROVADO
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-muted-foreground text-sm">
          <div className="flex justify-center gap-4 mb-4">
            <Link href="#" className="hover:text-foreground">Termos</Link>
            <Link href="#" className="hover:text-foreground">Privacidade</Link>
            <Link href="#" className="hover:text-foreground">Instagram</Link>
          </div>
          <p>© {new Date().getFullYear()} MentorIA Academy. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
