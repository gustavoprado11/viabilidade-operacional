import { LoginForm } from './login-form';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Siderúrgica Bandeirante
          </h1>
          <p className="text-sm text-muted-foreground">
            Sistema de Análise de Lâminas
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
