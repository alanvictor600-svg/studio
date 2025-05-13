
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Construction } from 'lucide-react';
import type { Metadata } from 'next';

// export const metadata: Metadata = { // Metadata should be defined in layout or at build time
//   title: 'Área do Vendedor - Bolão Potiguar',
//   description: 'Gerencie suas vendas e acompanhe seus resultados.',
// };

export default function VendedorPage() {
  return (
    <div className="container mx-auto px-4 py-8 min-h-screen flex flex-col">
      <header className="mb-10">
        <div className="flex items-center">
          <Link href="/" passHref>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Home
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center text-center">
        <Construction className="h-24 w-24 text-primary mb-6" />
        <h1 className="text-4xl md:text-5xl font-extrabold text-primary tracking-tight mb-4">
          Área do Vendedor
        </h1>
        <p className="text-xl text-muted-foreground mb-2">
          Esta área está em construção.
        </p>
        <p className="text-md text-muted-foreground/80">
          Volte em breve para novidades sobre o portal do vendedor!
        </p>
      </main>

      <footer className="mt-20 py-8 text-center border-t border-border/50">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Bolão Potiguar. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}
