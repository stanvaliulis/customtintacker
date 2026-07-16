import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { products } from '@/data/products';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { imageData, mediaType, productId, notes } = body as {
      imageData: string;
      mediaType: string;
      productId: string;
      notes?: string;
    };

    if (!imageData || !mediaType || !productId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'AI designer not configured' }, { status: 503 });
    }

    const product = products.find((p) => p.id === productId);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const { width, height, displaySize } = product.dimensions;

    const systemPrompt = `You are an expert sign designer for Custom Tin Tackers, a company that makes embossed aluminum tin tacker signs. You analyze customer artwork and provide professional design recommendations.

Product being designed: ${product.name}
Shape: ${product.shape}
Dimensions: ${displaySize} (${width}" x ${height}")
Material: .024 gauge recycled aluminum
Print method: Full-color digital print with embossing

Your job is to analyze the uploaded artwork and provide:
1. A brief assessment of the artwork quality and suitability for this sign
2. Layout recommendations — how to position and size the artwork on the sign
3. Embossing suggestions — which areas would look best embossed (raised)
4. Color and print notes — any concerns about colors, resolution, or bleed
5. A confidence score (1-10) for how production-ready this artwork is

Respond in JSON format with this structure:
{
  "assessment": "Brief overall assessment",
  "artworkQuality": "high" | "medium" | "low",
  "confidenceScore": 1-10,
  "layout": {
    "recommendation": "How to position the artwork",
    "fillPercentage": "What % of the sign the artwork should fill",
    "orientation": "portrait" | "landscape" | "square" | "centered"
  },
  "embossing": {
    "recommendation": "What areas to emboss",
    "suggestedZones": ["List of specific areas to emboss, e.g. 'logo', 'text', 'border'"]
  },
  "colorNotes": "Any notes about colors, contrast, or print considerations",
  "productionNotes": "Any concerns or tips for production",
  "suggestedChanges": ["List of suggested improvements, if any"]
}`;

    const userContent: Anthropic.MessageParam['content'] = [
      {
        type: 'image',
        source: {
          type: 'base64',
          media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
          data: imageData,
        },
      },
      {
        type: 'text',
        text: `Analyze this artwork for a ${product.name} (${displaySize}, ${product.shape} shape).${notes ? ` Customer notes: ${notes}` : ''} Respond in the JSON format specified.`,
      },
    ];

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 });
    }

    let analysis;
    try {
      const jsonStr = textBlock.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysis = JSON.parse(jsonStr);
    } catch {
      analysis = { raw: textBlock.text };
    }

    const pricingTiers = product.pricingTiers.map((tier) => ({
      quantity: `${tier.minQuantity}${tier.maxQuantity ? `-${tier.maxQuantity}` : '+'}`,
      pricePerUnit: (tier.pricePerUnit / 100).toFixed(2),
      total: tier.minQuantity ? ((tier.pricePerUnit * tier.minQuantity) / 100).toFixed(2) : null,
    }));

    return NextResponse.json({
      analysis,
      product: {
        id: product.id,
        name: product.name,
        shape: product.shape,
        dimensions: product.dimensions,
        pricingTiers,
      },
    });
  } catch (err) {
    console.error('AI Designer error:', err);
    return NextResponse.json(
      { error: 'Failed to analyze artwork. Please try again.' },
      { status: 500 },
    );
  }
}
