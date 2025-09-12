
"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { User } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";

// Local storage keys
const AUTH_USERS_STORAGE_KEY = 'bolaoPotiguarAuthUsers';
const AUTH_CURRENT_USER_STORAGE_KEY = 'bolaoPotiguarAuthCurrentUser';

interface AuthContextType {
  currentUser: User | null;
  login: (username: string, passwordAttempt: string, expectedRole?: 'cliente' | 'vendedor' | 'admin') => Promise<boolean>;
  logout: () => void;
  register: (username: string, passwordRaw: string, role: 'cliente' | 'vendedor') => Promise<boolean>;
  isLoading: boolean;
  isAuthenticated: boolean;
  updateCurrentUserCredits: (newCredits: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  // Load users and current user from localStorage on initial mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedUsers = localStorage.getItem(AUTH_USERS_STORAGE_KEY);
        const storedCurrentUser = localStorage.getItem(AUTH_CURRENT_USER_STORAGE_KEY);
        
        let loadedUsers: User[] = storedUsers ? JSON.parse(storedUsers) : [];
        
        // Ensure the admin user exists
        const adminUserExists = loadedUsers.some(u => u.username === 'russo.victor600');
        if (!adminUserExists) {
            const adminUser: User = {
                id: uuidv4(),
                username: 'russo.victor600',
                passwordHash: 'Al@n2099', // Storing plain text for prototype simplicity
                role: 'admin',
                createdAt: new Date().toISOString(),
                saldo: 999999,
            };
            loadedUsers.push(adminUser);
            localStorage.setItem(AUTH_USERS_STORAGE_KEY, JSON.stringify(loadedUsers));
        }
        
        setUsers(loadedUsers);

        if (storedCurrentUser) {
          const user: User = JSON.parse(storedCurrentUser);
          // Re-validate that the stored current user still exists in the user list
          if (loadedUsers.some(u => u.id === user.id)) {
            setCurrentUser(user);
          } else {
            localStorage.removeItem(AUTH_CURRENT_USER_STORAGE_KEY);
          }
        }
      } catch (error) {
        console.error("Error accessing localStorage:", error);
      } finally {
        setIsLoading(false);
      }
    }
  }, []);

  const saveUsersToLocalStorage = (updatedUsers: User[]) => {
    setUsers(updatedUsers);
    localStorage.setItem(AUTH_USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
  };
  
  const saveCurrentUserToLocalStorage = (user: User | null) => {
    setCurrentUser(user);
    if (user) {
      localStorage.setItem(AUTH_CURRENT_USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_CURRENT_USER_STORAGE_KEY);
    }
  };

  const login = useCallback(async (username: string, passwordAttempt: string, expectedRole?: 'cliente' | 'vendedor' | 'admin'): Promise<boolean> => {
    const userToLogin = users.find(u => u.username.toLowerCase() === username.toLowerCase());

    if (!userToLogin) {
      toast({ title: "Erro de Login", description: "Usuário não encontrado.", variant: "destructive" });
      return false;
    }

    if (userToLogin.passwordHash !== passwordAttempt) {
      toast({ title: "Erro de Login", description: "Senha incorreta.", variant: "destructive" });
      return false;
    }

    if (expectedRole && userToLogin.role !== expectedRole) {
      toast({ title: "Acesso Negado", description: `Esta conta é de ${userToLogin.role}. Use o portal correto.`, variant: "destructive" });
      return false;
    }
    
    saveCurrentUserToLocalStorage(userToLogin);
    toast({ title: "Login bem-sucedido!", description: `Bem-vindo de volta, ${userToLogin.username}!`, className: "bg-primary text-primary-foreground", duration: 3000 });
    
    // Redirect after successful login
    let redirectPath = '/';
    if(userToLogin.role === 'admin') redirectPath = '/admin';
    else if(userToLogin.role === 'cliente') redirectPath = '/cliente';
    else if(userToLogin.role === 'vendedor') redirectPath = '/vendedor';
    router.push(redirectPath);
    
    return true;
  }, [users, router, toast]);

   const loginWithGoogle = async (): Promise<boolean> => {
     toast({ title: "Funcionalidade Indisponível", description: "Login com Google não está disponível na versão offline.", variant: "destructive" });
     return false;
   };

  const logout = useCallback(() => {
    saveCurrentUserToLocalStorage(null);
    toast({ title: "Logout realizado", description: "Até logo!", duration: 3000 });
    router.push('/');
  }, [router, toast]);

  const register = useCallback(async (username: string, passwordRaw: string, role: 'cliente' | 'vendedor'): Promise<boolean> => {
    const trimmedUsername = username.trim();
    if (users.some(u => u.username.toLowerCase() === trimmedUsername.toLowerCase())) {
      toast({ title: "Erro de Cadastro", description: "Nome de usuário já existe.", variant: "destructive" });
      return false;
    }

    const newUser: User = {
      id: uuidv4(),
      username: trimmedUsername,
      passwordHash: passwordRaw, // Storing plain text for prototype simplicity
      role,
      createdAt: new Date().toISOString(),
      saldo: role === 'cliente' ? 50 : 0, // Give new clients a starting balance
    };

    const updatedUsers = [...users, newUser];
    saveUsersToLocalStorage(updatedUsers);
    
    toast({ title: "Cadastro realizado!", description: "Você já pode fazer login.", className: "bg-primary text-primary-foreground", duration: 3000 });
    router.push('/login');
    return true;
  }, [users, router, toast]);

  const updateCurrentUserCredits = (newCredits: number) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, saldo: newCredits };
      const updatedUsers = users.map(u => u.id === currentUser.id ? updatedUser : u);
      saveUsersToLocalStorage(updatedUsers);
      saveCurrentUserToLocalStorage(updatedUser);
    }
  };

  const isAuthenticated = !isLoading && !!currentUser;
  
  const value = { currentUser, login, logout, register, isLoading, isAuthenticated, updateCurrentUserCredits, firebaseUser: null, loginWithGoogle };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
