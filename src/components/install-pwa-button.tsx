
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
      // Previne o comportamento padrão do navegador
      e.preventDefault();
      // Guarda o evento para que possa ser acionado depois.
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      // Limpa o prompt após a instalação bem-sucedida.
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
    // Se o prompt de instalação estiver disponível, mostre-o.
    if (deferredPrompt) {
      deferredPrompt.prompt();
      // A lógica para limpar o prompt está no evento 'appinstalled'.
    } else {
      // Se o prompt não estiver disponível (ex: no iPhone ou se já foi dispensado),
      // não fazemos nada. O botão fica visível, mas o clique não tem efeito
      // para evitar confusão com mensagens de erro ou tutoriais.
       toast({
        title: "Instalação não disponível",
        description: "Seu navegador não suporta a instalação direta ou o app já foi instalado/ignorado. No iPhone, use 'Adicionar à Tela de Início' no menu de compartilhamento.",
        duration: 8000
      });
    }
  };
  
  // O botão agora é sempre renderizado. A lógica está no clique.
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
