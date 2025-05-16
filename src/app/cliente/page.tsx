
"use client";

import { useState, useEffect } from 'react';
import { TicketSelectionForm } from '@/components/ticket-selection-form';
import { TicketList } from '@/components/ticket-list';
import type { Ticket, Draw } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import Link from 'next/link';
import Image from 'next/image'; 
import { Button } from '@/components/ui/button';
import { ArrowLeft, Menu, X, Ticket as TicketIconLucide, ListChecks, LogOut, LogIn } from 'lucide-react'; // Added Menu, X, TicketIconLucide, ListChecks, LogOut, LogIn
import { updateTicketStatusesBasedOnDraws } from '@/lib/lottery-utils';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils'; // Added cn

const CLIENTE_TICKETS_STORAGE_KEY = 'bolaoPotiguarClienteTickets'; 
const DRAWS_STORAGE_KEY = 'bolaoPotiguarDraws';

export default function ClientePage() { 
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [draws, setDraws] = useState<Draw[]>([]);
  const [isClient, setIsClient] = useState(false);
  const { currentUser, logout } = useAuth(); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // State for mobile menu

  useEffect(() => {
    setIsClient(true);
    const storedDrawsRaw = localStorage.getItem(DRAWS_STORAGE_KEY);
    const localDraws = storedDrawsRaw ? JSON.parse(storedDrawsRaw) : [];
    setDraws(localDraws);

    let initialTickets: Ticket[] = [];
    const storedTicketsRaw = localStorage.getItem(CLIENTE_TICKETS_STORAGE_KEY); 
    if (storedTicketsRaw) {
      initialTickets = JSON.parse(storedTicketsRaw);
    } else {
      initialTickets = [
        { id: uuidv4(), numbers: [1,2,3,4,5,6,7,8,9,10].sort((a,b)=>a-b), status: 'active', createdAt: new Date().toISOString(), buyerName: currentUser?.username },
      ];
    }
    if (currentUser) {
        initialTickets = initialTickets.map(ticket => ({
            ...ticket,
            buyerName: ticket.buyerName || currentUser.username, 
        }));
    }
    setTickets(initialTickets);

  }, [isClient, currentUser]); 

  useEffect(() => {
    if (isClient) {
      if (tickets.length > 0 || localStorage.getItem(CLIENTE_TICKETS_STORAGE_KEY)) { 
          const processedTickets = updateTicketStatusesBasedOnDraws(tickets, draws);

          if (JSON.stringify(processedTickets) !== JSON.stringify(tickets)) {
            setTickets(processedTickets); 
          }
          localStorage.setItem(CLIENTE_TICKETS_STORAGE_KEY, JSON.stringify(processedTickets)); 
      }
    }
  }, [tickets, draws, isClient]);


  const handleAddTicket = (newNumbers: number[]) => {
    const newTicket: Ticket = {
      id: uuidv4(),
      numbers: newNumbers.sort((a, b) => a - b),
      status: 'active', 
      createdAt: new Date().toISOString(),
      buyerName: currentUser?.username, 
    };
    setTickets(prevTickets => [newTicket, ...prevTickets]); 
  };

  const isLotteryActive = draws.length > 0;

  if (!isClient) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <p className="text-foreground text-xl">Carregando área do cliente...</p> 
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen flex flex-col">
      <header className="mb-10">
        <div className="flex justify-between items-center">
          <Link href="/" passHref>
            <Button variant="outline" className="h-10 w-10 p-0 sm:w-auto sm:px-3 sm:py-2 flex items-center justify-center sm:justify-start">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline-block sm:ml-2">Voltar para Home</span>
            </Button>
          </Link>
          <div className="text-center flex-grow">
            <div className="mb-2 flex justify-center">
              <Image
                src="/logo.png" 
                alt="Logo Bolão Potiguar" 
                width={100} 
                height={100} 
                priority 
                className="mx-auto"
              />
            </div>
             <p className="text-lg text-muted-foreground mt-1">Sua sorte começa aqui!</p>
          </div>
          <div className="w-10 md:hidden"> {/* Hamburger button container */}
             <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Abrir menu"
              >
                <Menu className="h-6 w-6" />
              </Button>
          </div>
          <div className="hidden md:block w-[150px] sm:w-[180px] md:w-[200px]"></div>  {/* Spacer for desktop */}
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <aside 
          className={cn(
            "fixed inset-0 z-40 w-full h-full flex flex-col bg-card/95 backdrop-blur-sm p-4",
            "md:hidden" // Ensure it's only for mobile
          )}
        >
          <div className="flex justify-end p-2">
            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)} aria-label="Fechar menu">
              <X className="h-6 w-6" />
            </Button>
          </div>
          <nav className="space-y-2 flex-grow mt-4">
            <Link href="#ticket-selection-heading" passHref>
              <Button variant="ghost" className="w-full justify-start text-lg py-3" onClick={() => setIsMobileMenuOpen(false)}>
                <TicketIconLucide className="mr-3 h-6 w-6" /> Montar Bilhete
              </Button>
            </Link>
            <Link href="#ticket-management-heading" passHref>
              <Button variant="ghost" className="w-full justify-start text-lg py-3" onClick={() => setIsMobileMenuOpen(false)}>
                <ListChecks className="mr-3 h-6 w-6" /> Meus Bilhetes
              </Button>
            </Link>
            {currentUser && (
                <Button variant="outline" onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="w-full justify-start text-lg py-3 mt-6 border-primary text-primary hover:bg-primary/10">
                    <LogOut className="mr-3 h-6 w-6" /> Sair
                </Button>
            )}
            {!currentUser && (
              <Link href="/login" passHref>
                  <Button variant="outline" className="w-full justify-start text-lg py-3 mt-6 border-primary text-primary hover:bg-primary/10" onClick={() => setIsMobileMenuOpen(false)}>
                      <LogIn className="mr-3 h-6 w-6" /> Login / Cadastro
                  </Button>
              </Link>
            )}
          </nav>
        </aside>
      )}

      <main className="space-y-12 flex-grow">
        <section aria-labelledby="ticket-selection-heading" id="ticket-selection-heading" className="scroll-mt-20">
          <h2 className="sr-only">Seleção de Bilhetes</h2>
          <TicketSelectionForm onAddTicket={handleAddTicket} isLotteryActive={isLotteryActive} />
        </section>

        <section aria-labelledby="ticket-management-heading" id="ticket-management-heading" className="mt-16 scroll-mt-20">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-8 text-center">
            Meus Bilhetes
          </h2>
          <TicketList
            tickets={tickets}
            draws={draws}
          />
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
