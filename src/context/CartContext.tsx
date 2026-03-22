'use client';

import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Product, BackingOption, CartItem } from '@/types/product';
import { backingOptions } from '@/data/products';
import { getPriceForQuantity } from '@/lib/utils';

interface CartState {
  items: CartItem[];
  isWholesale: boolean;
}

type CartAction =
  | { type: 'ADD_ITEM'; product: Product; quantity: number; backing: BackingOption }
  | { type: 'REMOVE_ITEM'; productId: string }
  | { type: 'UPDATE_QUANTITY'; productId: string; quantity: number }
  | { type: 'CLEAR' }
  | { type: 'SET_WHOLESALE'; isWholesale: boolean }
  | { type: 'HYDRATE'; items: CartItem[] };

function calculateUnitPrice(product: Product, quantity: number, backing: BackingOption, isWholesale: boolean): number {
  const basePrice = getPriceForQuantity(product.pricingTiers, quantity);
  if (!basePrice) return 0;
  const backingConfig = backingOptions.find((b) => b.id === backing);
  const multiplier = backingConfig?.priceMultiplier ?? 1.0;
  let price = Math.round(basePrice * multiplier);
  if (isWholesale) {
    price = Math.round(price * (1 - product.wholesaleDiscount));
  }
  return price;
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find((i) => i.product.id === action.product.id);
      if (existing) {
        const newQty = existing.quantity + action.quantity;
        const unitPrice = calculateUnitPrice(action.product, newQty, action.backing, state.isWholesale);
        return {
          ...state,
          items: state.items.map((i) =>
            i.product.id === action.product.id
              ? { ...i, quantity: newQty, selectedBacking: action.backing, unitPrice }
              : i
          ),
        };
      }
      const unitPrice = calculateUnitPrice(action.product, action.quantity, action.backing, state.isWholesale);
      return {
        ...state,
        items: [...state.items, { product: action.product, quantity: action.quantity, selectedBacking: action.backing, unitPrice }],
      };
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter((i) => i.product.id !== action.productId) };
    case 'UPDATE_QUANTITY': {
      return {
        ...state,
        items: state.items.map((i) => {
          if (i.product.id !== action.productId) return i;
          const unitPrice = calculateUnitPrice(i.product, action.quantity, i.selectedBacking, state.isWholesale);
          return { ...i, quantity: action.quantity, unitPrice };
        }),
      };
    }
    case 'CLEAR':
      return { ...state, items: [] };
    case 'SET_WHOLESALE': {
      return {
        ...state,
        isWholesale: action.isWholesale,
        items: state.items.map((i) => ({
          ...i,
          unitPrice: calculateUnitPrice(i.product, i.quantity, i.selectedBacking, action.isWholesale),
        })),
      };
    }
    case 'HYDRATE':
      return { ...state, items: action.items };
    default:
      return state;
  }
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity: number, backing: BackingOption) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setWholesale: (isWholesale: boolean) => void;
  itemCount: number;
  subtotal: number;
  setupFees: number;
  total: number;
  isWholesale: boolean;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], isWholesale: false });

  useEffect(() => {
    try {
      const saved = localStorage.getItem('cart');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          dispatch({ type: 'HYDRATE', items: parsed });
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(state.items));
  }, [state.items]);

  const itemCount = state.items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = state.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const uniqueProductIds = [...new Set(state.items.map((i) => i.product.id))];
  const setupFees = uniqueProductIds.reduce((sum, id) => {
    const item = state.items.find((i) => i.product.id === id);
    return sum + (item?.product.setupFee ?? 0);
  }, 0);
  const total = subtotal + setupFees;

  const value: CartContextType = {
    items: state.items,
    addItem: (product, quantity, backing) => dispatch({ type: 'ADD_ITEM', product, quantity, backing }),
    removeItem: (productId) => dispatch({ type: 'REMOVE_ITEM', productId }),
    updateQuantity: (productId, quantity) => dispatch({ type: 'UPDATE_QUANTITY', productId, quantity }),
    clearCart: () => dispatch({ type: 'CLEAR' }),
    setWholesale: (isWholesale) => dispatch({ type: 'SET_WHOLESALE', isWholesale }),
    itemCount,
    subtotal,
    setupFees,
    total,
    isWholesale: state.isWholesale,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
