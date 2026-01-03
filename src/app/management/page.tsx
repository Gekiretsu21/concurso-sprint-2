'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Paste } from 'lucide-react';

export default function ManagementPage() {
  const { toast } = useToast();

  const handleImport = () => {
    // Here you would typically handle the text processing.
    // For this example, we'll just show a success message.
    toast({
      title: 'Importação Iniciada',
      description:
        'Seu texto foi enviado e as questões serão processadas em breve.',
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
            Cole o texto (CSV, JSON) para adicionar novas questões ao banco de
            dados.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Paste />
                Importar por Texto
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
              <DialogHeader>
                <DialogTitle>Importar Questões por Texto</DialogTitle>
                <DialogDescription>
                  Cole o conteúdo do seu arquivo no campo abaixo. Certifique-se
                  de que o formato seja compatível (CSV ou JSON).
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="question-text" className="text-right pt-2">
                    Conteúdo
                  </Label>
                  <Textarea
                    id="question-text"
                    className="col-span-3 min-h-[250px]"
                    placeholder="Cole seu texto aqui..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={handleImport}>
                  Importar Questões
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
