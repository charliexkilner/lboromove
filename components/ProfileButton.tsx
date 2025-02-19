import { useAuthModal } from '@/hooks/useAuthModal';
import { useSession } from 'next-auth/react';

export default function ProfileButton() {
  const { data: session } = useSession();
  const { openModal } = useAuthModal();

  return (
    <button onClick={() => !session && openModal()} className="...">
      {/* Your profile button content */}
    </button>
  );
}
