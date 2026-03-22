'use client';

import { CartItem as CartItemType } from '@/types/product';
import { backingOptions } from '@/data/products';
import { formatPrice } from '@/lib/utils';
import { useCart } from '@/context/CartContext';
import QuantitySelector from './QuantitySelector';
import { Trash2 } from 'lucide-react';

interface CartItemProps {
  item: CartItemType;
}

export default function CartItemRow({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCart();
  const backingConfig = backingOptions.find((b) => b.id === item.selectedBacking);

  return (
    <div className="flex gap-4 py-4 border-b border-gray-100">
      <div className="w-20 h-20 bg-gray-100 rounded-lg shrink-0 flex items-center justify-center">
        <span className="text-sm font-bold text-gray-400">
          {item.product.dimensions.displaySize.split('"')[0]}&quot;
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-900 truncate">{item.product.name}</h3>
        <p className="text-sm text-gray-500">{backingConfig?.label}</p>
        <p className="text-sm text-gray-500">{formatPrice(item.unitPrice)}/unit</p>
        <div className="flex items-center gap-3 mt-2">
          <QuantitySelector
            quantity={item.quantity}
            min={item.product.minimumOrder}
            onChange={(qty) => updateQuantity(item.product.id, qty)}
          />
          <button
            onClick={() => removeItem(item.product.id)}
            className="text-red-400 hover:text-red-600 p-1"
            aria-label="Remove item"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="font-semibold text-gray-900">{formatPrice(item.unitPrice * item.quantity)}</p>
      </div>
    </div>
  );
}
