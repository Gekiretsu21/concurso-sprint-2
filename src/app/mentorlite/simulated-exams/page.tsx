'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const subjects = [
  { id: 'portugues', label: 'Português' },
  { id: 'constitucional', label: 'Direito Constitucional' },
  { id: 'administrativo', label: 'Direito Administrativo' },
  { id: 'penal', label: 'Direito Penal' },
  { id: 'informatica', label: 'Informática' },
  { id: 'raciocinio-logico', label: 'Raciocínio Lógico' },
];

export default function SimulatedExamsPage() {
  return (
    <div className="flex flex-col gap-8">
       <header>
        <h1 className="text-3xl font-bold tracking-tight">Simulados</h1>
        <p className="text-muted-foreground">Crie um simulado para testar seus conhecimentos em condições de prova.</p>
      </header>

      <div className="bg-black/60 border border-white/10 rounded-3xl shadow-lg shadow-black/30">
        <CardHeader className="p-6">
          <CardTitle className="text-xl">Configurar Novo Simulado</CardTitle>
          <CardDescription>Escolha as matérias, o número de questões e a dificuldade.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Número de Questões</Label>
              <Select defaultValue="50">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">20 questões</SelectItem>
                  <SelectItem value="50">50 questões</SelectItem>
                  <SelectItem value="100">100 questões</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Dificuldade</Label>
               <Select defaultValue="todas">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as dificuldades</SelectItem>
                  <SelectItem value="facil">Fácil</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="dificil">Difícil</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-3">
            <Label>Matérias</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 rounded-lg border border-white/20 p-4">
              {subjects.map((subject) => (
                <div key={subject.id} className="flex items-center space-x-2">
                  <Checkbox id={subject.id} />
                  <Label htmlFor={subject.id} className="font-normal cursor-pointer text-foreground/80 hover:text-foreground">{subject.label}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button size="lg">
              Gerar Simulado
            </Button>
          </div>
        </CardContent>
      </div>
    </div>
  )
}
