
"use client";

import { useMemo, type FC } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TrendingUp } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { RankedTicket, Draw } from '@/types';
import { cn } from '@/lib/utils';
import { countOccurrences } from '@/lib/lottery-utils';

interface CycleRankingSectionProps {
  rankedTickets: RankedTicket[];
  draws: Draw[];
}

export const CycleRankingSection: FC<CycleRankingSectionProps> = ({ rankedTickets, draws }) => {

  const drawnNumbersFrequency = useMemo(() => {
    if (!draws || draws.length === 0) {
      return {} as Record<number, number>;
    }
    return countOccurrences(draws.flatMap(draw => draw.numbers));
  }, [draws]);

  const getProcessedTicketNumbers = (ticket: RankedTicket) => {
    const tempDrawnFrequency = { ...drawnNumbersFrequency };
    return ticket.numbers.map(num => {
      let isMatched = false;
      if (tempDrawnFrequency[num] && tempDrawnFrequency[num] > 0) {
        isMatched = true;
        tempDrawnFrequency[num]--;
      }
      return { numberValue: num, isMatched };
    });
  };

  return (
    <section aria-labelledby="cycle-ranking-heading">
      <h2 id="cycle-ranking-heading" className="text-3xl md:text-4xl font-bold text-primary mb-8 text-center flex items-center justify-center">
        <TrendingUp className="mr-3 h-8 w-8 text-primary" />
        Ranking do Ciclo Atual
      </h2>
      <Card className="w-full mx-auto shadow-xl bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl text-center font-semibold">
            Placar Geral de Acertos
          </CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            Todos os bilhetes ativos ordenados pela quantidade de acertos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[60vh]">
            <Table>
              <TableHeader className="sticky top-0 bg-secondary/95 z-10">
                <TableRow>
                  <TableHead>Comprador</TableHead>
                  <TableHead className="text-center">Números do Bilhete</TableHead>
                  <TableHead className="w-[100px] text-center">Acertos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rankedTickets.length > 0 ? (
                  rankedTickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-medium">{ticket.buyerName}</TableCell>
                       <TableCell>
                        <div className="flex flex-wrap gap-1 justify-center">
                            {getProcessedTicketNumbers(ticket).map(({ numberValue, isMatched }, i) => (
                                <Badge 
                                  key={i} 
                                  variant={isMatched ? "default" : "outline"} 
                                  className={cn(
                                    "font-mono text-xs w-7 h-7 flex items-center justify-center transition-colors",
                                    isMatched && "bg-green-500 text-white"
                                  )}
                                >
                                  {numberValue}
                                </Badge>
                            ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                         <Badge
                            variant="default"
                            className="font-mono text-lg font-bold h-8 w-8 flex items-center justify-center rounded-full shadow-lg"
                        >
                            {ticket.matches}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                      Nenhum bilhete ativo no ciclo atual para exibir no ranking.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </section>
  );
};
