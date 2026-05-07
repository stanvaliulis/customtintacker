import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { env } from '@/lib/env';
import { backingOptions } from '@/data/products';
import { getAllProducts } from '@/lib/products';
import { detectSpam, rateLimit } from '@/lib/spam-protection';

interface CartItem {
  productId: string;
  quantity: number;
  backingId: string;
  priceTier: 'retail' | 'distributor';
  isRush?: boolean;
}

interface CheckoutBody {
  items: CartItem[];
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  company?: string;
  shippingAddress?: string;
  city?: string;
  state?: string;
  zip?: string;
  notes?: string;
  isDistributor?: boolean;
  distributorDiscount?: number;
}

const RUSH_FEE_RATE = 0.25;

export async function POST(req: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: 'Payments are not configured.' },
        { status: 503 },
      );
    }

    const rateLimited = rateLimit(req);
    if (rateLimited) return rateLimited;

    const body: CheckoutBody = await req.json();

    const spamDetected = detectSpam(body as unknown as Record<string, unknown>);
    if (spamDetected) return spamDetected;

    const { items, customerEmail, customerName, customerPhone, company,
            shippingAddress, city, state, zip, notes,
            isDistributor, distributorDiscount = 0.40 } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty.' }, { status: 400 });
    }

    const products = await getAllProducts();
    const lineItems: {
      price_data: {
        currency: string;
        product_data: { name: string; description: string };
        unit_amount: number;
      };
      quantity: number;
    }[] = [];

    // Build line items for each cart item
    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        return NextResponse.json({ error: `Product not found: ${item.productId}` }, { status: 400 });
      }

      const tier = product.pricingTiers.find(
        (t) => item.quantity >= t.minQuantity && (t.maxQuantity === null || item.quantity <= t.maxQuantity)
      );
      if (!tier) {
        return NextResponse.json({ error: `No pricing tier for qty ${item.quantity}` }, { status: 400 });
      }

      const backing = backingOptions.find((b) => b.id === item.backingId);
      const multiplier = backing?.priceMultiplier ?? 1.0;

      let unitPrice: number;
      if (isDistributor && item.priceTier === 'distributor') {
        const catalogPrice = Math.round(tier.catalogPrice * multiplier);
        unitPrice = Math.round(catalogPrice * (1 - distributorDiscount));
      } else {
        unitPrice = Math.round(tier.pricePerUnit * multiplier);
      }

      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: product.name,
            description: `${product.dimensions.displaySize} — ${backing?.label || 'Standard .024" Aluminum'}`,
          },
          unit_amount: unitPrice,
        },
        quantity: item.quantity,
      });

      // Rush fee as a separate line item
      if (item.isRush) {
        const rushAmount = Math.round(unitPrice * item.quantity * RUSH_FEE_RATE);
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Rush Processing — ${product.name}`,
              description: 'Priority production (~7 business days)',
            },
            unit_amount: rushAmount,
          },
          quantity: 1,
        });
      }
    }

    // Setup fees
    const uniqueProductIds = [...new Set(items.map((i) => i.productId))];
    for (const pid of uniqueProductIds) {
      const product = products.find((p) => p.id === pid);
      if (product && product.setupFee > 0) {
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Setup Fee — ${product.name}`,
              description: 'One-time design setup and plate charge',
            },
            unit_amount: product.setupFee,
          },
          quantity: 1,
        });
      }
    }

    const siteUrl = env.site.url;

    // Store order details in metadata so the webhook can reconstruct everything
    const metadata: Record<string, string> = {
      customerName: customerName || '',
      customerPhone: customerPhone || '',
      company: company || '',
      shippingAddress: shippingAddress || '',
      city: city || '',
      state: state || '',
      zip: zip || '',
      notes: notes || '',
      isDistributor: isDistributor ? 'true' : 'false',
      items: JSON.stringify(items.map((i) => {
        const p = products.find((pr) => pr.id === i.productId);
        return {
          productId: i.productId,
          productName: p?.name || i.productId,
          shape: p?.shape || '',
          size: p?.dimensions.displaySize || '',
          quantity: i.quantity,
          backing: i.backingId,
          priceTier: i.priceTier,
          isRush: i.isRush || false,
        };
      })),
    };

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/cart`,
      ...(customerEmail ? { customer_email: customerEmail } : {}),
      metadata,
      shipping_address_collection: {
        allowed_countries: ['US'],
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Checkout failed.' },
      { status: 500 },
    );
  }
}
