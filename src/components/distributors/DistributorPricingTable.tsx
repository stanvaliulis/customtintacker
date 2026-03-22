import { PricingTier } from '@/types/product';
import { formatPrice } from '@/lib/utils';

interface DistributorPricingTableProps {
  productName: string;
  pricingTiers: PricingTier[];
  discountPercent: number;
}

export default function DistributorPricingTable({
  productName,
  pricingTiers,
  discountPercent,
}: DistributorPricingTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200">
      <div className="bg-gray-900 px-6 py-4">
        <h3 className="text-lg font-semibold text-white">{productName}</h3>
        <p className="text-sm text-gray-400">
          Distributor discount: <span className="text-amber-400 font-semibold">{discountPercent}% off</span> retail pricing
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-6 py-3 font-semibold text-gray-700">Quantity</th>
              <th className="text-center px-6 py-3 font-semibold text-gray-700">Retail Price</th>
              <th className="text-center px-6 py-3 font-semibold text-gray-700">Distributor Price</th>
              <th className="text-center px-6 py-3 font-semibold text-gray-700">You Save</th>
            </tr>
          </thead>
          <tbody>
            {pricingTiers.map((tier, idx) => {
              const retailPrice = tier.pricePerUnit;
              const distributorPrice = Math.round(retailPrice * (1 - discountPercent / 100));
              const savings = retailPrice - distributorPrice;
              const quantityLabel = tier.maxQuantity
                ? `${tier.minQuantity} - ${tier.maxQuantity}`
                : `${tier.minQuantity}+`;

              return (
                <tr
                  key={idx}
                  className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                >
                  <td className="px-6 py-3 font-medium text-gray-900">
                    {quantityLabel}
                  </td>
                  <td className="px-6 py-3 text-center">
                    <span className="text-amber-700 line-through">
                      {formatPrice(retailPrice)}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <span className="text-green-700 font-semibold">
                      {formatPrice(distributorPrice)}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                      Save {formatPrice(savings)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
