import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '../data/mockData';

export interface CartItem extends Product {
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotals: () => { subtotal: number; deliveryFee: number; platformFee: number; total: number };
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product) => {
        set((state) => {
          const existing = state.items.find((i) => i.id === product.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
              ),
            };
          }
          return { items: [...state.items, { ...product, quantity: 1 }] };
        });
      },
      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== productId),
        }));
      },
      updateQuantity: (productId, quantity) => {
        set((state) => ({
          items: quantity <= 0 
            ? state.items.filter((i) => i.id !== productId)
            : state.items.map((i) => (i.id === productId ? { ...i, quantity } : i)),
        }));
      },
      clearCart: () => set({ items: [] }),
      getTotals: () => {
        const { items } = get();
        const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const deliveryFee = subtotal > 0 ? 10 : 0;
        const platformFee = 0;
        return {
          subtotal,
          deliveryFee,
          platformFee,
          total: subtotal + deliveryFee + platformFee,
        };
      },
    }),
    {
      name: 'food-cart-storage',
    }
  )
);
