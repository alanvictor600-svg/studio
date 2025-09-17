
"use client";

import type { FC } from 'react';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { useToast } from "@/hooks/use-toast";
import type { Ticket, LotteryConfig } from '@/types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Share2 } from 'lucide-react';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import html2canvas from 'html2canvas';
import { ScrollArea } from './ui/scroll-area';

interface TicketReceiptDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  tickets: Ticket[] | null;
  lotteryConfig: LotteryConfig;
}

const ReceiptContent: FC<{ tickets: Ticket[]; lotteryConfig: LotteryConfig }> = ({ tickets, lotteryConfig }) => (
  <div className="bg-white text-black font-mono p-6 max-w-sm mx-auto rounded-lg shadow-lg border-2 border-dashed border-gray-400">
    <div className="text-center mb-4">
      <Image src="/logo.png" alt="Logo" width={80} height={80} className="mx-auto" />
      <h2 className="text-2xl font-bold mt-2">Bolão Potiguar</h2>
      <p className="text-sm">Comprovante de Aposta</p>
    </div>

    {tickets.map((ticket, idx) => (
      <div key={ticket.id}>
        {idx > 0 && <Separator className="my-4 border-t-2 border-dashed bg-gray-400" />}
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span>Data/Hora:</span> <span>{format(parseISO(ticket.createdAt), "dd/MM/yy HH:mm", { locale: ptBR })}</span></div>
          <div className="flex justify-between"><span>Bilhete ID:</span> <span>#{ticket.id.substring(0, 8)}</span></div>
          {ticket.buyerName && (
            <div className="flex justify-between"><span>Comprador:</span> <span className="font-bold">{ticket.buyerName}</span></div>
          )}
          {ticket.sellerUsername && (
            <div className="flex justify-between"><span>Vendedor:</span> <span>{ticket.sellerUsername}</span></div>
          )}
        </div>

        <Separator className="my-4 border-dashed bg-gray-400" />

        <p className="text-center text-sm uppercase tracking-widest mb-2">Seus Números da Sorte</p>
        <div className="grid grid-cols-5 gap-2 text-center">
          {ticket.numbers.map((num, index) => (
            <span key={index} className="flex items-center justify-center h-10 w-10 rounded-md bg-gray-200 font-bold text-lg shadow-inner">
              {num.toString().padStart(2, '0')}
            </span>
          ))}
        </div>

        <Separator className="my-4 border-dashed bg-gray-400" />

        <div className="space-y-2 text-sm">
          <div className="flex justify-between font-bold text-base">
            <span>Valor Pago:</span>
            <span>R$ {lotteryConfig.ticketPrice.toFixed(2).replace('.', ',')}</span>
          </div>
        </div>
      </div>
    ))}
    
    <div className="text-center mt-6">
      <p className="font-bold text-sm">Boa Sorte! 🍀</p>
      <p className="text-xs mt-1">Guarde este comprovante.</p>
    </div>
  </div>
);


export const TicketReceiptDialog: FC<TicketReceiptDialogProps> = ({ isOpen, onOpenChange, tickets, lotteryConfig }) => {
  const { toast } = useToast();
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!tickets || tickets.length === 0) {
    return null;
  }

  const handleShare = async () => {
    if (!receiptRef.current) {
        toast({ title: 'Erro', description: 'Não foi possível gerar a imagem do comprovante.', variant: 'destructive' });
        return;
    }
    if (!navigator.share) {
        toast({ title: 'Não Suportado', description: 'Seu navegador não suporta o compartilhamento de imagens.', variant: 'destructive' });
        return;
    }

    try {
        const canvas = await html2canvas(receiptRef.current, { 
            useCORS: true, 
            backgroundColor: null 
        });
        canvas.toBlob(async (blob) => {
            if (!blob) {
                toast({ title: 'Erro', description: 'Falha ao converter comprovante para imagem.', variant: 'destructive' });
                return;
            }
            const file = new File([blob], 'comprovante.png', { type: 'image/png' });
            
            const buyerName = tickets[0]?.buyerName || 'cliente';

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'Comprovante de Aposta - Bolão Potiguar',
                    text: `Comprovante da aposta para ${buyerName}`,
                });
                toast({ title: 'Comprovante compartilhado!' });
            } else {
                 toast({ title: 'Não Suportado', description: 'Seu navegador não suporta o compartilhamento de imagens.', variant: 'destructive' });
            }
        }, 'image/png');

    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            toast({ title: "Compartilhamento cancelado", variant: "default" });
        } else {
            console.error('Erro ao gerar ou compartilhar imagem:', error);
            toast({ title: 'Ocorreu um erro ao compartilhar a imagem', variant: 'destructive' });
        }
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-primary">
            Comprovante Gerado
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] my-4">
            <div ref={receiptRef}>
                <ReceiptContent tickets={tickets} lotteryConfig={lotteryConfig} />
            </div>
        </ScrollArea>

        <DialogFooter className="sm:flex-col gap-3">
          <Button type="button" onClick={handleShare} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
             <Share2 className="mr-2 h-4 w-4" /> Compartilhar Imagem do Comprovante
          </Button>
          <DialogClose asChild>
            <Button type="button" variant="secondary" className="w-full">
              Fechar
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
