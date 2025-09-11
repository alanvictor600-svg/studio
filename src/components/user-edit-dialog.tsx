
"use client";

import { useState, useEffect, type FC } from 'react';
import type { User } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { DollarSign } from 'lucide-react';

interface UserEditDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  user: User | null;
  onSave: (updatedUser: User) => void;
  onClose: () => void;
}

export const UserEditDialog: FC<UserEditDialogProps> = ({
  isOpen,
  onOpenChange,
  user,
  onSave,
  onClose,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'cliente' | 'vendedor'>('cliente');
  const [creditsToAdd, setCreditsToAdd] = useState<number | ''>('');
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && user) {
      setUsername(user.username);
      setRole(user.role);
      setPassword(''); // Reset password field on open
      setCreditsToAdd(''); // Reset credits field
    }
  }, [isOpen, user]);

  if (!user) {
    return null;
  }

  const handleSave = () => {
    if (!username.trim()) {
      toast({ title: 'Erro de Validação', description: 'O nome de usuário não pode estar vazio.', variant: 'destructive' });
      return;
    }
    
    const creditsChange = Number(creditsToAdd);
    if(isNaN(creditsChange)) {
      toast({ title: 'Erro de Validação', description: 'O valor dos créditos é inválido.', variant: 'destructive' });
      return;
    }

    const updatedUser: User = {
      ...user,
      username: username.trim(),
      role: role,
      passwordHash: password.trim() ? password.trim() : user.passwordHash,
      credits: (user.credits || 0) + creditsChange,
    };
    onSave(updatedUser);
  };
  
  const handleDialogClose = (open: boolean) => {
    if (!open) {
      onClose();
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
          <DialogDescription>
            Faça alterações nos dados do usuário aqui. Clique em salvar quando terminar.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">
              Usuário
            </Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="password" className="text-right">
              Nova Senha
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="col-span-3"
              placeholder="Deixe em branco para manter a atual"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Perfil</Label>
            <RadioGroup
              value={role}
              onValueChange={(value) => setRole(value as 'cliente' | 'vendedor')}
              className="col-span-3 flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cliente" id="role-cliente" />
                <Label htmlFor="role-cliente">Cliente</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="vendedor" id="role-vendedor" />
                <Label htmlFor="role-vendedor">Vendedor</Label>
              </div>
            </RadioGroup>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="credits" className="text-right flex flex-col items-end">
                <span>Créditos</span>
                <span className="text-xs text-muted-foreground">(+/-)</span>
            </Label>
            <div className="relative col-span-3">
              <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="credits"
                type="number"
                value={creditsToAdd}
                onChange={(e) => setCreditsToAdd(e.target.value === '' ? '' : Number(e.target.value))}
                className="pl-9"
                placeholder="Ex: 50 para adicionar, -10 para remover"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Cancelar
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleSave}>
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
