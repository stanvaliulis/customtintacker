'use client';

import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Product, BackingOption, CartItem, PriceTier } from '@/types/product';
import { backingOptions } from '@/data/products';
import { getPriceForQuantity, getCatalogPriceForQuantity } from '@/lib/utils';

interface CartState {
  items: CartItem[];
  isDistributor: boolean;
  distributorDiscount: number;
}

type CartAction =
  | { type: 'ADD_ITEM'; product: Product; quantity: number; backing: BackingOption; priceTier: PriceTier; distributorDiscount: number; isRush?: boolean }
  | { type: 'REMOVE_ITEM'; productId: string }
  | { type: 'UPDATE_QUANTITY'; productId: string; quantity: number }
  | { type: 'UPDATE_RUSH'; productId: string; isRush: boolean }
  | { type: 'CLEAR' }
  | { type: 'SET_DISTRIBUTOR'; isDistributor: boolean; distributorDiscount: number }
  | { type: 'HYDRATE'; items: CartItem[] };

function calculateUnitPrice(
  product: Product,
  quantity: number,
  backing: BackingOption,
  priceTier: PriceTier,
  distributorDiscount: number
): number {
  const backingConfig = backingOptions.find((b) => b.id === backing);
  const multiplier = backingConfig?.priceMultiplier ?? 1.0;

  if (priceTier === 'distributor') {
    const catalogPrice = getCatalogPriceForQuantity(product.pricingTiers, quantity);
    if (!catalogPrice) return 0;
    const adjustedCatalog = Math.round(catalogPrice * multiplier);
    return Math.round(adjustedCatalog * (1 - distributorDiscount));
  }

  const basePrice = getPriceForQuantity(product.pricingTiers, quantity);
  if (!basePrice) return 0;
  return Math.round(basePrice * multiplier);
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const priceTier = action.priceTier;
      const discount = action.distributorDiscount;
      const isRush = action.isRush ?? false;
      const existing = state.items.find((i) => i.product.id === action.product.id);
      if (existing) {
        const newQty = existing.quantity + action.quantity;
        const unitPrice = calculateUnitPrice(action.product, newQty, action.backing, priceTier, discount);
        return {
          ...state,
          items: state.items.map((i) =>
            i.product.id === action.product.id
              ? { ...i, quantity: newQty, selectedBacking: action.backing, unitPrice, priceTier, isRush }
              : i
          ),
        };
      }
      const unitPrice = calculateUnitPrice(action.product, action.quantity, action.backing, priceTier, discount);
      return {
        ...state,
        items: [
          ...state.items,
          {
            product: action.product,
            quantity: action.quantity,
            selectedBacking: action.backing,
            unitPrice,
            priceTier,
            isRush,
          },
        ],
      };
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter((i) => i.product.id !== action.productId) };
    case 'UPDATE_QUANTITY': {
      return {
        ...state,
        items: state.items.map((i) => {
          if (i.product.id !== action.productId) return i;
          const unitPrice = calculateUnitPrice(
            i.product,
            action.quantity,
            i.selectedBacking,
            i.priceTier,
            state.distributorDiscount
          );
          return { ...i, quantity: action.quantity, unitPrice };
        }),
      };
    }
    case 'UPDATE_RUSH': {
      return {
        ...state,
        items: state.items.map((i) =>
          i.product.id === action.productId ? { ...i, isRush: action.isRush } : i
        ),
      };
    }
    case 'CLEAR':
      return { ...state, items: [] };
    case 'SET_DISTRIBUTOR': {
      const newPriceTier: PriceTier = action.isDistributor ? 'distributor' : 'retail';
      return {
        ...state,
        isDistributor: action.isDistributor,
        distributorDiscount: action.distributorDiscount,
        items: state.items.map((i) => ({
          ...i,
          priceTier: newPriceTier,
          unitPrice: calculateUnitPrice(
            i.product,
            i.quantity,
            i.selectedBacking,
            newPriceTier,
            action.distributorDiscount
          ),
        })),
      };
    }
    case 'HYDRATE':
      return { ...state, items: action.items };
    default:
      return state;
  }
}

/** Rush processing fee = 25% of item subtotal */
export const RUSH_FEE_RATE = 0.25;

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity: number, backing: BackingOption, priceTier?: PriceTier, isRush?: boolean) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateRush: (productId: string, isRush: boolean) => void;
  clearCart: () => void;
  setDistributor: (isDistributor: boolean, distributorDiscount: number) => void;
  /** @deprecated Use useDistributor() instead. Kept for backward compat. */
  setWholesale: (isWholesale: boolean) => void;
  itemCount: number;
  subtotal: number;
  rushFee: number;
  setupFees: number;
  total: number;
  isWholesale: boolean;
  isDistributor: boolean;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    isDistributor: false,
    distributorDiscount: 0.40,
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem('cart');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Ensure hydrated items have priceTier
          const items = parsed.map((item: CartItem) => ({
            ...item,
            priceTier: item.priceTier || 'retail',
          }));
          dispatch({ type: 'HYDRATE', items });
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(state.items));
  }, [state.items]);

  const itemCount = state.items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = state.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const rushFee = state.items.reduce((sum, i) => {
    if (!i.isRush) return sum;
    return sum + Math.round(i.unitPrice * i.quantity * RUSH_FEE_RATE);
  }, 0);
  const uniqueProductIds = [...new Set(state.items.map((i) => i.product.id))];
  const setupFees = uniqueProductIds.reduce((sum, id) => {
    const item = state.items.find((i) => i.product.id === id);
    return sum + (item?.product.setupFee ?? 0);
  }, 0);
  const total = subtotal + rushFee + setupFees;

  const value: CartContextType = {
    items: state.items,
    addItem: (product, quantity, backing, priceTier, isRush) =>
      dispatch({
        type: 'ADD_ITEM',
        product,
        quantity,
        backing,
        priceTier: priceTier || (state.isDistributor ? 'distributor' : 'retail'),
        distributorDiscount: state.distributorDiscount,
        isRush,
      }),
    removeItem: (productId) => dispatch({ type: 'REMOVE_ITEM', productId }),
    updateQuantity: (productId, quantity) => dispatch({ type: 'UPDATE_QUANTITY', productId, quantity }),
    updateRush: (productId, isRush) => dispatch({ type: 'UPDATE_RUSH', productId, isRush }),
    clearCart: () => dispatch({ type: 'CLEAR' }),
    setDistributor: (isDistributor, distributorDiscount) =>
      dispatch({ type: 'SET_DISTRIBUTOR', isDistributor, distributorDiscount }),
    setWholesale: (isWholesale) =>
      dispatch({ type: 'SET_DISTRIBUTOR', isDistributor: isWholesale, distributorDiscount: state.distributorDiscount }),
    itemCount,
    subtotal,
    rushFee,
    setupFees,
    total,
    isWholesale: state.isDistributor,
    isDistributor: state.isDistributor,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
