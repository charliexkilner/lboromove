import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const useFavorites = () => {
  const queryClient = useQueryClient();

  // Fetch favorites
  const { data: favorites = [] } = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const res = await fetch('/api/user/favorites');
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Add to favorites
  const addFavorite = useMutation({
    mutationFn: async (propertyId: number) => {
      const res = await fetch('/api/user/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId: propertyId.toString() }),
      });
      if (!res.ok) {
        throw new Error('Failed to add favorite');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  // Remove from favorites
  const removeFavorite = useMutation({
    mutationFn: async (propertyId: number) => {
      const res = await fetch(`/api/user/favorites?propertyId=${propertyId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        throw new Error('Failed to remove favorite');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  // Check if a property is favorited
  const isFavorite = (propertyId: number) => {
    return favorites.some((fav: any) => fav.id === propertyId);
  };

  return {
    favorites,
    addFavorite,
    removeFavorite,
    isFavorite,
  };
}; 