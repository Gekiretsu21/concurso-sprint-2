'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, ChevronLeft, ChevronRight, Loader2, RefreshCw, ThumbsDown, ThumbsUp, X, Sparkles, Layers, BookOpen, Search, ChevronDown } from 'lucide-react';
import { useState, useMemo, useEffect, useCallback, Suspense } from 'react';
import confetti from 'canvas-confetti';
import { Input } from '@/components/ui/input';
import './flashcard.css';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { useUser } from '@/firebase/auth/use-user';
import { collection, query, where, orderBy, getDocs, QueryConstraint, and, documentId } from 'firebase/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { handleFlashcardResponse } from '@/firebase/actions';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GlowingEffect } from '@/components/ui/glowing-effect';

interface Flashcard {
  id: string;
  front: string;
  back: string;
  subject: string;
  topic: string;
  targetRole: string;
  accessTier?: 'standard' | 'plus';
}

interface FlashcardProgress {
  id: string; // flashcardId
  status: 'learned' | 'reviewing';
  lastResult: 'correct' | 'incorrect';
  subject: string;
}

function FlashcardViewer({ flashcards, onResponse }: { flashcards: Flashcard[], onResponse: (flashcard: Flashcard, result: 'correct' | 'incorrect') => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [flashcards]);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNav = (direction: 'prev' | 'next') => {
    setIsFlipped(false);
    setTimeout(() => {
      if (direction === 'prev') {
        setCurrentIndex(prev => (prev - 1 + flashcards.length) % flashcards.length);
      } else {
        setCurrentIndex(prev => (prev + 1) % flashcards.length);
      }
    }, 150);
  };

  const handleResponseClick = (result: 'correct' | 'incorrect') => {
    const card = flashcards[currentIndex];
    if (!card) return;

    if (result === 'correct') {
      const duration = 2000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 20, spread: 360, ticks: 60, zIndex: 50 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function () {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 40 * (timeLeft / duration);
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: randomInRange(0.2, 0.4) },
          colors: ['#10b981', '#34d399', '#fce7f3', '#fcd34d']
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: randomInRange(0.2, 0.4) },
          colors: ['#10b981', '#34d399', '#fce7f3', '#fcd34d']
        });
      }, 250);
    }

    onResponse(card, result);
    if (currentIndex < flashcards.length - 1) {
      setTimeout(() => handleNav('next'), result === 'correct' ? 600 : 200);
    }
  };

  if (!flashcards || flashcards.length === 0) {
    return (
      <Card className="mt-6">
        <CardContent className="flex flex-col items-center justify-center h-40 p-6">
          <p className="text-muted-foreground">Nenhum flashcard encontrado.</p>
        </CardContent>
      </Card>
    );
  }

  const card = flashcards[currentIndex];

  if (!card) return null;

  return (
    <div className="flex flex-col gap-8 items-center mt-6">
      <div className="w-full max-w-2xl" style={{ perspective: '1000px' }}>
        <div className={`flashcard-inner ${isFlipped ? 'is-flipped' : ''}`}>
          <Card className="flashcard-front" onClick={handleFlip}>
            <CardContent className="flex flex-col items-center justify-center text-center p-6">
              <p className="text-sm text-muted-foreground mb-4">{card.subject} &gt; {card.topic}</p>
              <p className="text-xl font-semibold">{card.front}</p>
            </CardContent>
          </Card>
          <Card className="flashcard-back bg-primary text-primary-foreground" onClick={handleFlip}>
            <CardContent className="flex flex-col items-center justify-center text-center p-6 gap-6">
              <p className="text-lg">{card.back}</p>
              <div className="flex gap-4 mt-4">
                <Button variant="destructive" size="lg" onClick={(e) => { e.stopPropagation(); handleResponseClick('incorrect'); }}>
                  <ThumbsDown className="mr-2" /> Errei
                </Button>
                <Button variant="secondary" size="lg" onClick={(e) => { e.stopPropagation(); handleResponseClick('correct'); }}>
                  <ThumbsUp className="mr-2" /> Acertei
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex items-center justify-between w-full max-w-2xl">
        <Button variant="outline" size="icon" onClick={() => handleNav('prev')} disabled={flashcards.length <= 1}>
          <ChevronLeft />
        </Button>
        <div className="text-sm text-muted-foreground">
          {currentIndex + 1} / {flashcards.length}
        </div>
        <Button variant="outline" size="icon" onClick={() => handleNav('next')} disabled={flashcards.length <= 1}>
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}

function FlashcardsContent() {
  const { firestore } = useFirebase();
  const { user } = useUser();
  const searchParams = useSearchParams();

  const [view, setView] = useState<'initial' | 'loading' | 'studying'>('initial');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [filterTargetRole, setFilterTargetRole] = useState<string>('all');

  const [reviewSubject, setReviewSubject] = useState<string>('all');
  const [reviewStatus, setReviewStatus] = useState<'all' | 'correct' | 'incorrect'>('incorrect');

  const [studyMode, setStudyMode] = useState<'all' | 'review'>('all');
  const [activeFlashcards, setActiveFlashcards] = useState<Flashcard[]>([]);

  // FETCH ALL FLASHCARDS: Removed orderBy to ensure docs without 'subject' field are also returned
  const allFlashcardsQuery = useMemoFirebase(() => (
    firestore ? collection(firestore, 'flashcards') : null
  ), [firestore]);

  const { data: allFlashcardsRaw, isLoading: isLoadingAll } = useCollection<Flashcard>(allFlashcardsQuery);

  const allFlashcards = useMemo(() => {
    if (!allFlashcardsRaw) return null;
    // Sort client-side to be safe and include everyone
    return [...allFlashcardsRaw].sort((a, b) => (a.subject || '').localeCompare(b.subject || ''));
  }, [allFlashcardsRaw]);

  const allProgressQuery = useMemoFirebase(() =>
    (firestore && user)
      ? collection(firestore, `users/${user.uid}/flashcard_progress`)
      : null,
    [firestore, user]);

  const { data: allProgress, isLoading: isLoadingProgress } = useCollection<FlashcardProgress>(allProgressQuery);

  const availableReviewSubjects = useMemo(() => {
    if (!allProgress) return [];
    return Array.from(new Set(
      allProgress.map(p => p.subject).filter(Boolean)
    )).sort();
  }, [allProgress]);

  const filterOptions = useMemo(() => {
    if (!allFlashcards) return { subjects: [], topics: [], targetRoles: [] };

    const subjects = new Set(allFlashcards.map(fc => fc.subject).filter(Boolean));
    let filteredBySubject = allFlashcards;

    if (filterSubject !== 'all') {
      filteredBySubject = allFlashcards.filter(fc => fc.subject === filterSubject);
    }

    const topics = new Set(filteredBySubject.map(fc => fc.topic).filter(Boolean));
    const targetRoles = new Set(filteredBySubject.map(fc => fc.targetRole).filter(Boolean));

    return {
      subjects: Array.from(subjects).sort(),
      topics: Array.from(topics).sort(),
      targetRoles: Array.from(targetRoles).sort(),
    };
  }, [allFlashcards, filterSubject]);

  const [searchTopic, setSearchTopic] = useState('');
  const [searchSubject, setSearchSubject] = useState('');
  const [searchCargo, setSearchCargo] = useState('');

  useEffect(() => {
    setSelectedTopics([]);
    setFilterTargetRole('all');
    setSearchTopic('');
    setSearchCargo('');
  }, [filterSubject]);

  const startStudySession = useCallback(async (mode: 'all' | 'review', options: { subject?: string, topics?: string[], targetRole?: string, reviewSubject?: string, reviewStatus?: 'all' | 'correct' | 'incorrect' } = {}) => {
    if (!firestore || !user) return;

    setView('loading');
    setStudyMode(mode);

    const shuffleArray = <T,>(array: T[]): T[] => {
      const newArray = [...array];
      for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
      }
      return newArray;
    };

    let flashcardsToStudy: Flashcard[] = [];

    if (mode === 'review') {
      const progressConstraints: QueryConstraint[] = [];
      if (options.reviewSubject && options.reviewSubject !== 'all') {
        progressConstraints.push(where('subject', '==', options.reviewSubject));
      }
      if (options.reviewStatus && options.reviewStatus !== 'all') {
        progressConstraints.push(where('lastResult', '==', options.reviewStatus));
      }

      const responsesQuery = query(collection(firestore, `users/${user.uid}/flashcard_progress`), ...progressConstraints);
      const responsesSnapshot = await getDocs(responsesQuery);

      const flashcardIdsToReview = responsesSnapshot.docs.map(doc => doc.id);

      if (flashcardIdsToReview.length === 0) {
        setActiveFlashcards([]);
        setView('studying');
        return;
      }

      // Firestore 'in' queries are limited to 30 items
      const batches: string[][] = [];
      for (let i = 0; i < flashcardIdsToReview.length; i += 30) {
        batches.push(flashcardIdsToReview.slice(i, i + 30));
      }

      const allFetchedCards: Flashcard[] = [];
      for (const batch of batches) {
        const q = query(collection(firestore, 'flashcards'), where(documentId(), 'in', batch));
        const snap = await getDocs(q);
        allFetchedCards.push(...snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Flashcard)));
      }
      flashcardsToStudy = allFetchedCards;

    } else {
      const constraints: any[] = [];
      const subjectToFilter = options.subject || filterSubject;
      const topicsToFilter = options.topics || selectedTopics;
      const targetRoleToFilter = options.targetRole || filterTargetRole;

      if (subjectToFilter !== 'all') {
        constraints.push(where('subject', '==', subjectToFilter));
      }
      if (topicsToFilter && topicsToFilter.length > 0) {
        constraints.push(where('topic', 'in', topicsToFilter));
      }
      if (targetRoleToFilter !== 'all') {
        constraints.push(where('targetRole', '==', targetRoleToFilter));
      }

      const baseQuery = collection(firestore, 'flashcards');
      const finalQuery = constraints.length > 0 ? query(baseQuery, and(...constraints)) : baseQuery;

      const snapshot = await getDocs(finalQuery);
      flashcardsToStudy = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Flashcard));
    }

    setActiveFlashcards(shuffleArray(flashcardsToStudy));
    setView('studying');

  }, [firestore, user, filterSubject, selectedTopics, filterTargetRole]);


  const handleFlashcardResponseCallback = useCallback((flashcard: Flashcard, result: 'correct' | 'incorrect') => {
    if (!firestore || !user) return;
    handleFlashcardResponse(firestore, user.uid, flashcard, result);
    setActiveFlashcards(prev => prev.filter(fc => fc.id !== flashcard.id));
  }, [firestore, user]);

  const getTopicButtonLabel = () => {
    if (selectedTopics.length === 0) return "Todos os Assuntos";
    if (selectedTopics.length === 1) return selectedTopics[0];
    return `${selectedTopics.length} assuntos selecionados`;
  };

  const filteredTopics = filterOptions.topics.filter(t => t.toLowerCase().includes(searchTopic.toLowerCase()));
  const filteredSubjects = filterOptions.subjects.filter(s => s.toLowerCase().includes(searchSubject.toLowerCase()));
  const filteredCargos = filterOptions.targetRoles.filter(c => c.toLowerCase().includes(searchCargo.toLowerCase()));

  if (isLoadingAll) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!allFlashcards || allFlashcards.length === 0) {
    return (
      <div className="flex flex-col gap-8 items-center text-center max-w-5xl mx-auto pb-20">
        <header className="flex flex-col gap-2 items-center">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent animate-pulse" />
            <span className="text-xs font-bold tracking-widest text-accent uppercase">Módulo de Revisão</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-950">Flashcards</h1>
        </header>
        <Card className="flex flex-col items-center justify-center h-40 w-full max-w-2xl border-dashed">
          <CardContent className="text-center p-6">
            <p className="text-muted-foreground mb-4">
              Nenhum flashcard cadastrado no sistema ainda.
            </p>
            <p className="text-sm text-muted-foreground">Importe flashcards no painel de gerenciamento para começar.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto pb-20">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent animate-pulse" />
          <span className="text-xs font-bold tracking-widest text-accent uppercase">Módulo de Revisão</span>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-950">Flashcards</h1>
        <p className="text-lg text-slate-700 max-w-3xl leading-relaxed">
          Filtre seus flashcards ou comece uma sessão de estudo estruturada. A repetição espaçada é seu melhor aliado.
        </p>
      </header>

      {view !== 'studying' && (
        <div className="space-y-8">
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
                  <Layers className="h-6 w-6 text-accent" /> Estudo Focado
                </CardTitle>
                <CardDescription className="text-slate-600">Filtre por matéria, assunto e cargo para aprender novos flashcards.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between font-normal truncate">
                        <span className="truncate">{filterSubject === 'all' ? 'Todas as Matérias' : filterSubject}</span>
                        <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[300px]" align="start">
                      <DropdownMenuLabel>Matérias Disponíveis</DropdownMenuLabel>
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
                        {filteredSubjects.length > 0 ? (
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
                      <Button variant="outline" disabled={filterSubject === 'all' && filterOptions.topics.length === 0} className="w-full justify-between font-normal truncate">
                        <span className="truncate">{getTopicButtonLabel()}</span>
                        <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="start">
                      <DropdownMenuLabel>Assuntos Disponíveis</DropdownMenuLabel>
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
                        )) : <p className="p-2 text-xs text-muted-foreground">{filterOptions.topics.length === 0 ? "Selecione uma matéria primeiro." : "Nenhum assunto encontrado."}</p>}
                      </ScrollArea>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" disabled={filterSubject === 'all' && filterOptions.targetRoles.length === 0} className="w-full justify-between font-normal truncate">
                        <span className="truncate">{filterTargetRole === 'all' ? 'Todos os Cargos' : filterTargetRole}</span>
                        <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[300px]" align="start">
                      <DropdownMenuLabel>Cargos Disponíveis</DropdownMenuLabel>
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
                        <DropdownMenuItem onClick={() => setFilterTargetRole('all')} className="cursor-pointer">
                          <span className="flex-1">Todos os Cargos</span>
                          {filterTargetRole === 'all' && <Check className="h-4 w-4 text-accent" />}
                        </DropdownMenuItem>
                        {filteredCargos.length > 0 ? (
                          filteredCargos.map(r => (
                            <DropdownMenuItem key={r} onClick={() => setFilterTargetRole(r)} className="cursor-pointer">
                              <span className="flex-1 truncate">{r}</span>
                              {filterTargetRole === r && <Check className="h-4 w-4 text-accent shrink-0 ml-2" />}
                            </DropdownMenuItem>
                          ))
                        ) : (
                          <p className="p-2 text-xs text-muted-foreground">Nenhum cargo encontrado.</p>
                        )}
                      </ScrollArea>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="pt-2">
                  <Button onClick={() => startStudySession('all')} disabled={view === 'loading'} className="w-full md:w-auto bg-accent hover:bg-accent/90 text-accent-foreground font-bold shadow-lg shadow-accent/20">
                    {view === 'loading' && studyMode === 'all' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Iniciar Estudo
                  </Button>
                </div>
              </CardContent>
            </Card>
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
              <CardHeader className="bg-slate-50/50 border-b pb-6 pt-6">
                <CardTitle className="text-2xl flex items-center gap-2 text-slate-900">
                  <BookOpen className="h-6 w-6 text-accent" /> Revisão
                </CardTitle>
                <CardDescription className="text-slate-600">Revise os flashcards que você já estudou, filtrando por acertos ou erros.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row gap-4 items-start sm:items-center pt-6">
                <Select value={reviewSubject} onValueChange={setReviewSubject} disabled={availableReviewSubjects.length === 0}>
                  <SelectTrigger className="w-full sm:w-[240px]">
                    <SelectValue placeholder="Filtrar por matéria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Matérias</SelectItem>
                    {availableReviewSubjects.map((s, index) => <SelectItem key={`${s}-${index}`} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={reviewStatus} onValueChange={(value) => setReviewStatus(value as 'all' | 'correct' | 'incorrect')}>
                  <SelectTrigger className="w-full sm:w-[240px]">
                    <SelectValue placeholder="Filtrar por resultado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Meus Cartões</SelectItem>
                    <SelectItem value="correct">Acertei</SelectItem>
                    <SelectItem value="incorrect">Errei</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={() => startStudySession('review', { reviewSubject, reviewStatus })} disabled={view === 'loading' || isLoadingProgress} className="w-full sm:w-auto bg-primary hover:bg-primary/90 font-bold shadow-md text-white">
                  {(view === 'loading' && studyMode === 'review') || isLoadingProgress ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                  Revisar Cartões
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {view === 'loading' && (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="ml-4 text-muted-foreground">Carregando flashcards...</p>
        </div>
      )}

      {view === 'studying' && (
        <>
          <Button variant="outline" onClick={() => setView('initial')} className="w-fit">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Voltar para Seleção
          </Button>
          <FlashcardViewer flashcards={activeFlashcards} onResponse={handleFlashcardResponseCallback} />
        </>
      )}

    </div>
  );
}

export default function FlashcardsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="ml-4 text-muted-foreground">Carregando...</p>
    </div>}>
      <FlashcardsContent />
    </Suspense>
  )
}
