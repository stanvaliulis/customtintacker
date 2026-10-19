'use client';

import type { ProofAttachment } from '@/lib/design/proof-attachment';
import { createContext, useContext, useReducer, useEffect, useState, useRef, ReactNode } from 'react';
import { Product, BackingOption, CartItem, PriceTier } from '@/types/product';
import { backingOptions, products } from '@/data/products';
import {readCart} from '@/lib/design/cart-storage';
import { getPriceForQuantity, getResellerUnitPrice } from '@/lib/utils';

interface CartState {
  items: CartItem[];
  isDistributor: boolean;
  distributorDiscount: number;
}

type CartAction =
  | { type: 'ATTACH_GUIDED'; product: Product; attachment: ProofAttachment }
  | { type: 'ADD_ITEM'; product: Product; quantity: number; backing: BackingOption; priceTier: PriceTier; distributorDiscount: number; isRush?: boolean }
  | { type: 'REMOVE_ITEM'; productId: string }
  | { type: 'UPDATE_QUANTITY'; productId: string; quantity: number }
  | { type: 'UPDATE_RUSH'; productId: string; isRush: boolean }
  | { type: 'ATTACH_DESIGN'; productId: string; attachment: ProofAttachment }
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
    const tier = product.pricingTiers.find(
      (t) => quantity >= t.minQuantity && (t.maxQuantity === null || quantity <= t.maxQuantity)
    );
    if (!tier) return 0;
    return getResellerUnitPrice(tier, multiplier, distributorDiscount);
  }

  const basePrice = getPriceForQuantity(product.pricingTiers, quantity);
  if (!basePrice) return 0;
  return Math.round(basePrice * multiplier);
}

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ATTACH_GUIDED': {
      const {product,attachment}=action;
      if(attachment.productId!==product.id||attachment.workflow!=='upload'||attachment.reviewStatus!=='unapproved')return state;
      const existing=state.items.find(i=>i.product.id===product.id);
      if(existing)return {...state,items:state.items.map(i=>i.product.id===product.id?{...i,designId:attachment.designId,proofAttachment:attachment}:i)};
      const quantity=product.minimumOrder,backing=product.backingOptions[0],priceTier=state.isDistributor?'distributor':'retail';
      if(!Number.isInteger(quantity)||quantity<1||!backing)return state;
      return {...state,items:[...state.items,{product,quantity,selectedBacking:backing,priceTier,unitPrice:calculateUnitPrice(product,quantity,backing,priceTier,state.distributorDiscount),designId:attachment.designId,proofAttachment:attachment}]};
    }
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
    case 'ATTACH_DESIGN':
      if (action.attachment.productId !== action.productId) return state;
      return { ...state, items: state.items.map(i => i.product.id === action.productId ? {...i, designId: action.attachment.designId, proofAttachment: action.attachment} : i) };
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
  attachGuided: (product: Product, attachment: ProofAttachment) => void;
  items: CartItem[];
  addItem: (product: Product, quantity: number, backing: BackingOption, priceTier?: PriceTier, isRush?: boolean) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateRush: (productId: string, isRush: boolean) => void;
  attachDesign: (productId: string, attachment: ProofAttachment) => void;
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
  const [hydrated,setHydrated]=useState(false);
  const [storageError,setStorageError]=useState('');
  const preserveStoredCart=useRef(false);
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    isDistributor: false,
    distributorDiscount: 0.40,
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem('cart');
      if (saved) {
        dispatch({type:'HYDRATE',items:readCart(saved,products)});
      }
    } catch {preserveStoredCart.current=true;setStorageError('The saved cart could not be restored. Its stored copy has been kept. Changes in this tab will not be saved; keep your artwork recovery packets.');} finally {setHydrated(true);}
  }, []);

  useEffect(() => {
    if(hydrated&&!preserveStoredCart.current)try{localStorage.setItem('cart', JSON.stringify(state.items));setStorageError('');}catch{setStorageError('Cart storage is unavailable or full. Changes may be lost when this tab closes. Keep your artwork recovery packets.');}
  }, [state.items,hydrated]);

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
    attachGuided: (product,attachment)=>dispatch({type:'ATTACH_GUIDED',product,attachment}),
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
    attachDesign: (productId, attachment) => dispatch({ type: 'ATTACH_DESIGN', productId, attachment }),
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

  return <CartContext.Provider value={value}>{storageError&&<p role="alert" className="bg-amber-50 text-amber-950 border p-4">{storageError}</p>}{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
export function useOptionalCart(){return useContext(CartContext);}
