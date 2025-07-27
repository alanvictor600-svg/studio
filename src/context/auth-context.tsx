
"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { User } from '@/types';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from 'uuid';

const AUTH_USERS_STORAGE_KEY = 'bolaoPotiguarAuthUsers';
const AUTH_CURRENT_USER_STORAGE_KEY = 'bolaoPotiguarAuthCurrentUser';

interface AuthContextType {
  currentUser: User | null;
  login: (username: string, passwordAttempt: string, expectedRole?: 'cliente' | 'vendedor') => Promise<boolean>;
  logout: () => void;
  register: (username: string, passwordRaw: string, role: 'cliente' | 'vendedor') => Promise<boolean>;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedUsersRaw = localStorage.getItem(AUTH_USERS_STORAGE_KEY);
      const localUsers = storedUsersRaw ? JSON.parse(storedUsersRaw) : [];
      setUsers(localUsers);

      const storedCurrentUserUsername = localStorage.getItem(AUTH_CURRENT_USER_STORAGE_KEY);
      if (storedCurrentUserUsername) {
        const foundUser = localUsers.find((u: User) => u.username === storedCurrentUserUsername);
        setCurrentUser(foundUser || null);
        if (!foundUser) {
            localStorage.removeItem(AUTH_CURRENT_USER_STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error("Failed to load auth data from localStorage", error);
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Persist users to localStorage whenever the list changes, but not on initial load.
    if (!isLoading) {
      localStorage.setItem(AUTH_USERS_STORAGE_KEY, JSON.stringify(users));
    }
  }, [users, isLoading]);

  const login = useCallback(async (username: string, passwordAttempt: string, expectedRole?: 'cliente' | 'vendedor'): Promise<boolean> => {
    const userToLogin = users.find(u => u.username === username);
    
    if (!userToLogin) {
      toast({ title: "Erro de Login", description: "Usuário não encontrado.", variant: "destructive" });
      return false;
    }
    
    if (expectedRole && userToLogin.role !== expectedRole) {
      toast({ title: "Acesso Negado", description: `Esta conta é de ${userToLogin.role}. Use o portal correto.`, variant: "destructive" });
      return false;
    }

    if (userToLogin.passwordHash === passwordAttempt) { 
      setCurrentUser(userToLogin);
      localStorage.setItem(AUTH_CURRENT_USER_STORAGE_KEY, userToLogin.username);
      toast({ title: "Login bem-sucedido!", description: `Bem-vindo de volta, ${username}!`, className: "bg-primary text-primary-foreground" });
      
      const redirectPath = userToLogin.role === 'cliente' ? '/cliente' : '/vendedor';
      router.push(redirectPath);
      return true;
    } else {
      toast({ title: "Erro de Login", description: "Senha incorreta.", variant: "destructive" });
      return false;
    }
  }, [users, router, toast]);

  const register = useCallback(async (username: string, passwordRaw: string, role: 'cliente' | 'vendedor'): Promise<boolean> => {
    if (users.some(u => u.username === username)) {
      toast({ title: "Erro de Cadastro", description: "Nome de usuário já existe.", variant: "destructive" });
      return false;
    }

    const newUser: User = {
      id: uuidv4(),
      username,
      passwordHash: passwordRaw,
      role,
      createdAt: new Date().toISOString(),
    };
    
    setUsers(prevUsers => [...prevUsers, newUser]);

    toast({ title: "Cadastro realizado!", description: "Você já pode fazer login.", className: "bg-primary text-primary-foreground" });
    router.push('/login');
    return true;
  }, [users, router, toast]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem(AUTH_CURRENT_USER_STORAGE_KEY);
    toast({ title: "Logout realizado", description: "Até logo!" });
    router.push('/');
  }, [router, toast]);

  const isAuthenticated = !isLoading && !!currentUser;
  
  const value = { currentUser, login, logout, register, isLoading, isAuthenticated };

  // Render children only after client-side hydration and loading is complete
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <p className="text-foreground text-xl">Carregando sistema de autenticação...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

    