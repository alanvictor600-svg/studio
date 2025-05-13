
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminDrawList } from '@/components/admin-draw-list';
import { TicketList } from '@/components/ticket-list';
import type { Draw, Ticket } from '@/types';
import { ArrowLeft, ClipboardList, Ticket as TicketIconLucide, BarChart3 } from 'lucide-react';
import { updateTicketStatusesBasedOnDraws } from '@/lib/lottery-utils';

const DRAWS_STORAGE_KEY = 'bolaoPotiguarDraws';
const COMPRADOR_TICKETS_STORAGE_KEY = 'bolaoPotiguarCompradorTickets';
const VENDEDOR_TICKETS_STORAGE_KEY = 'bolaoPotiguarVendedorTickets'; // For potential future use

export default function VendedorPage() {
  const [draws, setDraws] = useState<Draw[]>([]);
  const [compradorTicketsForSummary, setCompradorTicketsForSummary] = useState<Ticket[]>([]);
  const [vendedorManagedTickets, setVendedorManagedTickets] = useState<Ticket[]>([]);
  const [isClient, setIsClient] = useState(false);

  // Initial load of draws
  useEffect(() => {
    setIsClient(true);
    const storedDraws = localStorage.getItem(DRAWS_STORAGE_KEY);
    if (storedDraws) {
      setDraws(JSON.parse(storedDraws));
    }
  }, []); // Runs once on mount

  // Load tickets once client-side and when draws change (to re-process statuses)
  useEffect(() => {
    if (isClient) {
      // Load comprador tickets for summary
      const storedCompradorTickets = localStorage.getItem(COMPRADOR_TICKETS_STORAGE_KEY);
      let initialCompradorTickets: Ticket[] = [];
      if (storedCompradorTickets) {
        initialCompradorTickets = JSON.parse(storedCompradorTickets);
      }
      setCompradorTicketsForSummary(updateTicketStatusesBasedOnDraws(initialCompradorTickets, draws));

      // Load vendedor tickets (will be empty for now as sellers don't create tickets)
      const storedVendedorTickets = localStorage.getItem(VENDEDOR_TICKETS_STORAGE_KEY);
      let initialVendedorTickets: Ticket[] = [];
      if (storedVendedorTickets) {
        initialVendedorTickets = JSON.parse(storedVendedorTickets);
      }
      setVendedorManagedTickets(updateTicketStatusesBasedOnDraws(initialVendedorTickets, draws));
    }
  }, [isClient, draws]);


  if (!isClient) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <p className="text-foreground text-xl">Carregando Área do Vendedor...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen flex flex-col">
      <header className="mb-10">
        <div className="flex justify-between items-center">
          <Link href="/" passHref>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Home
            </Button>
          </Link>
          <div className="text-center flex-grow">
            <h1 className="text-4xl md:text-5xl font-extrabold text-primary tracking-tight">
              Área do Vendedor
            </h1>
            <p className="text-lg text-muted-foreground mt-2">Painel de Controle e Vendas</p>
          </div>
          <div className="w-[150px]"></div> {/* Spacer to balance layout */}
        </div>
      </header>

      <main className="space-y-12 flex-grow">
        {/* Dashboard Summary Section */}
        <section aria-labelledby="dashboard-summary-heading">
          <h2 id="dashboard-summary-heading" className="text-3xl font-bold text-primary mb-6 text-center">
            Resumo Geral
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <Card className="shadow-lg bg-card text-card-foreground border-border hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total de Sorteios Cadastrados
                </CardTitle>
                <ClipboardList className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{draws.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Sorteios registrados no sistema.
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-lg bg-card text-card-foreground border-border hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total de Bilhetes Vendidos (Compradores)
                </CardTitle>
                <TicketIconLucide className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{compradorTicketsForSummary.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Bilhetes comprados pelos usuários.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Draws Section */}
        <section aria-labelledby="seller-draw-history-heading">
          <h2 id="seller-draw-history-heading" className="text-3xl font-bold text-primary mb-8 text-center">
            Histórico de Sorteios
          </h2>
          {draws.length > 0 ? (
            <AdminDrawList draws={draws} />
          ) : (
             <div className="text-center py-10 bg-card/50 rounded-lg shadow">
                <ClipboardList size={48} className="mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground text-lg">Nenhum sorteio cadastrado ainda.</p>
             </div>
          )}
        </section>

        {/* Tickets Section - Displaying Vendedor-specific tickets (currently none) */}
        <section aria-labelledby="seller-ticket-list-heading" className="mt-16">
          <h2 id="seller-ticket-list-heading" className="text-3xl font-bold text-primary mb-8 text-center">
            Meus Bilhetes Registrados (Vendedor)
          </h2>
           {vendedorManagedTickets.length > 0 ? (
            <TicketList tickets={vendedorManagedTickets} draws={draws} /> 
          ) : (
             <div className="text-center py-10 bg-card/50 rounded-lg shadow">
                <TicketIconLucide size={48} className="mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground text-lg">Nenhum bilhete de vendedor registrado ainda.</p>
                <p className="text-sm text-muted-foreground/80">Vendedores atualmente não criam bilhetes neste sistema.</p>
             </div>
          )}
        </section>
        
        {/* Placeholder for future reports/analytics */}
        <section aria-labelledby="reports-heading" className="mt-16">
          <h2 id="reports-heading" className="text-3xl font-bold text-primary mb-8 text-center">
            Relatórios e Análises
          </h2>
          <div className="text-center py-10 bg-card/50 rounded-lg shadow">
            <BarChart3 size={48} className="mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground text-lg">
              Em breve: relatórios detalhados de vendas e desempenho.
            </p>
          </div>
        </section>
      </main>

      <footer className="mt-20 py-8 text-center border-t border-border/50">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Bolão Potiguar - Área do Vendedor.
        </p>
      </footer>
    </div>
  );
}
