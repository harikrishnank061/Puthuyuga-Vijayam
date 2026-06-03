'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getCurrentCitizen, setCurrentCitizen, clearCurrentCitizen, isAdminLoggedIn } from './db';
import type { Citizen } from './db';

interface AuthContextType {
  // Citizen auth
  currentCitizen: Citizen | null;
  isLoadingCitizen: boolean;
  loginCitizen: (citizen: Citizen) => void;
  logoutCitizen: () => void;
  
  // Admin auth
  isAdminLoggedIn: boolean;
  isLoadingAdmin: boolean;
  loginAdmin: (username: string, password: string) => boolean;
  logoutAdmin: () => void;
  
  // Navigation
  userRole: 'citizen' | 'admin' | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentCitizen, setCurrentCitizenState] = useState<Citizen | null>(null);
  const [isAdminLoggedInState, setIsAdminLoggedInState] = useState(false);
  const [isLoadingCitizen, setIsLoadingCitizen] = useState(true);
  const [isLoadingAdmin, setIsLoadingAdmin] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    // Load citizen session
    const citizen = getCurrentCitizen();
    setCurrentCitizenState(citizen);
    setIsLoadingCitizen(false);

    // Load admin session
    const adminLoggedIn = isAdminLoggedIn();
    setIsAdminLoggedInState(adminLoggedIn);
    setIsLoadingAdmin(false);
  }, []);

  const loginCitizen = (citizen: Citizen) => {
    setCurrentCitizenState(citizen);
    setCurrentCitizen(citizen);
  };

  const logoutCitizen = () => {
    setCurrentCitizenState(null);
    clearCurrentCitizen();
  };

  const loginAdmin = (username: string, password: string): boolean => {
    // Fixed admin credentials
    const isValid = username === 'ADMIN' && password === 'ADMIN123';
    if (isValid) {
      setIsAdminLoggedInState(true);
      localStorage.setItem('fix-my-street-current-admin', JSON.stringify({ loggedIn: true }));
    }
    return isValid;
  };

  const logoutAdmin = () => {
    setIsAdminLoggedInState(false);
    localStorage.removeItem('fix-my-street-current-admin');
  };

  const userRole = isAdminLoggedInState ? 'admin' : currentCitizen ? 'citizen' : null;

  const value: AuthContextType = {
    currentCitizen,
    isLoadingCitizen,
    loginCitizen,
    logoutCitizen,
    isAdminLoggedIn: isAdminLoggedInState,
    isLoadingAdmin,
    loginAdmin,
    logoutAdmin,
    userRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
