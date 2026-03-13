'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CrosswordData, Word, Direction, GridCell, CellStatus } from './types';
import { Card } from '@/components/ui/card';
import { 
  CheckCircle2, 
  ChevronRight, 
  ChevronDown, 
  RotateCcw, 
  Filter,
  Search,
  Trophy,
  AlertCircle,
  Edit2,
  Copy,
  Loader2,
  Gamepad2
} from 'lucide-react';
import { parseCrossword } from './utils';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { handleCrosswordCompletion } from '@/firebase/actions';
import { useUser } from '@/firebase/auth/use-user';
import { useToast } from '@/hooks/use-toast';
import { useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

 // Dados carregados dinamicamente via Firebase
export default function CrosswordPage() {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  
  const userDocRef = useMemoFirebase(
    () => (user && firestore) ? doc(firestore, 'users', user.uid) : null,
    [user, firestore]
  );
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<any>(userDocRef);

  useEffect(() => {
    if (!isUserLoading && !isProfileLoading && userProfile) {
      const plan = userProfile?.subscription?.plan;
      if (plan !== 'plus' && plan !== 'mentoria_plus_plus' && plan !== 'academy') {
        router.push('/mentorlite');
      }
    }
  }, [userProfile, isUserLoading, isProfileLoading, router]);

  const isAdmin = user?.email === 'amentoriaacademy@gmail.com';
  const [completedGames, setCompletedGames] = useState<Set<string>>(new Set());

  const q = useMemoFirebase(() => firestore ? query(collection(firestore, 'crosswords'), orderBy('createdAt', 'desc')) : null, [firestore]);
  const { data: allFases, isLoading } = useCollection<CrosswordData>(q);


  const [activeFase, setActiveFase] = useState<CrosswordData | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [direction, setDirection] = useState<Direction>('across');
  const [status, setStatus] = useState<Record<string, CellStatus>>({});
  const [isVerified, setIsVerified] = useState(false);

  // States para filtros
  const [selSubject, setSelSubject] = useState<string>('');
  const [selTopic, setSelTopic] = useState<string>('');
  const [selRole, setSelRole] = useState<string>('');

  const subjects = useMemo(() => Array.from(new Set(allFases?.map(f => f.subject))).filter(Boolean) as string[], [allFases]);
  const topics = useMemo(() => Array.from(new Set(allFases?.filter(f => !selSubject || f.subject === selSubject).map(f => f.topic))).filter(Boolean) as string[], [allFases, selSubject]);
  const roles = useMemo(() => Array.from(new Set(allFases?.filter(f => (!selSubject || f.subject === selSubject) && (!selTopic || f.topic === selTopic)).map(f => f.role))).filter(Boolean) as string[], [allFases, selSubject, selTopic]);
  
  const filteredGames = useMemo(() => allFases?.filter(f => 
    (!selSubject || f.subject === selSubject) && 
    (!selTopic || f.topic === selTopic) && 
    (!selRole || f.role === selRole)
  ) || [], [allFases, selSubject, selTopic, selRole]);

  useEffect(() => {
    if (filteredGames.length > 0) {
      if (!activeFase || !filteredGames.some(f => f.id === activeFase.id)) {
        setActiveFase(filteredGames[0]);
        setAnswers({});
        setStatus({});
        setIsVerified(false);
        setSelectedCell(null);
      }
    } else {
      if (activeFase) {
        setActiveFase(null);
      }
    }
  }, [filteredGames, activeFase]);

  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Memoize grid para performance e evitar bugs de renderização
  const grid = useMemo(() => {
    if (!activeFase) return [];
    const g: (GridCell | null)[][] = Array(activeFase.dimensions.rows)
      .fill(null)
      .map((_, r) => Array(activeFase.dimensions.cols).fill({ row: r, col: 0, isBlock: true }));

    for (let r = 0; r < activeFase.dimensions.rows; r++) {
      for (let c = 0; c < activeFase.dimensions.cols; c++) {
        g[r][c] = { row: r, col: c, isBlock: true };
      }
    }

    activeFase?.words?.forEach(word => {
      for (let i = 0; i < word.answer.length; i++) {
        const r = word.direction === 'across' ? word.row : word.row + i;
        const c = word.direction === 'across' ? word.col + i : word.col;
        
        if (g[r] && g[r][c]) {
          const current = g[r][c]!;
          g[r][c] = { 
            ...current, 
            isBlock: false,
            number: i === 0 ? word.number : current.number
          };
        }
      }
    });

    return g;
  }, [activeFase]);

  const getActiveWord = (): Word | undefined => {
    if (!selectedCell || !activeFase) return undefined;
    return activeFase.words.find(w => {
      if (w.direction !== direction) return false;
      const length = w.answer.length;
      if (w.direction === 'across') {
        return selectedCell.row === w.row && selectedCell.col >= w.col && selectedCell.col < w.col + length;
      } else {
        return selectedCell.col === w.col && selectedCell.row >= w.row && selectedCell.row < w.row + length;
      }
    });
  };

  const activeWord = getActiveWord();

  const isPartOfActiveWord = (r: number, c: number) => {
    if (!activeWord) return false;
    const length = activeWord.answer.length;
    if (activeWord.direction === 'across') {
      return r === activeWord.row && c >= activeWord.col && c < activeWord.col + length;
    } else {
      return c === activeWord.col && r >= activeWord.row && r < activeWord.row + length;
    }
  };

  const verifyAnswers = () => {
    if (!activeFase) return;
    const newStatus: Record<string, CellStatus> = {};
    let allCorrect = true;

    activeFase?.words?.forEach(word => {
      for (let i = 0; i < word.answer.length; i++) {
        const r = word.direction === 'across' ? word.row : word.row + i;
        const c = word.direction === 'across' ? word.col + i : word.col;
        const key = `${r}-${c}`;
        const userChar = (answers[key] || '').toUpperCase();
        const correctChar = word.answer[i].toUpperCase();

        if (userChar === correctChar) {
          newStatus[key] = 'correct';
        } else {
          newStatus[key] = 'incorrect';
          allCorrect = false;
        }
      }
    });

    setStatus(newStatus);
    setIsVerified(true);
    
    if (allCorrect) {
       if (user && firestore && activeFase && !completedGames.has(activeFase.id) && !isVerified) {
         handleCrosswordCompletion(firestore, user.uid, activeFase.id, activeFase.subject).then(() => {
           setCompletedGames(prev => new Set(prev).add(activeFase.id));
           toast({ title: 'Parabéns!', description: 'Cruzadinha concluída com sucesso. Progresso registrado no seu Perfil.' });
         }).catch(e => console.error(e));
       }
    }
  };

  const handleReset = () => {
    setAnswers({});
    setStatus({});
    setIsVerified(false);
    setSelectedCell(null);
  };

  const handleSolve = () => {
    if (!activeFase) return;
    const solved: Record<string, string> = {};
    activeFase?.words?.forEach(word => {
      for (let i = 0; i < word.answer.length; i++) {
        const r = word.direction === 'across' ? word.row : word.row + i;
        const c = word.direction === 'across' ? word.col + i : word.col;
        solved[`${r}-${c}`] = word.answer[i];
      }
    });
    setAnswers(solved);
  };

  useEffect(() => {
    if (selectedCell) {
      const key = `${selectedCell.row}-${selectedCell.col}`;
      inputRefs.current[key]?.focus();
    }
  }, [selectedCell]);

  const handleCellClick = (row: number, col: number, isBlock: boolean) => {
    if (isBlock || !activeFase) return;
    if (selectedCell?.row === row && selectedCell?.col === col) {
      setDirection(prev => prev === 'across' ? 'down' : 'across');
    } else {
      const hasAcross = activeFase.words.some(w => w.direction === 'across' && row === w.row && col >= w.col && col < w.col + w.answer.length);
      const hasDown = activeFase.words.some(w => w.direction === 'down' && col === w.col && row >= w.row && row < w.row + w.answer.length);
      if (hasAcross && !hasDown) setDirection('across');
      else if (hasDown && !hasAcross) setDirection('down');
      setSelectedCell({ row, col });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, row: number, col: number) => {
    if (e.key === 'Backspace') {
      const newAnswers = { ...answers };
      if (!answers[`${row}-${col}`]) {
        moveCursor(-1);
      } else {
        delete newAnswers[`${row}-${col}`];
        setAnswers(newAnswers);
        if (isVerified) setIsVerified(false); // Remove status de verificação ao mudar
      }
    } else if (e.key.length === 1 && /^[a-zA-Z]$/.test(e.key)) {
      e.preventDefault();
      const char = e.key.toUpperCase();
      setAnswers(prev => ({ ...prev, [`${row}-${col}`]: char }));
      if (isVerified) setIsVerified(false);
      moveCursor(1);
    } else if (e.key.startsWith('Arrow')) {
      const map: Record<string, Direction> = { ArrowRight: 'across', ArrowLeft: 'across', ArrowDown: 'down', ArrowUp: 'down' };
      const dir = map[e.key];
      if (dir) {
        setDirection(dir);
        moveCursor(e.key.includes('Right') || e.key.includes('Down') ? 1 : -1);
      }
    }
  };

  const moveCursor = (step: number) => {
    if (!selectedCell || !activeFase) return;
    let nextRow = selectedCell.row;
    let nextCol = selectedCell.col;
    if (direction === 'across') nextCol += step; else nextRow += step;

    if (nextRow >= 0 && nextRow < activeFase.dimensions.rows && nextCol >= 0 && nextCol < activeFase.dimensions.cols) {
      if (!grid[nextRow][nextCol]?.isBlock) setSelectedCell({ row: nextRow, col: nextCol });
    }
  };

  if (isUserLoading || isProfileLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* FILTROS SUPERIORES */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-5 gap-4 bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 backdrop-blur-xl shadow-xl">
           <div className="space-y-1">
             <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Matéria</label>
             <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select 
                  value={selSubject} 
                  onChange={e => { setSelSubject(e.target.value); setSelTopic(''); setSelRole(''); }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 ring-blue-500/50 transition-all appearance-none text-slate-300"
                >
                  <option value="">Todas</option>
                  {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
             </div>
           </div>
           
           <div className="space-y-1">
             <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Assunto</label>
             <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select 
                  value={selTopic} 
                  onChange={e => { setSelTopic(e.target.value); setSelRole(''); }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 ring-blue-500/50 transition-all appearance-none text-slate-300"
                >
                  <option value="">Todos</option>
                  {topics.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
             </div>
           </div>

           <div className="space-y-1">
             <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Cargo</label>
             <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select 
                  value={selRole} 
                  onChange={e => setSelRole(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 ring-blue-500/50 transition-all appearance-none text-slate-300"
                >
                  <option value="">Todos</option>
                  {roles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
             </div>
           </div>

           <div className="space-y-1">
             <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Selecionar Jogo</label>
             <div className="relative">
                <Gamepad2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select 
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 ring-blue-500/50 transition-all appearance-none text-slate-300"
                  value={activeFase?.id || ''}
                  onChange={(e) => {
                    const selected = filteredGames.find(f => f.id === e.target.value);
                    if (selected) {
                      setActiveFase(selected);
                      handleReset();
                    }
                  }}
                >
                  {filteredGames.length > 0 ? (
                    filteredGames.map(f => (
                      <option key={f.id} value={f.id}>{f.title}</option>
                    ))
                  ) : (
                    <option value="">Nenhum jogo na área</option>
                  )}
                </select>
             </div>
           </div>
           
           <div className="flex items-end pb-0.5">
              <button 
                onClick={handleReset}
                className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all border border-slate-600"
              >
                <RotateCcw className="w-4 h-4 text-emerald-400" /> Reiniciar
              </button>
           </div>
        </div>

        {isLoading ? (
          <div className="h-96 flex flex-col items-center justify-center gap-4 bg-slate-800/20 rounded-3xl border border-slate-700/30">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            <p className="text-slate-400 font-medium">Carregando desafios...</p>
          </div>
        ) : !activeFase ? (
          <div className="h-96 flex flex-col items-center justify-center gap-4 bg-slate-800/20 rounded-3xl border border-slate-700/30">
            <Gamepad2 className="w-16 h-16 text-slate-600" />
            <p className="text-slate-400 font-medium">Nenhum jogo disponível no momento.</p>
          </div>
        ) : (
          <div className="space-y-8">

        <header className="mb-8 flex flex-col md:row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
              {activeFase?.title}
            </h1>
            <p className="text-slate-400 flex items-center gap-2">
               Guia do Aluno / <span className="text-blue-400/80 font-medium">Cruzadinhas Acadêmicas</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
             {/* {isAdmin && (
               <button 
                  onClick={() => {
                    if (!activeFase) return;
                    const gameText = activeFase.words.map((w: any) => `${activeFase.subject} | ${activeFase.topic} | ${activeFase.role} | ${activeFase.title} | ${activeFase.dimensions.rows}x${activeFase.dimensions.cols} | ${w.direction === 'across' ? 'H' : 'V'} | ${w.row},${w.col} | ${w.answer} | ${w.clue}`).join('\n');
                    navigator.clipboard.writeText(gameText);
                    toast({ title: 'Copiado para edição!', description: 'Vá até o Gerenciamento e cole do texto para subir a versão corrigida.' });
                  }} 
                  title="Editar/Copiar Cruzadinha"
                  className="text-xs px-3 py-2 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg border border-slate-700 transition-all flex items-center gap-2"
               >
                  <Edit2 size={14} /> Editar
               </button>
             )} */}
             <button onClick={handleSolve} className="text-xs px-4 py-2 bg-amber-500/5 text-amber-500 hover:bg-amber-500/10 rounded-lg border border-amber-500/20 transition-all">
                Resolver Tudo
             </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* GRID */}
          <div className="lg:col-span-7 xl:col-span-8 flex justify-center">
            <div 
              className="grid gap-1 bg-slate-900/50 p-2.5 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden relative"
              style={{ 
                gridTemplateColumns: `repeat(${activeFase?.dimensions.cols || 10}, minmax(30px, 1fr))`,
                aspectRatio: '1/1',
                width: '100%',
                maxWidth: '550px'
              }}
            >
              {grid.map((row, rIdx) => 
                row.map((cell, cIdx) => {
                  if (!cell) return null;
                  const isSelected = selectedCell?.row === rIdx && selectedCell?.col === cIdx;
                  const isHighlighted = isPartOfActiveWord(rIdx, cIdx);
                  const val = answers[`${rIdx}-${cIdx}`] || '';
                  const cellStatus = status[`${rIdx}-${cIdx}`] || 'neutral';
                  
                  return (
                    <div
                      key={`${rIdx}-${cIdx}`}
                      onClick={() => handleCellClick(rIdx, cIdx, cell.isBlock)}
                      className={`
                        relative flex items-center justify-center text-xl font-black transition-all duration-150 cursor-pointer rounded-md
                        ${cell.isBlock ? 'bg-slate-950/60 transition-opacity' : 'bg-white text-slate-900'}
                        ${isSelected ? 'ring-2 ring-blue-500 z-20 bg-blue-100 scale-[1.03] shadow-lg' : ''}
                        ${isHighlighted && !isSelected ? 'bg-blue-50/90 ring-1 ring-blue-200/50' : ''}
                        
                        /* Feedback da Verificação */
                        ${isVerified && cellStatus === 'correct' ? 'shadow-[inset_0_0_0_3px_#10b981]' : ''}
                        ${isVerified && cellStatus === 'incorrect' ? 'shadow-[inset_0_0_0_3px_#ef4444]' : ''}
                      `}
                      style={{ height: '100%' }}
                    >
                      {!cell.isBlock && (
                        <>
                          {cell.number && (
                            <span className="absolute top-0.5 left-0.5 text-[8px] md:text-[9px] leading-none text-slate-400/80 font-bold select-none">
                              {cell.number}
                            </span>
                          )}
                          
                          {isSelected && (
                            <div className="absolute bottom-0.5 right-0.5 p-0.5 opacity-30 text-blue-900">
                               {direction === 'across' ? <ChevronRight size={10} /> : <ChevronDown size={10} />}
                            </div>
                          )}

                          <input
                            ref={el => { inputRefs.current[`${rIdx}-${cIdx}`] = el; }}
                            type="text"
                            maxLength={1}
                            value={val}
                            onChange={() => {}} 
                            onKeyDown={(e) => handleKeyDown(e, rIdx, cIdx)}
                            className="w-full h-full bg-transparent text-center outline-none uppercase cursor-pointer caret-transparent z-10"
                            autoComplete="off"
                          />
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* DICAS */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6">
            <Card className="bg-slate-800/40 border-slate-700/50 p-6 backdrop-blur-md shadow-2xl rounded-2xl overflow-hidden border-t-blue-500/20">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-3 border-b border-slate-700/50 pb-4">
                <Search className="text-blue-400 w-5 h-5" /> Pistas do Mentor
              </h2>
              
              <div className="space-y-8 max-h-[450px] overflow-y-auto pr-3 custom-scrollbar">
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4 flex items-center gap-2">
                     Horizontais
                  </h3>
                  <div className="space-y-3">
                    {activeFase?.words?.filter(w => w.direction === 'across').map((word, idx) => (
                      <div 
                        key={`${word.id}-${idx}`} 
                        className={`text-sm p-4 rounded-xl transition-all cursor-pointer border ${activeWord?.id === word.id ? 'bg-blue-500/10 border-blue-500/40 shadow-lg' : 'bg-slate-700/20 border-slate-700/50'}`}
                        onClick={() => { setSelectedCell({ row: word.row, col: word.col }); setDirection('across'); }}
                      >
                        <div className="flex gap-3">
                          <span className="font-black text-blue-400 min-w-[20px]">{word.number}.</span>
                          <span className={`${activeWord?.id === word.id ? 'text-white' : 'text-slate-300'}`}>{word.clue}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4 flex items-center gap-2">
                     Verticais
                  </h3>
                  <div className="space-y-3">
                    {activeFase?.words?.filter(w => w.direction === 'down').map((word, idx) => (
                      <div 
                        key={`${word.id}-${idx}`} 
                        className={`text-sm p-4 rounded-xl transition-all cursor-pointer border ${activeWord?.id === word.id ? 'bg-emerald-500/10 border-emerald-500/40 shadow-lg' : 'bg-slate-700/20 border-slate-700/50'}`}
                        onClick={() => { setSelectedCell({ row: word.row, col: word.col }); setDirection('down'); }}
                      >
                        <div className="flex gap-3">
                          <span className="font-black text-emerald-400 min-w-[20px]">{word.number}.</span>
                          <span className={`${activeWord?.id === word.id ? 'text-white' : 'text-slate-300'}`}>{word.clue}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {isVerified && (
                 <div className="mt-6 p-4 rounded-xl bg-blue-50 border border-blue-200 animate-in fade-in slide-in-from-top-2 shadow-sm">
                    <div className="flex items-center gap-3 text-sm font-semibold text-blue-900">
                       <AlertCircle className="text-blue-600 w-5 h-5 flex-shrink-0" />
                       <p>Verificação concluída! Confira os acertos (verde) e erros (vermelho) no tabuleiro.</p>
                    </div>
                 </div>
              )}
            </Card>

            <button 
              className="w-full py-4 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl font-black text-white shadow-2xl shadow-blue-500/20 hover:scale-[0.98] transition-all flex items-center justify-center gap-3 border-t border-white/10 group"
              onClick={verifyAnswers}
            >
              <CheckCircle2 className="w-6 h-6 group-hover:animate-bounce" /> Verificar Respostas
            </button>
            </div>
          </div>
        </div>
      )}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(30, 41, 59, 0.2); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
      `}</style>
    </div>
  </div>
);
}
