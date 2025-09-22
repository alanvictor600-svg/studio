
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

  const getIsNumberMatched = (num: number, tempDrawnFrequency: Record<number, number>) => {
    if (tempDrawnFrequency[num] && tempDrawnFrequency[num] > 0) {
      tempDrawnFrequency[num]--;
      return true;
    }
    return false;
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
    
    // Flatten ticket numbers for the PDF body
    const body = rankedTickets.map(ticket => {
        const row = [
            ticket.buyerName || 'N/A',
            ticket.sellerUsername || '-',
            ...ticket.numbers.map(n => n.toString()),
            ticket.matches.toString()
        ];
        return row;
    });

    const head = [['Comprador', 'Vendedor', '1º', '2º', '3º', '4º', '5º', '6º', '7º', '8º', '9º', '10º', 'Acertos']];

    autoTable(doc, {
      startY: tableStartY,
      head: head,
      body: body,
      headStyles: { fillColor: [22, 163, 74] }, // Emerald-600
      didDrawCell: (data) => {
        if (data.cell.section === 'body') {
           const ticket = rankedTickets[data.row.index];
           const globalDrawnFreq = countOccurrences(draws.flatMap(d => d.numbers));

            // Style "Acertos" column
            if (data.column.index === head[0].length - 1) {
                const matches = parseInt(data.cell.text[0] || '0', 10);
                let topMatches: number[] = [];
                if (rankedTickets.length > 0) topMatches.push(rankedTickets[0].matches);
                if (rankedTickets.length > 1) topMatches.push(rankedTickets[1].matches);
                if (rankedTickets.length > 2) topMatches.push(rankedTickets[2].matches);
                
                let color: [number, number, number] | undefined;
                if (matches > 0 && matches === topMatches[0]) color = [255, 215, 0]; // Gold
                else if (matches > 0 && matches === topMatches[1]) color = [192, 192, 192]; // Silver
                else if (matches > 0 && matches === topMatches[2]) color = [205, 127, 50]; // Bronze
                
                if(color) {
                    doc.setFillColor(...color);
                    doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
                }
                 // Ensure text is drawn over the fill color
                doc.setTextColor(0, 0, 0);
                doc.text(data.cell.text[0], data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2, {
                    halign: 'center',
                    valign: 'middle'
                });
            }

             // Style number columns
            if (data.column.index >= 2 && data.column.index <= 11) {
                const num = parseInt(data.cell.text[0] || '0');
                // Create a temporary frequency map for this row's logic
                const tempRowDrawnFreq = {...globalDrawnFreq};
                
                let isMatched = false;
                // Account for duplicates in the ticket itself before this cell
                const ticketNumbersBeforeThis = ticket.numbers.slice(0, data.column.index - 2);
                ticketNumbersBeforeThis.forEach(n => {
                    if (tempRowDrawnFreq[n] > 0) {
                        tempRowDrawnFreq[n]--;
                    }
                });
                
                // Check if the current number is a match
                if (tempRowDrawnFreq[num] > 0) {
                   isMatched = true;
                }

                if (isMatched) {
                    doc.setTextColor(34, 197, 94); // Green-500
                    doc.setFont(doc.getFont().fontName, 'bold');
                } else {
                     doc.setTextColor(100);
                     doc.setFont(doc.getFont().fontName, 'normal');
                }
            }
        }
      },
      willDrawCell: (data) => {
        // Prevent default text rendering for the "Acertos" column, as we handle it customly
        if (data.cell.section === 'body' && data.column.index === head[0].length - 1) {
          return false; // Prevents jspdf from drawing the text, we'll draw it in didDrawCell
        }
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 'auto' },
        12: { halign: 'center', cellWidth: 15 },
         2: { halign: 'center', cellWidth: 10 },
         3: { halign: 'center', cellWidth: 10 },
         4: { halign: 'center', cellWidth: 10 },
         5: { halign: 'center', cellWidth: 10 },
         6: { halign: 'center', cellWidth: 10 },
         7: { halign: 'center', cellWidth: 10 },
         8: { halign: 'center', cellWidth: 10 },
         9: { halign: 'center', cellWidth: 10 },
        10: { halign: 'center', cellWidth: 10 },
        11: { halign: 'center', cellWidth: 10 },
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
            <Button onClick={handleDownloadPdf} variant="outline" size="sm" disabled={rankedTickets.length === 0}>
              <FileDown className="mr-2 h-4 w-4" /> Baixar PDF
            </Button>
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
                  rankedTickets.map((ticket) => {
                    const tempDrawnFrequency = { ...drawnNumbersFrequency };
                    return (
                        <TableRow key={ticket.id}>
                            <TableCell className="font-medium">{ticket.buyerName}</TableCell>
                            <TableCell>{ticket.sellerUsername || '-'}</TableCell>
                            {ticket.numbers.map((num, i) => {
                                const isMatched = getIsNumberMatched(num, tempDrawnFrequency);
                                return (
                                <TableCell key={i} className="text-center">
                                    <Badge
                                    variant={isMatched ? "default" : "outline"}
                                    className={cn(
                                        "font-mono text-xs w-7 h-7 flex items-center justify-center transition-colors",
                                        isMatched && "bg-green-500 text-white"
                                    )}
                                    >
                                    {num}
                                    </Badge>
                                </TableCell>
                                );
                            })}
                            <TableCell className="text-center">
                                <Badge
                                    variant="default"
                                    className="font-mono text-lg font-bold h-8 w-8 flex items-center justify-center rounded-full shadow-lg"
                                >
                                    {ticket.matches}
                                </Badge>
                            </TableCell>
                        </TableRow>
                    );
                  })
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
