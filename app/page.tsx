import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function Home() {
  return (
    <main className="container mx-auto max-w-3xl space-y-6 p-8">
      <Card>
        <CardHeader>
          <CardTitle>Sistema de Análise de Lâminas</CardTitle>
          <CardDescription>
            Siderúrgica Bandeirante — Fase 0 (sanity check)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="teste">Campo de teste</Label>
            <Input id="teste" placeholder="digite algo…" />
          </div>
          <div className="flex gap-2">
            <Button>Ação primária</Button>
            <Button variant="outline">Secundária</Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost">Abrir diálogo</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Diálogo de teste</DialogTitle>
                  <DialogDescription>
                    Se você está vendo este texto estilizado, o shadcn v3 está
                    funcionando.
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
