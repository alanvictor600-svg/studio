
"use client";

import { useMemo, type FC } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TrendingUp } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { RankedTicket, Draw } from '@/types';
import { cn } from '@/lib/utils';

interface CycleRankingSectionProps {
  rankedTickets: RankedTicket[];
  draws: Draw[];
}

export const CycleRankingSection: FC<CycleRankingSectionProps> = ({ rankedTickets, draws }) => {

  return (
    <section aria-labelledby="cycle-ranking-heading">
      <h2 id="cycle-ranking-heading" className="text-3xl md:text-4xl font-bold text-primary mb-8 text-center flex items-center justify-center">
        <TrendingUp className="mr-3 h-8 w-8 text-primary" />
        Ranking do Ciclo Atual
      </h2>
      <Card className="w-full mx-auto shadow-xl bg-card/80 backdrop-blur-sm">
        <CardHeader>
           <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl font-semibold">
                Placar Geral de Acertos
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Todos os bilhetes ativos ordenados pela quantidade de acertos.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[60vh] w-full">
            <Table>
              <TableHeader className="sticky top-0 bg-secondary/95 z-10">
                <TableRow>
                  <TableHead>Comprador</TableHead>
                  <TableHead>Vendedor</TableHead>
                   {Array.from({ length: 10 }, (_, i) => (
                      <TableHead key={i} className="text-center">{`${i + 1}º`}</TableHead>
                   ))}
                  <TableHead className="text-center">Acertos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rankedTickets.length > 0 ? (
                  rankedTickets.map((ticket) => (
                        <TableRow key={ticket.id}>
                            <TableCell className="font-medium">{ticket.buyerName}</TableCell>
                            <TableCell>{ticket.sellerUsername || '-'}</TableCell>
                            {ticket.numbers.map((num, i) => (
                                <TableCell key={i} className="text-center">
                                    <Badge
                                    variant={"outline"}
                                    className={cn(
                                        "font-mono text-xs w-7 h-7 flex items-center justify-center transition-colors"
                                    )}
                                    >
                                    {num}
                                    </Badge>
                                </TableCell>
                            ))}
                            <TableCell className="text-center">
                                <Badge
                                    variant="default"
                                    className={cn(
                                        "font-mono text-lg font-bold h-8 w-8 flex items-center justify-center rounded-full shadow-lg",
                                        ticket.matches === Math.max(...rankedTickets.map(t => t.matches)) && ticket.matches > 0 && "bg-yellow-500 text-black",
                                    )}
                                >
                                    {ticket.matches}
                                </Badge>
                            </TableCell>
                        </TableRow>
                    ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={13} className="h-24 text-center text-muted-foreground">
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
