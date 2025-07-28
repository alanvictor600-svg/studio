
"use client";

import { useState, type FC } from 'react';
import type { Ticket, Draw } from '@/types'; // Import Draw
import { TicketCard } from '@/components/ticket-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { List, PlayCircle, Trophy, Clock, Ban, TimerOff } from 'lucide-react';

interface TicketListProps {
  tickets: Ticket[];
  draws?: Draw[]; // Added to receive draw information
}

export const TicketList: FC<TicketListProps> = ({ tickets, draws }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'winning' | 'expired' | 'awaiting_payment'>('all');

  const filteredTickets = tickets.filter(ticket => {
    if (activeTab === 'all') return true;
    if (activeTab === 'expired') return ticket.status === 'expired' || ticket.status === 'unpaid';
    return ticket.status === activeTab;
  });

  const getCount = (status: typeof activeTab) => {
    if (status === 'all') return tickets.length;
    if (status === 'expired') return tickets.filter(t => t.status === 'expired' || t.status === 'unpaid').length;
    return tickets.filter(t => t.status === status).length;
  }

  const tabItems = [
    { value: 'all', label: 'Todos', Icon: List },
    { value: 'awaiting_payment', label: 'Aguardando', Icon: Clock },
    { value: 'active', label: 'Ativos', Icon: PlayCircle },
    { value: 'winning', label: 'Premiados', Icon: Trophy },
    { value: 'expired', label: 'Expirados', Icon: TimerOff },
  ];

  return (
    <div>
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="w-full mb-6">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 h-auto bg-card/80 backdrop-blur-sm p-1.5 rounded-lg shadow-md">
          {tabItems.map(tab => {
            const count = getCount(tab.value as typeof activeTab);
            if(count === 0 && tab.value !== 'all') return null;
            return (
              <TabsTrigger key={tab.value} value={tab.value} className="py-2.5 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-200">
                <tab.Icon className="mr-2 h-4 w-4" /> {tab.label} ({count})
              </TabsTrigger>
            )
          })}
        </TabsList>
      </Tabs>

      {filteredTickets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTickets.map(ticket => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              draws={draws} // Pass draws to TicketCard
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 bg-card/50 rounded-lg shadow">
          <p className="text-muted-foreground text-lg">Nenhum bilhete encontrado para esta categoria.</p>
        </div>
      )}
    </div>
  );
};
