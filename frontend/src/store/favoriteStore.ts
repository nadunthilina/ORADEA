import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '../data/mockData';
import { useState, useEffect } from 'react';

const getCurrentUserId = () => {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.email || user.id || 'guest';
      } catch (e) {
        return 'guest';
      }
    }
  }
  return 'guest';
};

interface FavoriteState {
  favoritesByUser: Record<string, Product[]>;
  addFavorite: (product: Product) => void;
  removeFavorite: (productId: string) => void;
}

export const useFavoriteStore = create<FavoriteState>()(
  persist(
    (set, get) => ({
      favoritesByUser: {},
      addFavorite: (product) => {
        const userId = getCurrentUserId();
        set((state) => {
          const userFavs = state.favoritesByUser[userId] || [];
          if (userFavs.some((p) => p.id === product.id)) {
            return state;
          }
          return {
            favoritesByUser: {
              ...state.favoritesByUser,
              [userId]: [...userFavs, product]
            }
          };
        });
      },
      removeFavorite: (productId) => {
        const userId = getCurrentUserId();
        set((state) => {
          const userFavs = state.favoritesByUser[userId] || [];
          return {
            favoritesByUser: {
              ...state.favoritesByUser,
              [userId]: userFavs.filter((p) => p.id !== productId)
            }
          };
        });
      }
    }),
    {
      name: 'food-favorite-storage-v2',
    }
  )
);

export function useUserFavorites() {
  const [userId, setUserId] = useState('guest');
  const store = useFavoriteStore();
  
  useEffect(() => {
    setUserId(getCurrentUserId());
  }, []);

  const favorites = store.favoritesByUser[userId] || [];
  
  const isFavorite = (productId: string) => {
    return favorites.some(p => p.id === productId);
  };

  return {
    favorites,
    isFavorite,
    addFavorite: store.addFavorite,
    removeFavorite: store.removeFavorite
  };
}
