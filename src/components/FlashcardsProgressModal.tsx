"use client"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { BrainCircuit, Layers, Target } from "lucide-react"

interface FlashcardProgressItem {
    status: string
    lastResult: string
    subject?: string
}

interface FlashcardsProgressModalProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    progressData: FlashcardProgressItem[]
}

export function FlashcardsProgressModal({
    isOpen,
    onOpenChange,
    progressData,
}: FlashcardsProgressModalProps) {

    // Agrupar e calcular estatísticas por matéria
    const statsBySubject = progressData.reduce((acc, curr) => {
        const subject = curr.subject || "Sem Matéria Vinculada"
        if (!acc[subject]) {
            acc[subject] = { total: 0, correct: 0, incorrect: 0 }
        }

        acc[subject].total += 1
        if (curr.lastResult === "correct") {
            acc[subject].correct += 1
        } else {
            acc[subject].incorrect += 1
        }
        return acc
    }, {} as Record<string, { total: number, correct: number, incorrect: number }>)

    const sortedSubjects = Object.entries(statsBySubject).sort((a, b) => b[1].total - a[1].total)

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl bg-white sm:rounded-[2rem] p-0 overflow-hidden shadow-2xl border-0">
                <DialogHeader className="p-6 sm:p-8 bg-slate-950 text-white border-b border-slate-900 pb-10">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-purple-500/20 rounded-2xl">
                            <BrainCircuit className="h-8 w-8 text-purple-400 animate-pulse" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-black uppercase tracking-wider text-slate-100 mb-1">
                                Evolução na Retenção
                            </DialogTitle>
                            <DialogDescription className="text-slate-400 font-medium">
                                Seu progresso de memorização detalhado por matéria.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="px-6 sm:px-8 pb-8 -mt-6">
                    <ScrollArea className="h-[400px] w-full pr-4">
                        <div className="flex flex-col gap-4">
                            {sortedSubjects.length === 0 && (
                                <div className="text-center p-8 mt-10">
                                    <Layers className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                                    <p className="text-slate-500 font-medium">Você ainda não revisou nenhum flashcard.</p>
                                </div>
                            )}
                            {sortedSubjects.map(([subject, stats]) => {
                                const accuracy = Math.round((stats.correct / stats.total) * 100)

                                return (
                                    <div key={subject} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md hover:border-slate-300 group">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-bold text-slate-900 text-lg group-hover:text-purple-600 transition-colors uppercase tracking-tight">{subject}</h3>
                                            <div className="px-3 py-1 bg-slate-50 rounded-full border border-slate-100 flex items-center gap-2">
                                                <Target className="h-3 w-3 text-slate-400" />
                                                <span className="text-xs font-black text-slate-700">{accuracy}% precisão</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 mb-4">
                                            <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100/50">
                                                <div className="text-xl font-black text-slate-700">{stats.total}</div>
                                                <div className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mt-1">Revisados</div>
                                            </div>
                                            <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100/50">
                                                <div className="text-xl font-black text-emerald-600">{stats.correct}</div>
                                                <div className="text-[9px] uppercase tracking-widest text-emerald-500 font-bold mt-1">Acertos</div>
                                            </div>
                                            <div className="bg-rose-50 rounded-xl p-3 text-center border border-rose-100/50">
                                                <div className="text-xl font-black text-rose-600">{stats.incorrect}</div>
                                                <div className="text-[9px] uppercase tracking-widest text-rose-500 font-bold mt-1">Erros</div>
                                            </div>
                                        </div>

                                        {/* Barra de progresso de precisão */}
                                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500"
                                                style={{ width: `${accuracy}%` }}
                                            />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    )
}
