
"use client";

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Download, Share } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
  const [isIos, setIsIos] = useState(false);
  const [showIosInstructions, setShowIosInstructions] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Detecta se é iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIos(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
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
    // Se for iOS, sempre mostra as instruções
    if (isIos) {
      setShowIosInstructions(true);
      return;
    }

    // Se o prompt de instalação nativo estiver disponível, use-o
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      // O evento 'appinstalled' vai cuidar do resto.
      setDeferredPrompt(null);
      return;
    }

    // Fallback para outros dispositivos (ex: desktop sem prompt, navegadores não-chromium)
    // Para iOS, este caso já foi tratado acima, mas é um bom fallback.
    if (isIos) {
      setShowIosInstructions(true);
    } else {
        toast({
            title: "Instalação Manual",
            description: "Para instalar, procure a opção 'Adicionar à tela de início' ou 'Instalar App' no menu do seu navegador.",
            duration: 5000
        });
    }
  };
  
  return (
    <>
      <Button
        variant="secondary"
        onClick={handleInstallClick}
        aria-label="Instalar aplicativo"
      >
        <Download className="mr-2 h-4 w-4" />
        Instalar App
      </Button>

      <AlertDialog open={showIosInstructions} onOpenChange={setShowIosInstructions}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Instalar no iPhone/iPad</AlertDialogTitle>
            <AlertDialogDescription>
              Para adicionar o Bolão Potiguar à sua tela de início, siga estes passos:
              <ol className="list-decimal list-inside mt-4 space-y-2 text-left">
                <li>Toque no ícone de **Compartilhar** (<Share className="inline-block h-4 w-4" />) na barra de menu do Safari.</li>
                <li>Role para baixo e selecione **"Adicionar à Tela de Início"**.</li>
                <li>Confirme tocando em **"Adicionar"** no canto superior direito.</li>
              </ol>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowIosInstructions(false)}>Entendi</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
