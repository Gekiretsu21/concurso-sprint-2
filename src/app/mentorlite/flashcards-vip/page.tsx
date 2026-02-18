
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, ChevronLeft, ChevronRight, Loader2, RefreshCw, ThumbsDown, ThumbsUp, X, Crown } from 'lucide-react';
import { useState, useMemo, useEffect, useCallback, Suspense } from 'react';
import '../flashcards/flashcard.css';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { useUser } from '@/firebase/auth/use-user';
import { collection, query, where, orderBy, getDocs, QueryConstraint, and, documentId } from 'firebase/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { handleFlashcardResponse } from '@/firebase/actions';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

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
    onResponse(card, result);
    if (currentIndex < flashcards.length -1) {
        setTimeout(() => handleNav('next'), 200);
    }
  }

  if (!flashcards || flashcards.length === 0) {
    return (
      <Card className="mt-6">
        <CardContent className="flex flex-col items-center justify-center h-40 p-6">
          <p className="text-muted-foreground">Nenhum flashcard VIP encontrado.</p>
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
              <Badge variant="outline" className="mb-4 bg-amber-500/10 text-amber-700 border-amber-500/20">
                <Crown className="mr-1 h-3 w-3" /> CONTEÚDO VIP
              </Badge>
              <p className="text-sm text-muted-foreground mb-2">{card.subject} &gt; {card.topic}</p>
              <p className="text-xl font-semibold">{card.front}</p>
            </CardContent>
          </Card>
          <Card className="flashcard-back bg-amber-600 text-white" onClick={handleFlip}>
            <CardContent className="flex flex-col items-center justify-center text-center p-6 gap-6">
              <p className="text-lg font-medium">{card.back}</p>
              <div className="flex gap-4 mt-4">
                <Button variant="destructive" size="lg" className="bg-red-700 hover:bg-red-800" onClick={(e) => { e.stopPropagation(); handleResponseClick('incorrect'); }}>
                    <ThumbsDown className="mr-2"/> Errei
                </Button>
                <Button variant="secondary" size="lg" className="bg-amber-100 text-amber-900 hover:bg-amber-200" onClick={(e) => { e.stopPropagation(); handleResponseClick('correct'); }}>
                    <ThumbsUp className="mr-2"/> Acertei
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
        <div className="text-sm font-medium">
          {currentIndex + 1} / {flashcards.length}
        </div>
        <Button variant="outline" size="icon" onClick={() => handleNav('next')} disabled={flashcards.length <= 1}>
          <ChevronRight />
        </Button>
      </div>
     </div>
  );
}

function FlashcardsVipContent() {
  const { firestore } = useFirebase();
  const { user } = useUser();
  const searchParams = useSearchParams();

  const [view, setView] = useState<'initial' | 'loading' | 'studying'>('initial');
  const [studyMode, setStudyMode] = useState<'all' | 'review'>('all');
  
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [filterTargetRole, setFilterTargetRole] = useState<string>('all');
  
  const [reviewSubject, setReviewSubject] = useState<string>('all');
  const [reviewStatus, setReviewStatus] = useState<'all' | 'correct' | 'incorrect'>('incorrect');
  
  const [activeFlashcards, setActiveFlashcards] = useState<Flashcard[]>([]);

  // STRICT SEPARATION: Only fetch VIP flashcards
  const vipFlashcardsQuery = useMemoFirebase(() => (
    firestore ? query(collection(firestore, 'flashcards'), where('accessTier', '==', 'plus'), orderBy('subject')) : null
  ), [firestore]);

  const { data: vipFlashcards, isLoading: isLoadingVip } = useCollection<Flashcard>(vipFlashcardsQuery);

  const allProgressQuery = useMemoFirebase(() =>
    (firestore && user)
      ? collection(firestore, `users/${user.uid}/flashcard_progress`)
      : null,
  [firestore, user]);

  const { data: allProgress, isLoading: isLoadingProgress } = useCollection<FlashcardProgress>(allProgressQuery);

  const vipFlashcardIds = useMemo(() => {
    if (!vipFlashcards) return new Set<string>();
    return new Set(vipFlashcards.map(fc => fc.id));
  }, [vipFlashcards]);

  const availableReviewSubjects = useMemo(() => {
    if (!allProgress || !vipFlashcardIds.size) return [];
    return Array.from(new Set(
        allProgress
            .filter(p => vipFlashcardIds.has(p.id))
            .map(p => p.subject)
    )).sort();
  }, [allProgress, vipFlashcardIds]);

  const filterOptions = useMemo(() => {
    if (!vipFlashcards) return { subjects: [], topics: [], targetRoles: [] };

    const subjects = new Set(vipFlashcards.map(fc => fc.subject));
    let filteredBySubject = vipFlashcards;

    if (filterSubject !== 'all') {
      filteredBySubject = vipFlashcards.filter(fc => fc.subject === filterSubject);
    }
    
    const topics = new Set(filteredBySubject.map(fc => fc.topic));
    const targetRoles = new Set(filteredBySubject.map(fc => fc.targetRole));

    return {
      subjects: Array.from(subjects).sort(),
      topics: Array.from(topics).sort(),
      targetRoles: Array.from(targetRoles).sort(),
    };
  }, [vipFlashcards, filterSubject]);

  useEffect(() => {
    setSelectedTopics([]);
    setFilterTargetRole('all');
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
        
        // Filter by VIP IDs to maintain strict separation
        const flashcardIdsToReview = responsesSnapshot.docs
            .map(doc => doc.id)
            .filter(id => vipFlashcardIds.has(id));

        if (flashcardIdsToReview.length === 0) {
            setActiveFlashcards([]);
            setView('studying');
            return;
        }
        
        const reviewCardsQuery = query(collection(firestore, 'flashcards'), where(documentId(), 'in', flashcardIdsToReview));
        const reviewCardsSnapshot = await getDocs(reviewCardsQuery);
        flashcardsToStudy = reviewCardsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Flashcard));

    } else {
        const constraints: QueryConstraint[] = [where('accessTier', '==', 'plus')];
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
        const finalQuery = query(baseQuery, and(...constraints));

        const snapshot = await getDocs(finalQuery);
        flashcardsToStudy = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Flashcard));
    }

    setActiveFlashcards(shuffleArray(flashcardsToStudy));
    setView('studying');

  }, [firestore, user, filterSubject, selectedTopics, filterTargetRole, vipFlashcardIds]);

  useEffect(() => {
    const subjectFromParams = searchParams.get('subject');
    if (subjectFromParams && view === 'initial') {
      setFilterSubject(subjectFromParams);
      setTimeout(() => startStudySession('all', { subject: subjectFromParams }), 0);
    }
  }, [searchParams, view, startStudySession]);


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

  if (isLoadingVip) {
    return (
       <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
       <header className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <Crown className="text-amber-500 h-8 w-8" /> Flashcards VIP
            </h1>
            <p className="text-muted-foreground">Estude conteúdo de alto nível exclusivo para assinantes MentorIA+.</p>
        </div>
        <Button variant="outline" asChild>
            <Link href="/mentorlite/arsenal-vip">Voltar ao Arsenal</Link>
        </Button>
      </header>

      {view !== 'studying' && (
        <div className="space-y-8">
            <Card className="border-amber-200 bg-amber-50/30">
                <CardHeader>
                <CardTitle>Treinamento Especializado</CardTitle>
                <CardDescription>Selecione a matéria e o cargo para focar nos cartões de elite.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Select value={filterSubject} onValueChange={setFilterSubject}>
                            <SelectTrigger>
                                <SelectValue placeholder="Matéria" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas as Matérias</SelectItem>
                                {filterOptions.subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" disabled={filterSubject === 'all' && filterOptions.topics.length === 0} className="w-full justify-start font-normal truncate">
                                    {getTopicButtonLabel()}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="start">
                                <DropdownMenuLabel>Assuntos VIP</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <ScrollArea className="h-72">
                                {filterOptions.topics.map(topic => (
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
                                </ScrollArea>
                            </DropdownMenuContent>
                        </DropdownMenu>

                            <Select value={filterTargetRole} onValueChange={setFilterTargetRole} disabled={filterSubject === 'all' && filterOptions.targetRoles.length === 0}>
                            <SelectTrigger>
                                <SelectValue placeholder="Cargo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os Cargos</SelectItem>
                                {filterOptions.targetRoles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                        <Button onClick={() => startStudySession('all')} disabled={view === 'loading'} className="bg-amber-600 hover:bg-amber-700 text-white">
                        {view === 'loading' && studyMode === 'all' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Crown className="mr-2 h-4 w-4" />}
                        Iniciar Estudo VIP
                    </Button>
                </CardContent>
            </Card>

            <Card className="border-amber-200">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <RefreshCw className="h-5 w-5 text-amber-600" /> Revisão VIP
                    </CardTitle>
                    <CardDescription>Reforce o conteúdo VIP que você já estudou, com foco nos seus erros.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    <Select value={reviewSubject} onValueChange={setReviewSubject} disabled={availableReviewSubjects.length === 0}>
                        <SelectTrigger className="w-full sm:w-[240px]">
                            <SelectValue placeholder="Matéria VIP" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas as Matérias VIP</SelectItem>
                            {availableReviewSubjects.map((s, index) => <SelectItem key={`${s}-${index}`} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={reviewStatus} onValueChange={(value) => setReviewStatus(value as 'all' | 'correct' | 'incorrect')}>
                        <SelectTrigger className="w-full sm:w-[240px]">
                            <SelectValue placeholder="Resultado" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os Meus VIPs</SelectItem>
                            <SelectItem value="correct">Acertei</SelectItem>
                            <SelectItem value="incorrect">Errei</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button onClick={() => startStudySession('review', { reviewSubject, reviewStatus })} disabled={view === 'loading' || isLoadingProgress} className="bg-amber-600 hover:bg-amber-700 text-white">
                        {(view === 'loading' && studyMode === 'review') || isLoadingProgress ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4"/>}
                        Revisar VIP
                    </Button>
                </CardContent>
            </Card>
        </div>
      )}

      {view === 'loading' && (
         <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
            <p className="ml-4 text-muted-foreground">Preparando arsenal VIP...</p>
        </div>
      )}

      {view === 'studying' && (
        <>
          <Button variant="ghost" onClick={() => setView('initial')} className="w-fit">
            <ChevronLeft className="mr-2 h-4 w-4"/>
            Mudar Filtros
          </Button>
          <FlashcardViewer flashcards={activeFlashcards} onResponse={handleFlashcardResponseCallback} />
        </>
      )}
    </div>
  );
}

export default function FlashcardsVipPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-amber-600" /></div>}>
      <FlashcardsVipContent />
    </Suspense>
  )
}
