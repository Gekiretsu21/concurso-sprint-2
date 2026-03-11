'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useCollection, useFirebase, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, ClipboardList, Search, ChevronDown, Check, Zap, Copy } from 'lucide-react';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import { Input } from '@/components/ui/input';
import { QuestionList, type MethodFilter } from '@/components/QuestionList';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Crown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export type StatusFilter = 'all' | 'resolved' | 'unresolved';

export default function QuestionsPage() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const questionListRef = useRef<any>(null);

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<any>(userDocRef);
  const userPlan = userProfile?.subscription?.plan || 'standard';
  const isPremium = userPlan === 'plus' || userPlan === 'academy' || userPlan === 'mentoria_plus_plus';

  const [filterSubject, setFilterSubject] = useState('all');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [filterCargo, setFilterCargo] = useState('all');
  const [filterBanca, setFilterBanca] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all');
  const [isAcademyMode, setIsAcademyMode] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);

  const [activeFilters, setActiveFilters] = useState<{
    subject: string | string[];
    topics: string[];
    cargo: string;
    banca: string;
    year: string;
    status: StatusFilter;
    method: MethodFilter;
  }>({
    subject: '',
    topics: [],
    cargo: '',
    banca: '',
    year: '',
    status: 'all',
    method: 'all'
  });

  const subjectsQuery = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'questoes') : null),
    [firestore, user]
  );
  const { data: allQuestions, isLoading: isLoadingSubjects } =
    useCollection(subjectsQuery);

  const availableSubjects = useMemo(() => {
    if (!allQuestions) return [];
    const subjectSet = new Set<string>();
    allQuestions
      .filter(q => q.status !== 'hidden' && q.Materia && q.Materia.trim())
      .forEach(q => {
        let subjectName = q.Materia.trim();
        const subjectLower = subjectName.toLowerCase();
        if (subjectLower === 'lingua portuguesa') {
          subjectSet.add('Língua Portuguesa');
        } else if (subjectLower === 'legislacao juridica') {
          subjectSet.add('Legislação Jurídica');
        } else if (subjectLower === 'legislacao institucional') {
          subjectSet.add('Legislação Institucional');
        } else {
          subjectSet.add(subjectName);
        }
      });
    return Array.from(subjectSet).filter(Boolean).sort();
  }, [allQuestions]);

  const availableTopics = useMemo(() => {
    if (!allQuestions || filterSubject === 'all') return [];

    const isLinguaPortuguesa = filterSubject === 'Língua Portuguesa';
    const isLegislacaoJuridica = filterSubject === 'Legislação Jurídica';
    const isLegislacaoInstitucional = filterSubject === 'Legislação Institucional';

    const topics = new Set(
      allQuestions
        .filter(q => {
          if (!q.Materia || !q.Assunto) return false;
          const subjectLower = q.Materia.toLowerCase();
          let subjectMatch = false;

          if (isLinguaPortuguesa) {
            subjectMatch = subjectLower === 'língua portuguesa' || subjectLower === 'lingua portuguesa';
          } else if (isLegislacaoJuridica) {
            subjectMatch = subjectLower === 'legislação jurídica' || subjectLower === 'legislacao juridica';
          } else if (isLegislacaoInstitucional) {
            subjectMatch = subjectLower === 'legislação institucional' || subjectLower === 'legislacao institucional';
          } else {
            subjectMatch = q.Materia === filterSubject;
          }

          return subjectMatch;
        })
        .map(q => q.Assunto.trim())
        .filter(Boolean)
    );
    return Array.from(topics).sort();
  }, [allQuestions, filterSubject]);

  const availableCargos = useMemo(() => {
    if (!allQuestions) return [];
    const subjectFilteredQuestions = filterSubject !== 'all'
      ? allQuestions.filter(q => q.Materia === filterSubject)
      : allQuestions;

    const cargoSet = new Set<string>();
    subjectFilteredQuestions
      .filter(q => q.status !== 'hidden' && q.Cargo && q.Cargo.trim())
      .forEach(q => cargoSet.add(q.Cargo.trim()));

    return Array.from(cargoSet).filter(Boolean).sort();
  }, [allQuestions, filterSubject]);

  const availableBancas = useMemo(() => {
    if (!allQuestions) return [];
    const subjectFilteredQuestions = filterSubject !== 'all'
      ? allQuestions.filter(q => q.Materia === filterSubject)
      : allQuestions;

    const bancaSet = new Set<string>();
    subjectFilteredQuestions
      .filter(q => q.status !== 'hidden' && q.Banca && q.Banca.trim())
      .forEach(q => bancaSet.add(q.Banca.trim()));

    return Array.from(bancaSet).filter(Boolean).sort();
  }, [allQuestions, filterSubject]);

  const availableYears = useMemo(() => {
    if (!allQuestions) return [];
    const yearSet = new Set<string>();
    allQuestions
      .filter(q => q.status !== 'hidden' && q.Ano && q.Ano.trim())
      .forEach(q => yearSet.add(q.Ano.trim()));
    return Array.from(yearSet).filter(Boolean).sort((a, b) => b.localeCompare(a));
  }, [allQuestions]);

  const [searchTopic, setSearchTopic] = useState('');
  const [searchSubject, setSearchSubject] = useState('');
  const [searchCargo, setSearchCargo] = useState('');
  const [searchBanca, setSearchBanca] = useState('');
  const [searchYear, setSearchYear] = useState('');

  useEffect(() => {
    setSelectedTopics([]);
    setFilterCargo('all');
    setFilterBanca('all');
    setFilterYear('all');
    setSearchTopic('');
    setSearchCargo('');
    setSearchBanca('');
    setSearchYear('');
  }, [filterSubject]);

  const handleFilterSubmit = () => {
    setHasSearched(true);
    let subjectQuery: string | string[] = filterSubject;
    if (filterSubject === 'Língua Portuguesa') {
      subjectQuery = ['Língua Portuguesa', 'Lingua Portuguesa'];
    } else if (filterSubject === 'Legislação Jurídica') {
      subjectQuery = ['Legislação Jurídica', 'Legislacao Juridica'];
    } else if (filterSubject === 'Legislação Institucional') {
      subjectQuery = ['Legislação Institucional', 'Legislacao Institucional'];
    } else if (filterSubject === 'all') {
      subjectQuery = '';
    }

    setActiveFilters({
      subject: subjectQuery,
      topics: selectedTopics,
      cargo: filterCargo === 'all' ? '' : filterCargo,
      banca: filterBanca === 'all' ? '' : filterBanca,
      year: filterYear === 'all' ? '' : filterYear,
      status: filterStatus,
      method: isAcademyMode ? 'academy' : 'all'
    });
  };

  const handleAcademyToggle = () => {
    if (!isPremium && !isAcademyMode) {
      setIsUpgradeDialogOpen(true);
      return;
    }
    setIsAcademyMode(!isAcademyMode);
  };

  const handleWhatsAppRedirect = () => {
    const message = encodeURIComponent("Olá! Estou usando a plataforma MentorLite e tentei ativar o Método Academy no Banco de Questões. Gostaria de adquirir o acesso completo!");
    window.open(`https://api.whatsapp.com/send/?phone=5531984585846&text=${message}`, '_blank');
    setIsUpgradeDialogOpen(false);
  };

  const handleCopySuperStrike = () => {
    if (questionListRef.current) {
      const count = questionListRef.current.copyAnsweredQuestions();
      if (count > 0) {
        toast({
          title: 'Relatório Copiado! 🚀',
          description: `${count} questões foram formatadas para o seu Super Strike.`,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Nada para copiar',
          description: 'Você precisa responder pelo menos uma questão nesta página antes de copiar.',
        });
      }
    }
  };

  const getTopicButtonLabel = () => {
    if (selectedTopics.length === 0) return "Assuntos";
    if (selectedTopics.length === 1) return selectedTopics[0];
    return `${selectedTopics.length} selecionados`;
  };

  const filteredTopics = availableTopics.filter(t => t.toLowerCase().includes(searchTopic.toLowerCase()));
  const filteredSubjects = availableSubjects.filter(s => s.toLowerCase().includes(searchSubject.toLowerCase()));
  const filteredCargos = availableCargos.filter(c => c.toLowerCase().includes(searchCargo.toLowerCase()));
  const filteredBancas = availableBancas.filter(b => b.toLowerCase().includes(searchBanca.toLowerCase()));
  const filteredYears = availableYears.filter(y => y.toLowerCase().includes(searchYear.toLowerCase()));

  return (
    <div className={cn(
      "flex flex-col gap-8 max-w-5xl mx-auto pb-20 transition-all duration-1000 min-h-screen",
      isAcademyMode ? "bg-blue-50/10 rounded-[3rem]" : ""
    )}>
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent animate-pulse" />
          <span className="text-xs font-bold tracking-widest text-accent uppercase">Módulo de Prática</span>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-950">Banco de Questões</h1>
        <p className="text-lg text-slate-700 max-w-3xl leading-relaxed">
          Filtre as questões e teste seus conhecimentos com nosso acervo atualizado. A prática leva à perfeição.
        </p>
      </header>

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
          <CardHeader className="bg-slate-50/50 border-b pb-6 pt-6">
            <CardTitle className="text-2xl flex items-center gap-2 text-slate-900">
              <ClipboardList className="h-6 w-6 text-accent" /> Filtros de Questões
            </CardTitle>
            <CardDescription className="text-slate-600">
              Selecione seus critérios para começar a praticar.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between font-normal truncate">
                    <span className="truncate">{filterSubject === 'all' ? 'Matérias' : filterSubject}</span>
                    <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[300px]" align="start">
                  <DropdownMenuLabel>Matérias</DropdownMenuLabel>
                  <div className="p-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar matéria..."
                        className="pl-8 h-9 text-xs"
                        value={searchSubject}
                        onChange={(e) => setSearchSubject(e.target.value)}
                        onKeyDown={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <ScrollArea className="h-72">
                    <DropdownMenuItem onClick={() => setFilterSubject('all')} className="cursor-pointer">
                      <span className="flex-1">Todas as Matérias</span>
                      {filterSubject === 'all' && <Check className="h-4 w-4 text-accent" />}
                    </DropdownMenuItem>
                    {isLoadingSubjects ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : filteredSubjects.length > 0 ? (
                      filteredSubjects.map(s => (
                        <DropdownMenuItem key={s} onClick={() => setFilterSubject(s)} className="cursor-pointer">
                          <span className="flex-1 truncate">{s}</span>
                          {filterSubject === s && <Check className="h-4 w-4 text-accent shrink-0 ml-2" />}
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <p className="p-2 text-xs text-muted-foreground">Nenhuma matéria encontrada.</p>
                    )}
                  </ScrollArea>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" disabled={filterSubject === 'all'} className="w-full justify-between font-normal truncate">
                    <span className="truncate">{getTopicButtonLabel()}</span>
                    <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="start">
                  <DropdownMenuLabel>Assuntos</DropdownMenuLabel>
                  <div className="p-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar assunto..."
                        className="pl-8 h-9 text-xs"
                        value={searchTopic}
                        onChange={(e) => setSearchTopic(e.target.value)}
                        onKeyDown={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <ScrollArea className="h-72">
                    {filteredTopics.length > 0 ? filteredTopics.map(topic => (
                      <DropdownMenuCheckboxItem
                        key={topic}
                        checked={selectedTopics.includes(topic)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedTopics(prev => [...prev, topic]);
                          } else {
                            setSelectedTopics(prev => prev.filter(t => t !== topic));
                          }
                        }}
                        onSelect={(e) => e.preventDefault()}
                      >
                        {topic}
                      </DropdownMenuCheckboxItem>
                    )) : <p className="p-2 text-xs text-muted-foreground">{availableTopics.length === 0 ? "Selecione uma matéria primeiro." : "Nenhum assunto encontrado."}</p>}
                  </ScrollArea>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" disabled={availableCargos.length === 0} className="w-full justify-between font-normal truncate">
                    <span className="truncate">{filterCargo === 'all' ? 'Cargos' : filterCargo}</span>
                    <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[300px]" align="start">
                  <DropdownMenuLabel>Cargos</DropdownMenuLabel>
                  <div className="p-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar cargo..."
                        className="pl-8 h-9 text-xs"
                        value={searchCargo}
                        onChange={(e) => setSearchCargo(e.target.value)}
                        onKeyDown={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <ScrollArea className="h-72">
                    <DropdownMenuItem onClick={() => setFilterCargo('all')} className="cursor-pointer">
                      <span className="flex-1">Todos os Cargos</span>
                      {filterCargo === 'all' && <Check className="h-4 w-4 text-accent" />}
                    </DropdownMenuItem>
                    {filteredCargos.length > 0 ? (
                      filteredCargos.map(c => (
                        <DropdownMenuItem key={c} onClick={() => setFilterCargo(c)} className="cursor-pointer">
                          <span className="flex-1 truncate">{c}</span>
                          {filterCargo === c && <Check className="h-4 w-4 text-accent shrink-0 ml-2" />}
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <p className="p-2 text-xs text-muted-foreground">Nenhum cargo encontrado.</p>
                    )}
                  </ScrollArea>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" disabled={availableBancas.length === 0} className="w-full justify-between font-normal truncate">
                    <span className="truncate">{filterBanca === 'all' ? 'Bancas' : filterBanca}</span>
                    <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[250px]" align="start">
                  <DropdownMenuLabel>Bancas</DropdownMenuLabel>
                  <div className="p-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar banca..."
                        className="pl-8 h-9 text-xs"
                        value={searchBanca}
                        onChange={(e) => setSearchBanca(e.target.value)}
                        onKeyDown={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <ScrollArea className="h-72">
                    <DropdownMenuItem onClick={() => setFilterBanca('all')} className="cursor-pointer">
                      <span className="flex-1">Todas as Bancas</span>
                      {filterBanca === 'all' && <Check className="h-4 w-4 text-accent" />}
                    </DropdownMenuItem>
                    {filteredBancas.length > 0 ? (
                      filteredBancas.map(b => (
                        <DropdownMenuItem key={b} onClick={() => setFilterBanca(b)} className="cursor-pointer">
                          <span className="flex-1 truncate">{b}</span>
                          {filterBanca === b && <Check className="h-4 w-4 text-accent shrink-0 ml-2" />}
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <p className="p-2 text-xs text-muted-foreground">Nenhuma banca encontrada.</p>
                    )}
                  </ScrollArea>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" disabled={availableYears.length === 0} className="w-full justify-between font-normal truncate">
                    <span className="truncate">{filterYear === 'all' ? 'Ano' : filterYear}</span>
                    <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[150px]" align="start">
                  <DropdownMenuLabel>Ano</DropdownMenuLabel>
                  <div className="p-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar ano..."
                        className="pl-8 h-9 text-xs"
                        value={searchYear}
                        onChange={(e) => setSearchYear(e.target.value)}
                        onKeyDown={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <ScrollArea className="h-72">
                    <DropdownMenuItem onClick={() => setFilterYear('all')} className="cursor-pointer">
                      <span className="flex-1">Todos os Anos</span>
                      {filterYear === 'all' && <Check className="h-4 w-4 text-accent" />}
                    </DropdownMenuItem>
                    {filteredYears.length > 0 ? (
                      filteredYears.map(y => (
                        <DropdownMenuItem key={y} onClick={() => setFilterYear(y)} className="cursor-pointer">
                          <span className="flex-1 truncate">{y}</span>
                          {filterYear === y && <Check className="h-4 w-4 text-accent shrink-0 ml-2" />}
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <p className="p-2 text-xs text-muted-foreground">Nenhum ano encontrado.</p>
                    )}
                  </ScrollArea>
                </DropdownMenuContent>
              </DropdownMenu>

              <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as StatusFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="resolved">Resolvidas</SelectItem>
                  <SelectItem value="unresolved">Não Resolvidas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-6 border-t pt-8">
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                <button
                  onClick={handleAcademyToggle}
                  className={cn(
                    "w-full sm:min-w-[165px] transition-all duration-500 font-black tracking-tight uppercase text-[10px] h-10 rounded-lg flex items-center justify-center gap-2",
                    isAcademyMode
                      ? "bg-gradient-to-r from-blue-600 via-green-500 to-orange-500 bg-[length:200%_auto] animate-gradient-shift text-white shadow-lg shadow-blue-500/20"
                      : "bg-white border-2 border-slate-200 text-slate-600 hover:border-blue-500/50 hover:bg-blue-50/50"
                  )}
                >
                  {isAcademyMode ? (
                    <>
                      Método Academy
                      <Zap className="h-3 w-3 fill-current animate-bounce" />
                    </>
                  ) : "Método Academy"}
                </button>

                <Button 
                  variant="outline" 
                  onClick={handleCopySuperStrike}
                  disabled={!hasSearched}
                  className="w-full sm:w-auto h-10 px-6 border-2 border-slate-200 text-slate-600 hover:bg-slate-50 font-bold shadow-sm rounded-lg text-xs uppercase tracking-widest flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copia para Super Strike
                </Button>
              </div>

              <Button onClick={handleFilterSubmit} className="w-full sm:w-[165px] h-10 px-6 bg-slate-950 hover:bg-slate-900 text-white font-bold shadow-md rounded-lg text-xs uppercase tracking-widest">
                Buscar Questões
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {hasSearched ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {isAcademyMode && (
            <div className="flex items-center gap-3 px-4">
              <div className="h-1 flex-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-20" />
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] italic">Zona de Inteligência Tática</span>
              <div className="h-1 flex-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-20" />
            </div>
          )}
          <QuestionList
            ref={questionListRef}
            subject={activeFilters.subject}
            topics={activeFilters.topics}
            cargo={activeFilters.cargo}
            banca={activeFilters.banca}
            ano={activeFilters.year}
            statusFilter={activeFilters.status}
            methodFilter={activeFilters.method}
          />
        </div>
      ) : (
        <Card className="flex items-center justify-center h-40 border-dashed">
          <p className="text-muted-foreground">
            Selecione os filtros acima ou clique em "Buscar" para explorar o banco.
          </p>
        </Card>
      )}

      {/* Upgrade Dialog */}
      <Dialog open={isUpgradeDialogOpen} onOpenChange={setIsUpgradeDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              Método Academy
            </DialogTitle>
            <DialogDescription className="pt-2">
              A <strong>Visão Tática Academy</strong> é um recurso estratégico exclusivo para acelerar sua aprovação com inteligência de banca.
              <br /><br />
              Deseja solicitar o desbloqueio agora via WhatsApp?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsUpgradeDialogOpen(false)}>Agora não</Button>
            <Button className="bg-amber-500 hover:bg-amber-600 text-black font-bold" onClick={handleWhatsAppRedirect}>
              Solicitar Método Academy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}