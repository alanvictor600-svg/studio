
"use client";

import type { FC } from 'react';
import { useMemo } from 'react';
import type { Ticket, Draw } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Award, CircleDot, TimerOff, CalendarDays, User, Clock, Ban, CheckCircle, Ticket as TicketIcon } from 'lucide-react';
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
          textColor: 'text-emerald-500',
          bgColor: 'bg-emerald-500/10',
          ringColor: 'ring-emerald-500/80',
          Icon: Award,
          label: 'Premiado!',
        };
      case 'awaiting_payment':
        return {
          textColor: 'text-orange-500',
          bgColor: 'bg-orange-500/10',
          ringColor: 'ring-orange-500/80',
          Icon: Clock,
          label: 'Aguardando Pagamento',
        };
       case 'unpaid':
        return {
          textColor: 'text-red-500',
          bgColor: 'bg-red-500/10',
          ringColor: 'ring-red-500/80',
          Icon: Ban,
          label: 'Não Pago',
        };
      case 'expired':
        return {
          textColor: 'text-muted-foreground',
          bgColor: 'bg-muted/20',
          ringColor: 'ring-muted/80',
          Icon: TimerOff,
          label: 'Expirado',
        };
      case 'active':
      default:
        return {
          textColor: 'text-blue-500',
          bgColor: 'bg-blue-500/10',
          ringColor: 'ring-blue-500/80',
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
        "shadow-lg hover:shadow-xl transition-shadow duration-300 relative overflow-hidden bg-card/70 backdrop-blur-sm border-border/50",
        ticket.status === 'winning' && 'shadow-green-500/20 hover:shadow-green-500/30'
     )}>
        {/* Glow effect for winning ticket */}
        {ticket.status === 'winning' && (
            <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-gradient-radial from-green-500/15 via-transparent to-transparent animate-[spin_10s_linear_infinite] z-0" />
        )}
        
        <div className="relative z-10 flex flex-col h-full">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-dashed">
                <div className="flex items-center gap-2">
                    <TicketIcon className={cn("h-5 w-5", statusProps.textColor)} />
                    <p className="font-mono text-xs text-muted-foreground">#{ticket.id.substring(0, 8)}</p>
                </div>
                 <Badge variant="outline" className={cn("text-xs font-semibold px-2 py-1 border-dashed", statusProps.bgColor, statusProps.textColor, `border-current/30`)}>
                    <statusProps.Icon className="mr-1.5 h-3 w-3" />
                    {statusProps.label}
                </Badge>
            </div>

            {/* Content */}
            <CardContent className="py-5">
                <div className="grid grid-cols-5 gap-3 text-center">
                    {processedTicketNumbers.map(({ numberValue, isMatched }, index) => (
                        <div
                        key={`${ticket.id}-num-${index}`}
                        className={cn(
                            "aspect-square rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300",
                            isMatched
                            ? "bg-green-500 text-white shadow-lg ring-2 ring-yellow-400/80"
                            : "bg-muted/50 text-muted-foreground shadow-inner"
                        )}
                        >
                        {numberValue}
                        </div>
                    ))}
                </div>
                 {ticket.status === 'active' && draws && draws.length > 0 && (
                    <div className={cn("flex items-center justify-center text-sm mt-5 p-2 rounded-lg", statusProps.bgColor, statusProps.textColor)}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        <span className="font-semibold">Acertos até agora: {matches}</span>
                    </div>
                )}
            </CardContent>
            
            {/* Footer */}
            <div className="mt-auto p-4 border-t border-dashed text-xs text-muted-foreground space-y-2">
                 {(ticket.buyerName || ticket.sellerUsername) && (
                    <div className="flex items-center">
                        <User size={14} className="mr-1.5" />
                        <span>
                            {ticket.sellerUsername 
                                ? `Vendido por: ${ticket.sellerUsername} para ` 
                                : 'Comprador: '
                            }
                            <span className="font-semibold text-foreground">{ticket.buyerName}</span>
                        </span>
                    </div>
                )}
                <div className="flex items-center">
                    <CalendarDays size={14} className="mr-1.5" />
                    <span>
                        Comprado em: {format(parseISO(ticket.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                </div>
            </div>
        </div>
     </Card>
  );
};
