
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/auth-context';
import { LogIn, UserPlus, Eye, EyeOff } from 'lucide-react';
import { ThemeToggleButton } from '@/components/theme-toggle-button';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';

export default function HomePage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, isAuthenticated, currentUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated && currentUser) {
        const defaultRedirect = currentUser.role === 'admin' ? '/admin' : `/dashboard/${currentUser.role}`;
        router.replace(defaultRedirect);
    }
  }, [isLoading, isAuthenticated, currentUser, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast({ title: "Campos obrigatórios", description: "Por favor, preencha o usuário e a senha.", variant: "destructive" });
      return;
    }
    
    setIsSubmitting(true);
    await login(username, password);
    setIsSubmitting(false);
  };
  
  if (isLoading || (!isLoading && isAuthenticated)) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <p className="text-foreground text-xl">Verificando sessão...</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8 min-h-screen flex flex-col items-center justify-center relative">
       <div className="absolute top-6 right-6 z-50">
        <ThemeToggleButton />
      </div>

      <Card className="w-full max-w-md shadow-xl bg-card/90 backdrop-blur-sm border-border/50">
        <CardHeader className="text-center">
          <Image src="/logo.png" alt="Logo Bolão Potiguar" width={80} height={80} className="mx-auto mb-4" />
          <CardTitle className="text-3xl font-bold text-primary">Bem-vindo!</CardTitle>
          <CardDescription className="text-muted-foreground">
            Acesse sua conta para continuar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Nome de Usuário</Label>
              <Input
                id="username"
                type="text"
                placeholder="Seu nome de usuário"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="bg-background/70 h-11"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
               <div className="relative">
                  <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Sua senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-background/70 h-11 pr-10"
                      disabled={isSubmitting}
                  />
                  <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isSubmitting}
                  >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </Button>
              </div>
            </div>
            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-lg h-12" disabled={isSubmitting || isLoading}>
              <LogIn className="mr-2 h-5 w-5" />
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-2 pt-6">
          <p className="text-sm text-muted-foreground">Não tem uma conta?</p>
          <Link href="/cadastrar" passHref>
            <Button variant="link" className="text-primary h-auto py-1 px-2">
              <UserPlus className="mr-2 h-4 w-4" /> Cadastre-se aqui
            </Button>
          </Link>
        </CardFooter>
      </Card>
        <p className="mt-8 text-xs text-center text-muted-foreground max-w-md">
          &copy; {new Date().getFullYear()} Bolão Potiguar. Todos os direitos reservados.
        </p>
    </div>
  );
}
