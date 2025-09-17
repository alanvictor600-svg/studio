
"use client";

import type { FC } from 'react';
import { useMemo } from 'react';
import type { Ticket, Draw } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Award, CircleDot, TimerOff, CalendarDays, User, Phone, Clock, Ban, CheckCircle } from 'lucide-react';
import { calculateTicketMatches } from '@/lib/lottery-utils';


interface TicketCardProps {
  ticket: Ticket;
  draws?: Draw[];
}

export const TicketCard: FC<TicketCardProps> = ({ ticket, draws }) => {
  
  const matches = useMemo(() => calculateTicketMatches(ticket, draws || []), [ticket, draws]);
  
  const getStatusProps = () => {
    switch (ticket.status) {
      case 'winning':
        return {
          bgColor: 'bg-accent',
          textColor: 'text-accent-foreground',
          Icon: Award,
          label: 'Premiado!',
        };
      case 'awaiting_payment':
        return {
          bgColor: 'bg-orange-400',
          textColor: 'text-orange-900',
          Icon: Clock,
          label: 'Aguardando Pagamento',
        };
       case 'unpaid':
        return {
          bgColor: 'bg-red-500',
          textColor: 'text-red-100',
          Icon: Ban,
          label: 'Não Pago',
        };
      case 'expired':
        return {
          bgColor: 'bg-muted',
          textColor: 'text-muted-foreground',
          Icon: TimerOff,
          label: 'Expirado',
        };
      case 'active':
      default:
        return {
          bgColor: 'bg-secondary',
          textColor: 'text-secondary-foreground',
          Icon: CircleDot,
          label: 'Ativo',
        };
    }
  };

  const statusProps = getStatusProps();
  
  const drawnNumbersFrequency = useMemo(() => {
    if (!draws || draws.length === 0) {
      return {} as Record<number, number>;
    }
    const frequency: Record<number, number> = {};
    for (const draw of draws) {
      for (const num of draw.numbers) {
        frequency[num] = (frequency[num] || 0) + 1;
      }
    }
    return frequency;
  }, [draws]);

  // If the ticket is expired, no numbers should be marked as matched.
  const processedTicketNumbers = useMemo(() => {
    if (ticket.status === 'expired') {
        return ticket.numbers.map(num => ({ numberValue: num, isMatched: false }));
    }

    const tempDrawnFrequency = { ...drawnNumbersFrequency };
    return ticket.numbers.map(num => {
      let isMatchedInstance = false;
      if (tempDrawnFrequency[num] && tempDrawnFrequency[num] > 0) {
        isMatchedInstance = true;
        tempDrawnFrequency[num]--;
      }
      return { numberValue: num, isMatched: isMatchedInstance };
    });
  }, [ticket.numbers, ticket.status, drawnNumbersFrequency]);


  return (
    <Card className={cn(
      "shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col justify-between h-full",
      statusProps.bgColor,
      statusProps.textColor
    )}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Bilhete <span className="font-mono text-sm opacity-60">#{ticket.id.substring(0, 6)}</span></span>
          <div className="flex items-center gap-2">
             {ticket.status === 'active' && draws && draws.length > 0 && (
                <Badge variant="outline" className="text-base font-bold py-1 px-3 shadow-md bg-background/70 text-primary border-primary/50">
                    <CheckCircle className="mr-1.5 h-4 w-4" />
                    {matches} Acerto{matches !== 1 ? 's' : ''}
                </Badge>
            )}
            <Badge variant="outline" className="text-sm shadow bg-background/20 backdrop-blur-sm">
                <statusProps.Icon className="mr-1.5 h-4 w-4" />
                {statusProps.label}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="flex flex-wrap gap-2">
          {processedTicketNumbers.map(({ numberValue, isMatched }, index) => (
            <Badge
              key={`${ticket.id}-num-${index}`}
              variant="outline"
              className={cn(
                "text-base font-semibold px-2 py-1 shadow-sm bg-background/20",
                isMatched && 'ring-2 ring-yellow-300'
              )}
            >
              {numberValue}
            </Badge>
          ))}
        </div>
      </CardContent>
       <CardFooter className="pt-3 pb-4 border-t border-current/20 mt-auto">
          <div className="w-full space-y-1 text-xs opacity-90">
             {(ticket.buyerName || ticket.buyerPhone) && (
              <div className="space-y-1">
                {ticket.buyerName && (
                  <div className="flex items-center">
                    <User size={14} className="mr-1.5" />
                    <span className="font-semibold mr-1">Comprador:</span>
                    <span>{ticket.buyerName}</span>
                  </div>
                )}
                {ticket.buyerPhone && (
                  <div className="flex items-center">
                    <Phone size={14} className="mr-1.5" />
                     <span className="font-semibold mr-1">Telefone:</span>
                    <span>{ticket.buyerPhone}</span>
                  </div>
                )}
              </div>
            )}
            <div className="flex items-center">
                <CalendarDays size={14} className="mr-1.5" />
                {format(parseISO(ticket.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </div>
          </div>
        </CardFooter>
    </Card>
  );
};
