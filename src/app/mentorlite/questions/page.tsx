'use client';

import { useState, useMemo, useEffect } from 'react';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, where, or, and } from 'firebase/firestore';
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
import { Loader2 } from 'lucide-react';
import { QuestionList } from '@/components/QuestionList';

export type StatusFilter = 'all' | 'resolved' | 'unresolved';

export default function QuestionsPage() {
  const { firestore } = useFirebase();

  const [filterSubject, setFilterSubject] = useState('');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all');
  
  const [activeFilters, setActiveFilters] = useState<{
    subject: string | string[];
    topics: string[];
    status: StatusFilter;
  }>({
    subject: '',
    topics: [],
    status: 'all',
  });

  const subjectsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'questoes') : null),
    [firestore]
  );
  const { data: allQuestions, isLoading: isLoadingSubjects } =
    useCollection(subjectsQuery);

  const availableSubjects = useMemo(() => {
    if (!allQuestions) return [];
    const subjectSet = new Set<string>();
    allQuestions
        .filter(q => q.status !== 'hidden' && q.Materia && q.Materia.trim().toLowerCase() !== 'materia')
        .forEach(q => {
            let subjectName = q.Materia.trim();
            if (subjectName.toLowerCase() === 'língua portuguesa' || subjectName.toLowerCase() === 'lingua portuguesa') {
                subjectSet.add('Lingua Portuguesa');
            } else {
                subjectSet.add(subjectName);
            }
        });
    return Array.from(subjectSet).sort();
  }, [allQuestions]);

  const availableTopics = useMemo(() => {
    if (!allQuestions || !filterSubject) return [];
    
    const isLinguaPortuguesa = filterSubject === 'Lingua Portuguesa';
    
    const topics = new Set(
      allQuestions
        .filter(q => {
            const subjectMatch = isLinguaPortuguesa
              ? q.Materia.toLowerCase() === 'língua portuguesa' || q.Materia.toLowerCase() === 'lingua portuguesa'
              : q.Materia === filterSubject;
            return subjectMatch && q.Assunto;
        })
        .map(q => q.Assunto)
    );
    return Array.from(topics).sort();
  }, [allQuestions, filterSubject]);

  useEffect(() => {
    // When a new subject is selected, reset the topic filter
    setSelectedTopics([]);
  }, [filterSubject]);

  const handleFilterSubmit = () => {
    let subjectQuery: string | string[] = filterSubject;
    // If the selected subject is the standardized "Lingua Portuguesa", search for both variations.
    if (filterSubject === 'Lingua Portuguesa') {
        subjectQuery = ['Lingua Portuguesa', 'Língua Portuguesa'];
    }
    setActiveFilters({ subject: subjectQuery, topics: selectedTopics, status: filterStatus });
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
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Banco de Questões</h1>
        <p className="text-muted-foreground">
          Filtre as questões e teste seus conhecimentos.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Filtros de Questões</CardTitle>
          <CardDescription>
            Selecione seus critérios para começar a praticar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={filterSubject} onValueChange={setFilterSubject}>
              <SelectTrigger>
                <SelectValue placeholder="Matéria" />
              </SelectTrigger>
              <SelectContent position="popper">
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
                <Button variant="outline" disabled={!filterSubject} className="w-full justify-start font-normal">
                  {getTopicButtonLabel()}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="start">
                <DropdownMenuLabel>Assuntos Disponíveis</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {availableTopics.map(topic => (
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
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as StatusFilter)} disabled={!filterSubject}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="all">Todas as Questões</SelectItem>
                <SelectItem value="resolved">Apenas Resolvidas</SelectItem>
                <SelectItem value="unresolved">Apenas Não Resolvidas</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleFilterSubmit} disabled={!filterSubject}>
              Buscar Questões
            </Button>
          </div>
        </CardContent>
      </Card>

      {activeFilters.subject ? (
        <QuestionList
          subject={activeFilters.subject}
          topics={activeFilters.topics}
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
