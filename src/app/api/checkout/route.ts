import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { env } from '@/lib/env';
import { backingOptions } from '@/data/products';
import { getAllProducts } from '@/lib/products';

export async function POST(req: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: 'Payments are not configured. Set STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.' },
        { status: 503 },
      );
    }

    const { items, customerEmail, isWholesale } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    const products = await getAllProducts();

    const lineItems = items.map((item: { productId: string; quantity: number; backingId: string }) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) throw new Error(`Product not found: ${item.productId}`);

      const tier = product.pricingTiers.find(
        (t) => item.quantity >= t.minQuantity && (t.maxQuantity === null || item.quantity <= t.maxQuantity)
      );
      if (!tier) throw new Error(`No pricing tier for qty ${item.quantity}`);

      const backing = backingOptions.find((b) => b.id === item.backingId);
      const multiplier = backing?.priceMultiplier ?? 1.0;
      let unitPrice = Math.round(tier.pricePerUnit * multiplier);

      if (isWholesale) {
        unitPrice = Math.round(unitPrice * (1 - product.wholesaleDiscount));
      }

      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: product.name,
            description: `${product.dimensions.displaySize} - ${backing?.label || 'Standard'}`,
          },
          unit_amount: unitPrice,
        },
        quantity: item.quantity,
      };
    });

    // Add setup fees
    const uniqueProductIds = [...new Set(items.map((i: { productId: string }) => i.productId))];
    for (const pid of uniqueProductIds) {
      const product = products.find((p) => p.id === pid);
      if (product && product.setupFee > 0) {
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Setup Fee - ${product.name}`,
              description: 'One-time design setup and plate charge',
            },
            unit_amount: product.setupFee,
          },
          quantity: 1,
        });
      }
    }

    const siteUrl = env.site.url;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/cart`,
      ...(customerEmail ? { customer_email: customerEmail } : {}),
      metadata: {
        isWholesale: isWholesale ? 'true' : 'false',
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Checkout failed' },
      { status: 500 }
    );
  }
}
