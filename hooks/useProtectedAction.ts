import { useSession } from 'next-auth/react';
import { useAuth } from '../contexts/AuthContext';

export function useProtectedAction() {
  const { data: session } = useSession();
  const { showAuthModal } = useAuth();

  const runProtectedAction = (action: () => void) => {
    if (!session) {
      showAuthModal();
      return;
    }
    action();
  };

  return runProtectedAction;
}
