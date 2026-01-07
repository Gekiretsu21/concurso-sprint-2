'use client';

import { useState, useMemo } from 'react';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { QuestionList } from '@/components/QuestionList';

const ALL_SUBJECTS = 'all-subjects';
const ALL_TOPICS = 'all-topics';

export default function QuestionsPage() {
  const { firestore } = useFirebase();

  const [filterSubject, setFilterSubject] = useState(ALL_SUBJECTS);
  const [filterTopic, setFilterTopic] = useState(ALL_TOPICS);
  const [activeFilters, setActiveFilters] = useState<{ subject: string; topic: string }>({
    subject: ALL_SUBJECTS,
    topic: ALL_TOPICS,
  });

  const subjectsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'questoes') : null),
    [firestore]
  );
  const { data: allQuestions } = useCollection(subjectsQuery);

  const availableSubjects = useMemo(() => {
    if (!allQuestions) return [];
    const subjects = new Set(allQuestions.map(q => q.Materia));
    return Array.from(subjects);
  }, [allQuestions]);

  const availableTopics = useMemo(() => {
    if (!allQuestions || filterSubject === ALL_SUBJECTS) return [];
    const topics = new Set(
      allQuestions
        .filter(q => q.Materia === filterSubject)
        .map(q => q.Assunto)
    );
    return Array.from(topics);
  }, [allQuestions, filterSubject]);

  const handleFilterSubmit = () => {
    setActiveFilters({ subject: filterSubject, topic: filterTopic });
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={filterSubject} onValueChange={setFilterSubject}>
              <SelectTrigger>
                <SelectValue placeholder="Matéria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_SUBJECTS}>Todas as Matérias</SelectItem>
                {availableSubjects.map(s => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filterTopic}
              onValueChange={setFilterTopic}
              disabled={filterSubject === ALL_SUBJECTS}
            >
              <SelectTrigger>
                <SelectValue placeholder="Assunto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_TOPICS}>Todos os Assuntos</SelectItem>
                {availableTopics.map(t => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={handleFilterSubmit}>
              Buscar Questões
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <QuestionList 
        subject={activeFilters.subject === ALL_SUBJECTS ? undefined : activeFilters.subject}
        topic={activeFilters.topic === ALL_TOPICS ? undefined : active-filters.topic}
      />
    </div>
  );
}
