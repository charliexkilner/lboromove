import React, { createContext, useContext, useState } from 'react';
import { useSession } from 'next-auth/react';
import AuthModal from '@/components/AuthModal';
import { AuthModalContext } from '@/hooks/useAuthModal';

interface AuthContextType {
  showAuthModal: () => void;
  hideAuthModal: () => void;
  isAuthModalOpen: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { data: session } = useSession();

  const showAuthModal = () => setIsAuthModalOpen(true);
  const hideAuthModal = () => setIsAuthModalOpen(false);

  return (
    <AuthContext.Provider
      value={{ showAuthModal, hideAuthModal, isAuthModalOpen }}
    >
      <AuthModalContext.Provider
        value={{
          isOpen: isAuthModalOpen,
          openModal: showAuthModal,
          closeModal: hideAuthModal,
        }}
      >
        {children}
        <AuthModal />
      </AuthModalContext.Provider>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
