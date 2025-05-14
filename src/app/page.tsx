
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Users, ShoppingCart, ShieldCheck, ArrowRight, Settings, LogIn, UserPlus, LogOut } from 'lucide-react';
import { ThemeToggleButton } from '@/components/theme-toggle-button';
import { useAuth } from '@/context/auth-context'; // Import useAuth
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const [isClient, setIsClient] = useState(false);
  const { currentUser, logout, isLoading } = useAuth(); // Get currentUser and logout
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleCompradorClick = () => {
    if (currentUser && currentUser.role === 'comprador') {
      router.push('/comprador');
    } else {
      router.push('/login');
    }
  };

  const handleVendedorClick = () => {
     if (currentUser && currentUser.role === 'vendedor') {
      router.push('/vendedor');
    } else {
      router.push('/login');
    }
  };


  if (!isClient || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <p className="text-foreground text-xl">Carregando Bolão Potiguar...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen flex flex-col items-center justify-center relative">
      <div className="fixed top-6 right-6 z-50 flex space-x-2">
        {currentUser && (
          <Button variant="outline" onClick={logout} className="shadow-md">
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </Button>
        )}
        <ThemeToggleButton />
      </div>
      <header className="mb-12 text-center">
        <div className="inline-block p-3 rounded-full bg-primary shadow-lg mb-4">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="hsl(var(--primary-foreground))" xmlns="http://www.w3.org/2000/svg" data-ai-hint="lottery ball">
            <circle cx="12" cy="12" r="10" stroke="hsl(var(--primary-foreground))" strokeWidth="1.5"/>
            <text x="12" y="16" fontSize="10" textAnchor="middle" fill="hsl(var(--primary-foreground))" fontWeight="bold">BP</text>
          </svg>
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold text-primary tracking-tight">
          Bolão Potiguar
        </h1>
        {currentUser ? (
           <p className="text-xl text-muted-foreground mt-3">Bem-vindo(a) de volta, {currentUser.username}!</p>
        ) : (
           <p className="text-xl text-muted-foreground mt-3">Bem-vindo! Escolha seu perfil ou cadastre-se.</p>
        )}
      </header>

      <main className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Comprador Card */}
        <Card className="text-center h-full flex flex-col justify-between shadow-xl hover:shadow-2xl bg-card/90 backdrop-blur-sm border-primary/50 transform hover:scale-105 transition-transform duration-300">
          <CardHeader>
            <Users className="mx-auto h-16 w-16 text-primary mb-4" />
            <CardTitle className="text-2xl font-bold text-primary">Comprador</CardTitle>
            <CardDescription className="text-muted-foreground">
              {currentUser && currentUser.role === 'comprador' ? "Acessar meus bilhetes" : "Compre seus bilhetes e tente a sorte!"}
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto pb-6">
            <Button onClick={handleCompradorClick} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              <ArrowRight className="mr-2 h-4 w-4" /> {currentUser && currentUser.role === 'comprador' ? "Meu Painel" : "Entrar / Ver Bilhetes"}
            </Button>
          </CardContent>
        </Card>

        {/* Vendedor Card */}
         <Card className="text-center h-full flex flex-col justify-between shadow-xl hover:shadow-2xl bg-card/90 backdrop-blur-sm border-secondary/50 transform hover:scale-105 transition-transform duration-300">
          <CardHeader>
            <ShoppingCart className="mx-auto h-16 w-16 text-secondary mb-4" />
            <CardTitle className="text-2xl font-bold text-secondary">Vendedor</CardTitle>
            <CardDescription className="text-muted-foreground">
              {currentUser && currentUser.role === 'vendedor' ? "Gerenciar minhas vendas" : "Gerencie suas vendas e acompanhe."}
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto pb-6">
             <Button onClick={handleVendedorClick} variant="secondary" className="w-full">
                <ArrowRight className="mr-2 h-4 w-4" /> {currentUser && currentUser.role === 'vendedor' ? "Meu Painel" : "Entrar / Gerenciar Vendas"}
            </Button>
          </CardContent>
        </Card>
      </main>

      {!currentUser && (
        <div className="mt-12">
          <Link href="/cadastrar" passHref>
            <Button variant="outline" size="lg" className="text-lg py-3 px-6 shadow-md hover:shadow-lg">
              <UserPlus className="mr-2 h-5 w-5" /> Ainda não tem conta? Cadastre-se!
            </Button>
          </Link>
        </div>
      )}

      <div className="fixed bottom-6 left-6 z-50">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Opções de Administrador" className="shadow-lg rounded-full">
              <Settings className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2">
            <Link href="/admin" passHref legacyBehavior>
              <Button variant="destructive" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                <ShieldCheck className="mr-2 h-4 w-4" /> Acessar Admin
              </Button>
            </Link>
          </PopoverContent>
        </Popover>
      </div>

      <footer className="mt-20 py-8 text-center border-t border-border/50 w-full">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Bolão Potiguar. Todos os direitos reservados.
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Jogue com responsabilidade. Para maiores de 18 anos.
        </p>
      </footer>
    </div>
  );
}
