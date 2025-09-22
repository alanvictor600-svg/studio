
"use client";

import { useMemo, type FC } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, FileDown } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { RankedTicket, Draw } from '@/types';
import { cn } from '@/lib/utils';
import { countOccurrences } from '@/lib/lottery-utils';
import { Button } from '@/components/ui/button';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  
  const handleDownloadPdf = () => {
    const doc = new jsPDF();
    const tableStartY = 35;

    doc.setFontSize(18);
    doc.text("Ranking do Ciclo - Bolão Potiguar", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    const date = format(new Date(), "'Gerado em' dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    doc.text(date, 14, 30);
    
    const body = rankedTickets.map(ticket => ({
      buyer: ticket.buyerName || 'N/A',
      numbers: getProcessedTicketNumbers(ticket), // Pass processed numbers
      matches: ticket.matches.toString(),
    }));

    autoTable(doc, {
      startY: tableStartY,
      head: [['Comprador', 'Números do Bilhete', 'Acertos']],
      body: body.map(row => [row.buyer, row.numbers.map(n => n.numberValue).join(', '), row.matches]),
      headStyles: { fillColor: [22, 163, 74] }, // Emerald-600
      didDrawCell: (data) => {
        // Style "Acertos" column
        if (data.column.index === 2 && data.cell.section === 'body') {
            const matches = parseInt(data.cell.text[0] || '0', 10);
            let topMatches: number[] = [];
            if (rankedTickets.length > 0) topMatches.push(rankedTickets[0].matches);
            if (rankedTickets.length > 1) topMatches.push(rankedTickets[1].matches);
            if (rankedTickets.length > 2) topMatches.push(rankedTickets[2].matches);
            
            let color: [number, number, number] | undefined;
            if (matches === topMatches[0] && matches > 0) color = [255, 215, 0]; // Gold
            else if (matches === topMatches[1] && matches > 0) color = [192, 192, 192]; // Silver
            else if (matches === topMatches[2] && matches > 0) color = [205, 127, 50]; // Bronze
            
            if(color) {
                 doc.setFillColor(...color);
                 doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
            }
        }
        
        // Custom draw for "Números do Bilhete" column
        if (data.column.index === 1 && data.cell.section === 'body') {
          const ticketData = body[data.row.index];
          if (ticketData) {
            const processedNumbers = ticketData.numbers;
            const cellPadding = 2;
            let currentX = data.cell.x + cellPadding;
            const currentY = data.cell.y + data.cell.height / 2 + 3; // Vertically center

            processedNumbers.forEach((num, index) => {
              const text = num.numberValue.toString() + (index < processedNumbers.length - 1 ? ', ' : '');
              
              if (num.isMatched) {
                doc.setTextColor(34, 197, 94); // Green-500
              } else {
                doc.setTextColor(0, 0, 0); // Black
              }
              
              doc.text(text, currentX, currentY);
              currentX += doc.getStringUnitWidth(text) * (doc.getFontSize() / doc.internal.scaleFactor);
            });
            doc.setTextColor(0, 0, 0); // Reset text color
          }
        }
      },
      columnStyles: {
        2: { halign: 'center' },
      }
    });
    
    doc.save(`ranking-ciclo-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

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
            <Button onClick={handleDownloadPdf} variant="outline" size="sm">
              <FileDown className="mr-2 h-4 w-4" /> Baixar PDF
            </Button>
          </div>
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
