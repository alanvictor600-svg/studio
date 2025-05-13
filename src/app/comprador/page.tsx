
"use client";

import { useState, useEffect } from 'react';
import { TicketSelectionForm } from '@/components/ticket-selection-form';
import { TicketList } from '@/components/ticket-list';
import type { Ticket } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';

// export const metadata: Metadata = { // Metadata should be defined in layout or at build time
//   title: 'Comprar Bilhetes - Bolão Potiguar',
//   description: 'Selecione seus números e compre seus bilhetes da sorte!',
// };

export default function CompradorPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const storedTickets = localStorage.getItem('bolaoPotiguarTickets');
    if (storedTickets) {
      setTickets(JSON.parse(storedTickets));
    } else {
      // Initial mock data for demonstration if no tickets are stored
      setTickets([
        { id: uuidv4(), numbers: [1,2,3,4,5,6,7,8,9,10].sort((a,b)=>a-b), status: 'active', createdAt: new Date().toISOString() },
      ]);
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem('bolaoPotiguarTickets', JSON.stringify(tickets));
    }
  }, [tickets, isClient]);

  const handleAddTicket = (newNumbers: number[]) => {
    const newTicket: Ticket = {
      id: uuidv4(),
      numbers: newNumbers.sort((a, b) => a - b), // Ensure sorted
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    setTickets(prevTickets => [newTicket, ...prevTickets]);
  };

  const handleUpdateTicketStatus = (ticketId: string, newStatus: Ticket['status']) => {
    setTickets(prevTickets => prevTickets.map(t => t.id === ticketId ? {...t, status: newStatus} : t));
  };

  if (!isClient) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <p className="text-foreground text-xl">Carregando área do comprador...</p>
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
                Comprar Bilhetes
             </h1>
             <p className="text-lg text-muted-foreground mt-2">Sua sorte começa aqui!</p>
          </div>
           <div className="w-[150px]"></div> {/* Spacer to balance the layout */}
        </div>
      </header>

      <main className="space-y-12 flex-grow">
        <section aria-labelledby="ticket-selection-heading">
          <h2 id="ticket-selection-heading" className="sr-only">Seleção de Bilhetes</h2>
          <TicketSelectionForm onAddTicket={handleAddTicket} />
        </section>

        <section aria-labelledby="ticket-management-heading" className="mt-16">
          <h2 id="ticket-management-heading" className="text-3xl md:text-4xl font-bold text-primary mb-8 text-center">
            Meus Bilhetes
          </h2>
          <TicketList tickets={tickets} onUpdateTicketStatus={handleUpdateTicketStatus} />
        </section>
      </main>

      <footer className="mt-20 py-8 text-center border-t border-border/50">
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
