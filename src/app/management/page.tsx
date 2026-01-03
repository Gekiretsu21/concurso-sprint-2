import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ManagementPage() {
  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Gerenciamento</h1>
        <p className="text-muted-foreground">Gerencie as configurações do aplicativo.</p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Configurações</CardTitle>
          <CardDescription>Opções de gerenciamento do aplicativo.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Em breve...</p>
        </CardContent>
      </Card>
    </div>
  )
}
