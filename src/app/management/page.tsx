'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UploadCloud } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ManagementPage() {
  const { toast } = useToast();

  const handleImport = () => {
    // Here you would typically handle the file upload and processing.
    // For this example, we'll just show a success message.
    toast({
      title: 'Importação Iniciada',
      description:
        'Seu arquivo foi enviado e as questões serão processadas em breve.',
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Gerenciamento</h1>
        <p className="text-muted-foreground">
          Gerencie as configurações e dados do aplicativo.
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Importar Questões</CardTitle>
          <CardDescription>
            Faça o upload de um arquivo (CSV, JSON) para adicionar novas
            questões ao banco de dados.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="question-file">Arquivo de Questões</Label>
            <div className="flex w-full max-w-lg items-center gap-4">
              <Input
                id="question-file"
                type="file"
                className="flex-1"
                accept=".csv, application/json"
              />
              <Button onClick={handleImport}>
                <UploadCloud />
                Importar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Formatos suportados: CSV e JSON.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}