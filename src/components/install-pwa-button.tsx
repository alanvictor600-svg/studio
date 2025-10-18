
"use client";

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Define a interface para o evento 'beforeinstallprompt'
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function InstallPwaButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Previne o mini-infobar do Chrome em dispositivos móveis
      e.preventDefault();
      // Guarda o evento para que possa ser acionado depois.
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      // Limpa o prompt para que não possa ser acionado novamente.
      setDeferredPrompt(null);
      toast({
        title: "App Instalado!",
        description: "O Bolão Potiguar foi adicionado à sua tela inicial.",
        className: "bg-primary text-primary-foreground",
      });
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [toast]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Este caso não deveria acontecer se o botão não for renderizado.
      return;
    }
    // Mostra o prompt de instalação
    deferredPrompt.prompt();
    // Espera o usuário responder ao prompt
    await deferredPrompt.userChoice;
    // O evento appinstalled cuidará de limpar o deferredPrompt.
  };
  
  // Só renderiza o botão se o prompt de instalação estiver disponível.
  // Isso esconde o botão no iOS e outros navegadores não compatíveis.
  if (!deferredPrompt) {
    return null;
  }
  
  return (
    <Button
      variant="secondary"
      onClick={handleInstallClick}
      aria-label="Instalar aplicativo"
    >
      <Download className="mr-2 h-4 w-4" />
      Instalar App
    </Button>
  );
}
