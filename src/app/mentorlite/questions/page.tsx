'use client';

import { useState, useMemo, useEffect } from 'react';
import { useCollection, useFirebase, useMemoFirebase, useUser } from '@/firebase';
import { collection } from 'firebase/firestore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, ClipboardList } from 'lucide-react';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import { QuestionList } from '@/components/QuestionList';
import { ScrollArea } from '@/components/ui/scroll-area';

export type StatusFilter = 'all' | 'resolved' | 'unresolved';

export default function QuestionsPage() {
  const { firestore, user } = useFirebase();

  const [filterSubject, setFilterSubject] = useState('all');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [filterCargo, setFilterCargo] = useState('all');
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all');

  const [activeFilters, setActiveFilters] = useState<{
    subject: string | string[];
    topics: string[];
    cargo: string;
    status: StatusFilter;
  }>({
    subject: '',
    topics: [],
    cargo: '',
    status: 'all',
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

  useEffect(() => {
    setSelectedTopics([]);
    setFilterCargo('all');
  }, [filterSubject]);

  const handleFilterSubmit = () => {
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
      status: filterStatus
    });
  };

  const getTopicButtonLabel = () => {
    if (selectedTopics.length === 0) {
      return "Assuntos";
    }
    if (selectedTopics.length === 1) {
      return selectedTopics[0];
    }
    return `${selectedTopics.length} assuntos selecionados`;
  };


  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto pb-20">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Select value={filterSubject} onValueChange={setFilterSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Matéria" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="all">Todas as Matérias</SelectItem>
                  {isLoadingSubjects ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  ) : (
                    availableSubjects.map(s => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" disabled={filterSubject === 'all'} className="w-full justify-start font-normal truncate">
                    {getTopicButtonLabel()}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="start">
                  <DropdownMenuLabel>Assuntos Disponíveis</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <ScrollArea className="h-72">
                    {availableTopics.length > 0 ? availableTopics.map(topic => (
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
                    )) : <p className="p-2 text-xs text-muted-foreground">Selecione uma matéria primeiro.</p>}
                  </ScrollArea>
                </DropdownMenuContent>
              </DropdownMenu>

              <Select value={filterCargo} onValueChange={setFilterCargo} disabled={availableCargos.length === 0}>
                <SelectTrigger>
                  <SelectValue placeholder="Cargo" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="all">Todos os Cargos</SelectItem>
                  {availableCargos.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>


              <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as StatusFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="all">Todas as Questões</SelectItem>
                  <SelectItem value="resolved">Apenas Resolvidas</SelectItem>
                  <SelectItem value="unresolved">Apenas Não Resolvidas</SelectItem>
                </SelectContent>
              </Select>

            </div>
            <div className="mt-8 flex justify-end">
              <Button onClick={handleFilterSubmit} className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold shadow-lg shadow-accent/20">
                Buscar Questões
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {activeFilters.subject || activeFilters.cargo || activeFilters.status !== 'all' ? (
        <QuestionList
          subject={activeFilters.subject}
          topics={activeFilters.topics}
          cargo={activeFilters.cargo}
          statusFilter={activeFilters.status}
        />
      ) : (
        <Card className="flex items-center justify-center h-40 border-dashed">
          <p className="text-muted-foreground">
            Selecione os filtros acima para começar.
          </p>
        </Card>
      )}
    </div>
  );
}
