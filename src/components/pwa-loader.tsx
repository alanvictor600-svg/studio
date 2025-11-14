
"use client";

import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export function PWALoader() {
  const { toast } = useToast();

  useEffect(() => {
    // O código dentro do useEffect só roda no cliente, após o componente ser montado.
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
          // O registro foi bem-sucedido
          // console.log('SW registered: ', registration);
        }).catch(registrationError => {
          console.error('SW registration failed: ', registrationError);
          toast({
            title: "Erro de Instalação",
            description: "Não foi possível inicializar o modo de aplicativo. Funcionalidades offline podem não estar disponíveis.",
            variant: "destructive",
          });
        });
      });
    }
  }, [toast]); // A dependência [toast] garante que a função não seja recriada desnecessariamente.

  return null; // This component does not render anything.
}
