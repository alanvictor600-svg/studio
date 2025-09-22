
"use client";

import type { FC } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, Medal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from './ui/avatar';

interface PublicRankingEntry {
  initials: string;
  matches: number;
  ticketId: string;
}

interface PublicRankingDisplayProps {
  ranking: PublicRankingEntry[];
}

export const PublicRankingDisplay: FC<PublicRankingDisplayProps> = ({ ranking }) => {

  if (!ranking || ranking.length === 0) {
    return (
      <Card className="h-full flex flex-col shadow-xl bg-card/80 backdrop-blur-sm">
        <CardHeader>
           <CardTitle className="text-2xl font-bold text-primary text-center flex items-center justify-center gap-2">
              <TrendingUp className="h-6 w-6" /> Ranking Geral
           </CardTitle>
            <CardDescription className="text-center">
              Acompanhe os bilhetes com mais acertos em tempo real.
           </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col items-center justify-center p-6 text-center">
          <p className="text-muted-foreground">Aguardando os primeiros acertos do ciclo para exibir o ranking.</p>
          <p className="text-xs text-muted-foreground/80 mt-1">Faça sua aposta e entre na disputa!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col shadow-xl bg-card/80 backdrop-blur-sm">
       <CardHeader>
           <CardTitle className="text-2xl font-bold text-primary text-center flex items-center justify-center gap-2">
              <TrendingUp className="h-6 w-6" /> Ranking Geral
           </CardTitle>
           <CardDescription className="text-center">
              Top 5 bilhetes com mais números sorteados no ciclo atual.
           </CardDescription>
        </CardHeader>
      <CardContent className="p-4 flex-grow">
        <div className="space-y-4">
            {ranking.map((ticket, index) => (
                <div key={ticket.ticketId} className={cn(
                    "flex items-center gap-4 p-3 rounded-lg shadow-sm transition-all",
                     index === 0 && "bg-yellow-400/20 border-2 border-yellow-500",
                     index === 1 && "bg-gray-400/20 border border-gray-500",
                     index === 2 && "bg-orange-600/20 border border-orange-700",
                     index > 2 && "bg-muted/50"
                )}>
                    <Medal className={cn(
                        "h-8 w-8",
                        index === 0 && "text-yellow-500",
                        index === 1 && "text-gray-500",
                        index === 2 && "text-orange-700",
                        index > 2 && "text-muted-foreground"
                    )} />
                    <Avatar className="h-10 w-10 border">
                        <AvatarFallback className={cn(
                             index === 0 && "bg-yellow-500/80 text-white",
                             index === 1 && "bg-gray-500/80 text-white",
                             index === 2 && "bg-orange-700/80 text-white",
                        )}>
                            {ticket.initials}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <p className="font-bold text-foreground truncate">
                           Apostador
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                            ID: #{ticket.ticketId}..
                        </p>
                    </div>
                     <Badge
                        variant="default"
                        className={cn(
                            "font-mono text-lg font-bold h-10 w-10 flex items-center justify-center rounded-full shadow-lg border-2",
                            "bg-primary text-primary-foreground"
                        )}
                    >
                        {ticket.matches}
                    </Badge>
                </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
};
