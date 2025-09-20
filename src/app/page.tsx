
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LogIn, UserPlus, Star, Gamepad2, Gift } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import type { Draw } from '@/types';
import { db } from '@/lib/firebase-client';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { AdminDrawCard } from '@/components/admin-draw-card';
import { TopTickets } from '@/components/TopTickets';
import { ThemeToggleButton } from '@/components/theme-toggle-button';

// Sub-component for the Header
const LandingHeader = () => {
  const { currentUser, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated && currentUser) {
      const defaultRedirect = currentUser.role === 'admin' ? '/admin' : `/dashboard/${currentUser.role}`;
      router.replace(defaultRedirect);
    }
  }, [isLoading, isAuthenticated, currentUser, router]);

  if (isLoading || isAuthenticated) {
    return (
       <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg">
                <Image src="/logo.png" alt="Logo Bolão Potiguar" width={40} height={40} />
                <span className="hidden sm:inline-block">Bolão Potiguar</span>
            </Link>
            <div className="text-sm text-muted-foreground">Verificando sessão...</div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary">
          <Image src="/logo.png" alt="Logo Bolão Potiguar" width={40} height={40} />
          <span className="hidden sm:inline-block">Bolão Potiguar</span>
        </Link>
        <div className="flex items-center gap-2">
            <ThemeToggleButton />
            <Button asChild variant="outline">
                <Link href="/login"><LogIn className="mr-2 h-4 w-4" /> Entrar</Link>
            </Button>
            <Button asChild>
                <Link href="/cadastrar"><UserPlus className="mr-2 h-4 w-4" /> Cadastrar</Link>
            </Button>
        </div>
      </div>
    </header>
  );
};

// Sub-component for the Hero Section
const HeroSection = () => (
  <section className="container px-4 md:px-6 py-12 md:py-24 text-center">
    <div className="max-w-3xl mx-auto">
      <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter text-primary">
        Sua Sorte Começa Aqui
      </h1>
      <p className="mt-4 text-lg md:text-xl text-muted-foreground">
        Aposte nos seus números da sorte, concorra a prêmios incríveis e divirta-se. Simples, rápido e emocionante!
      </p>
      <div className="mt-8 flex justify-center gap-4">
        <Button asChild size="lg" className="text-lg">
          <Link href="/cadastrar">Comece a Apostar Agora</Link>
        </Button>
      </div>
    </div>
  </section>
);


// Sub-component for the Results Section
const ResultsSection = () => {
    const [lastDraw, setLastDraw] = useState<Draw | null>(null);
    const [allDraws, setAllDraws] = useState<Draw[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'draws'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const drawsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Draw));
            setAllDraws(drawsData);
            setLastDraw(drawsData[0] || null);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching draws: ", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <section className="bg-muted/50 py-12 md:py-20">
            <div className="container px-4 md:px-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-start">
                    <div className="space-y-4 text-center lg:text-left">
                        <h2 className="text-3xl md:text-4xl font-bold text-primary">Resultados e Estatísticas</h2>
                        <p className="text-muted-foreground text-lg">
                            Confira o resultado do último sorteio e veja os números mais quentes do ciclo.
                        </p>
                         {isLoading ? (
                            <Card className="h-full">
                                <CardContent className="flex items-center justify-center h-48">
                                    <p className="text-muted-foreground">Carregando resultados...</p>
                                </CardContent>
                            </Card>
                        ) : lastDraw ? (
                           <AdminDrawCard draw={lastDraw} />
                        ) : (
                           <Card>
                                <CardHeader>
                                    <CardTitle className="text-xl text-center">Nenhum Sorteio Realizado</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-center text-muted-foreground">Ainda não houve sorteios neste ciclo. Volte em breve!</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                     <div className="h-full">
                         <TopTickets draws={allDraws} />
                    </div>
                </div>
            </div>
        </section>
    );
};


// Sub-component for "How it Works"
const HowItWorksSection = () => (
  <section className="py-12 md:py-24">
    <div className="container px-4 md:px-6">
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-primary">Como Funciona?</h2>
        <p className="mt-3 text-lg text-muted-foreground">É fácil participar. Siga os três passos abaixo:</p>
      </div>
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
        <div className="flex flex-col items-center">
          <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary text-primary-foreground mb-4 shadow-lg">
            <UserPlus size={32} />
          </div>
          <h3 className="text-xl font-bold">1. Cadastre-se</h3>
          <p className="text-muted-foreground mt-2">Crie sua conta de cliente de forma rápida e segura.</p>
        </div>
        <div className="flex flex-col items-center">
          <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary text-primary-foreground mb-4 shadow-lg">
            <Gamepad2 size={32} />
          </div>
          <h3 className="text-xl font-bold">2. Faça sua Aposta</h3>
          <p className="text-muted-foreground mt-2">Escolha seus 10 números da sorte, de 1 a 25. Pode repetir!</p>
        </div>
        <div className="flex flex-col items-center">
          <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary text-primary-foreground mb-4 shadow-lg">
            <Gift size={32} />
          </div>
          <h3 className="text-xl font-bold">3. Concorra aos Prêmios</h3>
          <p className="text-muted-foreground mt-2">Aguarde o sorteio. Se seus 10 números forem sorteados, você ganha!</p>
        </div>
      </div>
    </div>
  </section>
);


// Sub-component for the Footer
const LandingFooter = () => (
  <footer className="border-t">
    <div className="container px-4 md:px-6 py-8 flex flex-col sm:flex-row justify-between items-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Bolão Potiguar. Todos os direitos reservados.</p>
        <div className="flex gap-4 mt-4 sm:mt-0">
            <Link href="#" className="hover:text-primary">Termos de Serviço</Link>
            <Link href="#" className="hover:text-primary">Política de Privacidade</Link>
        </div>
    </div>
  </footer>
);

export default function LandingPage() {
  return (
    <div className="flex flex-col flex-1">
      <LandingHeader />
      <main>
        <HeroSection />
        <ResultsSection />
        <HowItWorksSection />
      </main>
      <LandingFooter />
    </div>
  );
}

    