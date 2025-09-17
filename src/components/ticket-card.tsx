
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
          borderColor: 'border-green-500',
          textColor: 'text-green-600 dark:text-green-500',
          badgeBg: 'bg-green-500/10',
          gradient: 'bg-gradient-to-br from-green-500/10 via-background/0 to-background/0',
          Icon: Award,
          label: 'Premiado!',
        };
      case 'awaiting_payment':
        return {
          borderColor: 'border-orange-400',
          textColor: 'text-orange-500',
          badgeBg: 'bg-orange-400/10',
          Icon: Clock,
          label: 'Aguardando Pagamento',
        };
       case 'unpaid':
        return {
          borderColor: 'border-red-500',
          textColor: 'text-red-600 dark:text-red-500',
          badgeBg: 'bg-red-500/10',
          Icon: Ban,
          label: 'Não Pago',
        };
      case 'expired':
        return {
          borderColor: 'border-muted',
          textColor: 'text-muted-foreground',
          badgeBg: 'bg-muted/50',
          Icon: TimerOff,
          label: 'Expirado',
        };
      case 'active':
      default:
        return {
          borderColor: 'border-blue-500',
          textColor: 'text-blue-600 dark:text-blue-500',
          badgeBg: 'bg-blue-500/10',
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
      "bg-card border-l-4 relative overflow-hidden",
      statusProps.borderColor,
      ticket.status === 'winning' && 'ring-2 ring-green-500/50'
    )}>
       {ticket.status === 'winning' && (
         <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-green-500/10 via-transparent to-transparent z-0"></div>
       )}
       <div className="relative z-10 flex flex-col h-full">
            <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center justify-between gap-2">
                <span className="font-semibold text-foreground">Bilhete <span className="font-mono text-sm text-muted-foreground">#{ticket.id.substring(0, 6)}</span></span>
                <Badge variant="outline" className={cn("text-sm shadow-sm", statusProps.badgeBg, statusProps.textColor, `border-current/30`)}>
                    <statusProps.Icon className="mr-1.5 h-4 w-4" />
                    {statusProps.label}
                </Badge>
                </CardTitle>
                {ticket.status === 'active' && draws && draws.length > 0 && (
                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                        <CheckCircle className="mr-1.5 h-4 w-4 text-primary" />
                        Acertos até agora: <span className="font-bold text-primary ml-1">{matches}</span>
                    </div>
                )}
            </CardHeader>
            <CardContent className="flex-grow py-2">
                <div className="flex flex-wrap gap-2 justify-center">
                {processedTicketNumbers.map(({ numberValue, isMatched }, index) => (
                    <Badge
                    key={`${ticket.id}-num-${index}`}
                    variant="outline"
                    className={cn(
                        "text-base font-semibold px-2 py-1 shadow-sm h-8 w-8 flex items-center justify-center rounded-md text-foreground",
                        isMatched ? "bg-green-500/20 text-green-800 dark:text-green-300 border-green-500/30" : "bg-muted/50"
                    )}
                    >
                    {numberValue}
                    </Badge>
                ))}
                </div>
            </CardContent>
            <CardFooter className="pt-4 pb-4 border-t mt-auto">
                <div className="w-full space-y-2 text-xs text-muted-foreground">
                    {(ticket.buyerName || ticket.buyerPhone) && (
                    <div className="space-y-1.5">
                        {ticket.buyerName && (
                        <div className="flex items-center">
                            <User size={14} className="mr-1.5" />
                            <span className="font-semibold mr-1 text-foreground/80">Comprador:</span>
                            <span className="font-medium text-foreground">{ticket.buyerName}</span>
                        </div>
                        )}
                        {ticket.buyerPhone && (
                        <div className="flex items-center">
                            <Phone size={14} className="mr-1.5" />
                            <span className="font-semibold mr-1 text-foreground/80">Telefone:</span>
                            <span className="font-medium text-foreground">{ticket.buyerPhone}</span>
                        </div>
                        )}
                    </div>
                    )}
                    <div className="flex items-center pt-1">
                        <CalendarDays size={14} className="mr-1.5" />
                        {format(parseISO(ticket.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </div>
                </div>
            </CardFooter>
       </div>
    </Card>
  );
};
