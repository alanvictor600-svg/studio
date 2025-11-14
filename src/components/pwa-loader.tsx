
"use client";

import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export function PWALoader() {
  const { toast } = useToast();

  useEffect(() => {
    // O código dentro do useEffect só roda no cliente, após o componente ser montado.
    // A tentativa de registro do Service Worker foi desativada para evitar conflitos
    // com o carregamento do Next.js, que estava causando "client-side exceptions".
    // A funcionalidade de instalação do PWA via manifest.json continua funcionando.
    if ('serviceWorker' in navigator) {
      // console.log("Service Worker API is available.");
    }
  }, [toast]); // A dependência [toast] garante que a função não seja recriada desnecessariamente.

  return null; // This component does not render anything.
}
