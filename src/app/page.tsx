import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LandingPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">Bem-vindo ao Concurso Sprint</CardTitle>
          <CardDescription className="text-center">
            Acesse sua plataforma de estudos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/mentorlite">
              Acessar Mentor Lite
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
