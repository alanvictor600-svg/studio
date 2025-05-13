"use client";

import { useState, useEffect } from 'react';
import { TicketSelectionForm } from '@/components/ticket-selection-form';
import { TicketList } from '@/components/ticket-list';
import type { Ticket } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import Image from 'next/image';

export default function HomePage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const storedTickets = localStorage.getItem('bolaoPotiguarTickets');
    if (storedTickets) {
      setTickets(JSON.parse(storedTickets));
    } else {
      // Initial mock data for demonstration
      setTickets([
        { id: uuidv4(), numbers: [1,2,3,4,5,6,7,8,9,10].sort((a,b)=>a-b), status: 'active', createdAt: new Date().toISOString() },
        { id: uuidv4(), numbers: [11,12,13,14,15,15,15,15,16,17].sort((a,b)=>a-b), status: 'winning', createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
        { id: uuidv4(), numbers: [21,22,23,24,25,1,2,3,4,5].sort((a,b)=>a-b), status: 'expired', createdAt: new Date(Date.now() - 86400000 * 8).toISOString() },
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
      numbers: newNumbers, // Assumed sorted by form
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    setTickets(prevTickets => [newTicket, ...prevTickets]);
  };

  const handleUpdateTicketStatus = (ticketId: string, newStatus: Ticket['status']) => {
    setTickets(prevTickets => prevTickets.map(t => t.id === ticketId ? {...t, status: newStatus} : t));
  };

  if (!isClient) {
    // Basic loading state to avoid hydration mismatch with localStorage
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <p className="text-foreground text-xl">Carregando Bolão Potiguar...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen flex flex-col">
      <header className="mb-10 text-center">
        <div className="inline-block p-3 rounded-full bg-primary shadow-lg mb-4">
          {/* Simple SVG Logo placeholder - replace with actual logo if available */}
          <svg width="48" height="48" viewBox="0 0 24 24" fill="hsl(var(--primary-foreground))" xmlns="http://www.w3.org/2000/svg" data-ai-hint="lottery ball">
            <circle cx="12" cy="12" r="10" stroke="hsl(var(--primary-foreground))" strokeWidth="1.5"/>
            <text x="12" y="16" fontSize="10" textAnchor="middle" fill="hsl(var(--primary-foreground))" fontWeight="bold">BP</text>
          </svg>
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold text-primary tracking-tight">
          Bolão Potiguar
        </h1>
        <p className="text-xl text-muted-foreground mt-3">Sua sorte começa aqui!</p>
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
