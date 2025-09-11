
"use client";

import type { FC } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Coins } from 'lucide-react';

interface InsufficientCreditsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export const InsufficientCreditsDialog: FC<InsufficientCreditsDialogProps> = ({ isOpen, onOpenChange }) => {
  const router = useRouter();

  const handleRedirect = () => {
    router.push('/solicitar-creditos');
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Saldo Insuficiente!</AlertDialogTitle>
          <AlertDialogDescription>
            Você não possui créditos suficientes para realizar esta aposta. 
            Por favor, adquira mais créditos para continuar.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Fechar</AlertDialogCancel>
          <AlertDialogAction onClick={handleRedirect} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Coins className="mr-2 h-4 w-4" /> Solicitar Créditos
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
