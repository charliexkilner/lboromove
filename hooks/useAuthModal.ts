import { createContext, useContext } from 'react';

interface AuthModalContextType {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

export const AuthModalContext = createContext<AuthModalContextType>({
  isOpen: false,
  openModal: () => {},
  closeModal: () => {},
});

export const useAuthModal = () => useContext(AuthModalContext);
