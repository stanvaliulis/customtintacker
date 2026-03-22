import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const seedProducts = [
  {
    slug: '8x8-embossed-tacker',
    name: '8" x 8" Embossed Tacker',
    shortDescription: 'Compact embossed aluminum tacker sign, perfect for small displays and POS branding.',
    longDescription: 'Our 8" x 8" mini tacker is ideal for tap handles, countertop displays, and point-of-sale branding. Made from recycled embossed aluminum with full-color printing, each sign features pre-drilled mounting holes and arrives individually shrink-wrapped for protection.',
    category: 'standard',
    shape: 'square',
    width: 8, height: 8, displaySize: '8" x 8"',
    wholesaleDiscount: 0.20,
    minimumOrder: 25, leadTimeDays: 30, setupFee: 20000,
    inStock: true, featured: true, sortOrder: 1,
    mountingHoles: 2,
    images: [{ url: '/images/products/8x8-tacker.jpg', alt: '8x8 Embossed Tacker' }],
    pricingTiers: [
      { minQuantity: 25, maxQuantity: 49, pricePerUnit: 850 },
      { minQuantity: 50, maxQuantity: 99, pricePerUnit: 700 },
      { minQuantity: 100, maxQuantity: 249, pricePerUnit: 530 },
      { minQuantity: 250, maxQuantity: 499, pricePerUnit: 440 },
      { minQuantity: 500, maxQuantity: 749, pricePerUnit: 400 },
      { minQuantity: 750, maxQuantity: 999, pricePerUnit: 370 },
      { minQuantity: 1000, maxQuantity: null, pricePerUnit: 350 },
    ],
    backingOptions: ['standard-024', 'heavy-032', 'premium-040'],
    features: ['Embossed recycled aluminum', 'Full-color printing available', 'Two mounting holes included', 'Individual shrink-wrapping', 'Made in USA'],
  },
  {
    slug: '12x12-embossed-tacker',
    name: '12" x 12" Embossed Tacker',
    shortDescription: 'Our most popular size. Versatile embossed aluminum tacker for any environment.',
    longDescription: 'The 12" x 12" embossed tacker is our best-selling size, perfect for bars, restaurants, retail stores, and trade shows. Large enough to make an impact while fitting easily on walls and displays. Full-color embossed aluminum with pre-drilled mounting holes.',
    category: 'standard',
    shape: 'square',
    width: 12, height: 12, displaySize: '12" x 12"',
    wholesaleDiscount: 0.20,
    minimumOrder: 25, leadTimeDays: 30, setupFee: 20000,
    inStock: true, featured: true, sortOrder: 2,
    mountingHoles: 2,
    images: [{ url: '/images/products/12x12-tacker.jpg', alt: '12x12 Embossed Tacker' }],
    pricingTiers: [
      { minQuantity: 25, maxQuantity: 49, pricePerUnit: 1100 },
      { minQuantity: 50, maxQuantity: 99, pricePerUnit: 900 },
      { minQuantity: 100, maxQuantity: 249, pricePerUnit: 700 },
      { minQuantity: 250, maxQuantity: 499, pricePerUnit: 580 },
      { minQuantity: 500, maxQuantity: 749, pricePerUnit: 520 },
      { minQuantity: 750, maxQuantity: 999, pricePerUnit: 480 },
      { minQuantity: 1000, maxQuantity: null, pricePerUnit: 450 },
    ],
    backingOptions: ['standard-024', 'heavy-032', 'premium-040'],
    features: ['Embossed recycled aluminum', 'Full-color printing available', 'Two mounting holes included', 'Individual shrink-wrapping', 'Made in USA'],
  },
  {
    slug: '16x16-embossed-tacker',
    name: '16" x 16" Embossed Tacker',
    shortDescription: 'Mid-size embossed aluminum tacker with excellent visibility.',
    longDescription: 'The 16" x 16" embossed tacker offers a step up in visibility while remaining easy to install. Ideal for brewery taprooms, restaurant walls, and retail signage. Full-color embossed aluminum with pre-drilled mounting holes.',
    category: 'standard',
    shape: 'square',
    width: 16, height: 16, displaySize: '16" x 16"',
    wholesaleDiscount: 0.20,
    minimumOrder: 25, leadTimeDays: 30, setupFee: 20000,
    inStock: true, featured: false, sortOrder: 3,
    mountingHoles: 2,
    images: [{ url: '/images/products/16x16-tacker.jpg', alt: '16x16 Embossed Tacker' }],
    pricingTiers: [
      { minQuantity: 25, maxQuantity: 49, pricePerUnit: 1400 },
      { minQuantity: 50, maxQuantity: 99, pricePerUnit: 1150 },
      { minQuantity: 100, maxQuantity: 249, pricePerUnit: 900 },
      { minQuantity: 250, maxQuantity: 499, pricePerUnit: 750 },
      { minQuantity: 500, maxQuantity: 749, pricePerUnit: 680 },
      { minQuantity: 750, maxQuantity: 999, pricePerUnit: 630 },
      { minQuantity: 1000, maxQuantity: null, pricePerUnit: 590 },
    ],
    backingOptions: ['standard-024', 'heavy-032', 'premium-040'],
    features: ['Embossed recycled aluminum', 'Full-color printing available', 'Two mounting holes included', 'Individual shrink-wrapping', 'Made in USA'],
  },
  {
    slug: '18x18-embossed-tacker',
    name: '18" x 18" Embossed Tacker',
    shortDescription: 'Large format embossed aluminum tacker for maximum brand impact.',
    longDescription: 'Our 18" x 18" embossed tacker delivers serious brand presence. Perfect for high-visibility wall placements in bars, restaurants, and retail environments. Full-color embossed aluminum construction with mounting hardware included.',
    category: 'standard',
    shape: 'square',
    width: 18, height: 18, displaySize: '18" x 18"',
    wholesaleDiscount: 0.20,
    minimumOrder: 25, leadTimeDays: 30, setupFee: 20000,
    inStock: true, featured: true, sortOrder: 4,
    mountingHoles: 4,
    images: [{ url: '/images/products/18x18-tacker.jpg', alt: '18x18 Embossed Tacker' }],
    pricingTiers: [
      { minQuantity: 25, maxQuantity: 49, pricePerUnit: 1700 },
      { minQuantity: 50, maxQuantity: 99, pricePerUnit: 1400 },
      { minQuantity: 100, maxQuantity: 249, pricePerUnit: 1100 },
      { minQuantity: 250, maxQuantity: 499, pricePerUnit: 920 },
      { minQuantity: 500, maxQuantity: 749, pricePerUnit: 840 },
      { minQuantity: 750, maxQuantity: 999, pricePerUnit: 780 },
      { minQuantity: 1000, maxQuantity: null, pricePerUnit: 730 },
    ],
    backingOptions: ['standard-024', 'heavy-032', 'premium-040'],
    features: ['Embossed recycled aluminum', 'Full-color printing available', 'Four mounting holes included', 'Individual shrink-wrapping', 'Made in USA'],
  },
  {
    slug: '24x24-embossed-tacker',
    name: '24" x 24" Embossed Tacker',
    shortDescription: 'Extra-large embossed aluminum tacker for bold, unmissable branding.',
    longDescription: 'The 24" x 24" is our largest standard square tacker. Commanding attention from across the room, it is the go-to choice for breweries, distributors, and major brand campaigns. Premium embossed aluminum with full-color graphics.',
    category: 'standard',
    shape: 'square',
    width: 24, height: 24, displaySize: '24" x 24"',
    wholesaleDiscount: 0.20,
    minimumOrder: 25, leadTimeDays: 30, setupFee: 25000,
    inStock: true, featured: false, sortOrder: 5,
    mountingHoles: 4,
    images: [{ url: '/images/products/24x24-tacker.jpg', alt: '24x24 Embossed Tacker' }],
    pricingTiers: [
      { minQuantity: 25, maxQuantity: 49, pricePerUnit: 2200 },
      { minQuantity: 50, maxQuantity: 99, pricePerUnit: 1800 },
      { minQuantity: 100, maxQuantity: 249, pricePerUnit: 1450 },
      { minQuantity: 250, maxQuantity: 499, pricePerUnit: 1200 },
      { minQuantity: 500, maxQuantity: 749, pricePerUnit: 1100 },
      { minQuantity: 750, maxQuantity: 999, pricePerUnit: 1020 },
      { minQuantity: 1000, maxQuantity: null, pricePerUnit: 950 },
    ],
    backingOptions: ['standard-024', 'heavy-032', 'premium-040'],
    features: ['Embossed recycled aluminum', 'Full-color printing available', 'Four mounting holes included', 'Individual shrink-wrapping', 'Made in USA'],
  },
  {
    slug: '12-inch-circle-tacker',
    name: '12" Circle Embossed Tacker',
    shortDescription: 'Round embossed aluminum tacker for a distinctive look.',
    longDescription: 'Stand out with our 12" circle tacker. The round shape adds a unique visual element to any display. Perfect for craft breweries, wineries, and specialty brands looking for something different. Embossed aluminum with full-color graphics.',
    category: 'circle',
    shape: 'circle',
    width: 12, height: 12, displaySize: '12" Diameter',
    wholesaleDiscount: 0.20,
    minimumOrder: 25, leadTimeDays: 30, setupFee: 22000,
    inStock: true, featured: false, sortOrder: 6,
    mountingHoles: 1,
    images: [{ url: '/images/products/circle-12-tacker.jpg', alt: '12 inch Circle Tacker' }],
    pricingTiers: [
      { minQuantity: 25, maxQuantity: 49, pricePerUnit: 1200 },
      { minQuantity: 50, maxQuantity: 99, pricePerUnit: 980 },
      { minQuantity: 100, maxQuantity: 249, pricePerUnit: 780 },
      { minQuantity: 250, maxQuantity: 499, pricePerUnit: 650 },
      { minQuantity: 500, maxQuantity: 749, pricePerUnit: 580 },
      { minQuantity: 750, maxQuantity: 999, pricePerUnit: 540 },
      { minQuantity: 1000, maxQuantity: null, pricePerUnit: 500 },
    ],
    backingOptions: ['standard-024', 'heavy-032', 'premium-040'],
    features: ['Embossed recycled aluminum', 'Full-color printing available', 'Single center mounting hole', 'Individual shrink-wrapping', 'Made in USA'],
  },
  {
    slug: '18-inch-circle-tacker',
    name: '18" Circle Embossed Tacker',
    shortDescription: 'Large round embossed aluminum tacker for bold, eye-catching displays.',
    longDescription: 'Our 18" circle tacker combines the distinctive round shape with a larger format for maximum visual impact. A favorite for breweries, taprooms, and events. Premium embossed aluminum with vibrant full-color printing.',
    category: 'circle',
    shape: 'circle',
    width: 18, height: 18, displaySize: '18" Diameter',
    wholesaleDiscount: 0.20,
    minimumOrder: 25, leadTimeDays: 30, setupFee: 22000,
    inStock: true, featured: false, sortOrder: 7,
    mountingHoles: 1,
    images: [{ url: '/images/products/circle-18-tacker.jpg', alt: '18 inch Circle Tacker' }],
    pricingTiers: [
      { minQuantity: 25, maxQuantity: 49, pricePerUnit: 1800 },
      { minQuantity: 50, maxQuantity: 99, pricePerUnit: 1500 },
      { minQuantity: 100, maxQuantity: 249, pricePerUnit: 1200 },
      { minQuantity: 250, maxQuantity: 499, pricePerUnit: 1000 },
      { minQuantity: 500, maxQuantity: 749, pricePerUnit: 900 },
      { minQuantity: 750, maxQuantity: 999, pricePerUnit: 840 },
      { minQuantity: 1000, maxQuantity: null, pricePerUnit: 780 },
    ],
    backingOptions: ['standard-024', 'heavy-032', 'premium-040'],
    features: ['Embossed recycled aluminum', 'Full-color printing available', 'Single center mounting hole', 'Individual shrink-wrapping', 'Made in USA'],
  },
  {
    slug: 'can-shape-tacker',
    name: 'Can Shape Embossed Tacker',
    shortDescription: 'Beer can shaped embossed aluminum tacker — a crowd favorite.',
    longDescription: 'Nothing says beer brand like our can-shaped tacker. At 11.5" x 22.25", this die-cut embossed aluminum sign replicates the iconic beer can silhouette. A must-have for breweries, distributors, and beverage brands.',
    category: 'can-shape',
    shape: 'can',
    width: 11.5, height: 22.25, displaySize: '11.5" x 22.25"',
    wholesaleDiscount: 0.20,
    minimumOrder: 25, leadTimeDays: 35, setupFee: 25000,
    inStock: true, featured: true, sortOrder: 8,
    mountingHoles: 2,
    images: [{ url: '/images/products/can-shape-tacker.jpg', alt: 'Can Shape Tacker' }],
    pricingTiers: [
      { minQuantity: 25, maxQuantity: 49, pricePerUnit: 2000 },
      { minQuantity: 50, maxQuantity: 99, pricePerUnit: 1650 },
      { minQuantity: 100, maxQuantity: 249, pricePerUnit: 1300 },
      { minQuantity: 250, maxQuantity: 499, pricePerUnit: 1100 },
      { minQuantity: 500, maxQuantity: 749, pricePerUnit: 980 },
      { minQuantity: 750, maxQuantity: 999, pricePerUnit: 920 },
      { minQuantity: 1000, maxQuantity: null, pricePerUnit: 860 },
    ],
    backingOptions: ['standard-024', 'heavy-032', 'premium-040'],
    features: ['Die-cut can silhouette', 'Embossed recycled aluminum', 'Full-color printing available', 'Two mounting holes included', 'Individual shrink-wrapping', 'Made in USA'],
  },
  {
    slug: 'bottle-cap-tacker',
    name: '14" Bottle Cap Embossed Tacker',
    shortDescription: 'Iconic bottle cap shaped embossed aluminum tacker sign.',
    longDescription: 'Our 14" bottle cap tacker is one of the most recognizable shapes in bar and brewery signage. The crimped-edge design replicates a classic bottle cap, making it an instant conversation piece. Full-color embossed aluminum.',
    category: 'specialty',
    shape: 'bottle-cap',
    width: 14, height: 14, displaySize: '14" Diameter',
    wholesaleDiscount: 0.20,
    minimumOrder: 25, leadTimeDays: 35, setupFee: 25000,
    inStock: true, featured: false, sortOrder: 9,
    mountingHoles: 1,
    images: [{ url: '/images/products/bottle-cap-tacker.jpg', alt: 'Bottle Cap Tacker' }],
    pricingTiers: [
      { minQuantity: 25, maxQuantity: 49, pricePerUnit: 1600 },
      { minQuantity: 50, maxQuantity: 99, pricePerUnit: 1300 },
      { minQuantity: 100, maxQuantity: 249, pricePerUnit: 1050 },
      { minQuantity: 250, maxQuantity: 499, pricePerUnit: 880 },
      { minQuantity: 500, maxQuantity: 749, pricePerUnit: 790 },
      { minQuantity: 750, maxQuantity: 999, pricePerUnit: 740 },
      { minQuantity: 1000, maxQuantity: null, pricePerUnit: 690 },
    ],
    backingOptions: ['standard-024', 'heavy-032', 'premium-040'],
    features: ['Authentic bottle cap shape', 'Embossed recycled aluminum', 'Full-color printing available', 'Single center mounting hole', 'Individual shrink-wrapping', 'Made in USA'],
  },
  {
    slug: 'die-cut-custom-tacker',
    name: 'Custom Die-Cut Tacker',
    shortDescription: 'Fully custom shaped embossed aluminum tacker — any shape you need.',
    longDescription: 'Go beyond standard shapes with our custom die-cut tackers. We can produce any shape you need — logos, mascots, state outlines, product silhouettes, and more. Contact us with your design for a custom quote. Pricing shown is for standard custom die-cuts up to 18" in any direction.',
    category: 'custom',
    shape: 'die-cut',
    width: 18, height: 18, displaySize: 'Up to 18" (Custom)',
    wholesaleDiscount: 0.20,
    minimumOrder: 50, leadTimeDays: 45, setupFee: 35000,
    inStock: true, featured: false, sortOrder: 10,
    mountingHoles: 2,
    images: [{ url: '/images/products/die-cut-tacker.jpg', alt: 'Custom Die-Cut Tacker' }],
    pricingTiers: [
      { minQuantity: 50, maxQuantity: 99, pricePerUnit: 2200 },
      { minQuantity: 100, maxQuantity: 249, pricePerUnit: 1750 },
      { minQuantity: 250, maxQuantity: 499, pricePerUnit: 1450 },
      { minQuantity: 500, maxQuantity: 749, pricePerUnit: 1300 },
      { minQuantity: 750, maxQuantity: 999, pricePerUnit: 1200 },
      { minQuantity: 1000, maxQuantity: null, pricePerUnit: 1100 },
    ],
    backingOptions: ['standard-024', 'heavy-032', 'premium-040'],
    features: ['Any custom shape', 'Embossed recycled aluminum', 'Full-color printing available', 'Mounting holes as needed', 'Individual shrink-wrapping', 'Made in USA'],
  },
];

async function main() {
  console.log('Seeding database...');

  // Clear existing data
  await prisma.productFeature.deleteMany();
  await prisma.productBacking.deleteMany();
  await prisma.pricingTier.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();

  for (const data of seedProducts) {
    const { images, pricingTiers, backingOptions, features, ...productData } = data;

    await prisma.product.create({
      data: {
        ...productData,
        images: { create: images.map((img, i) => ({ ...img, sortOrder: i })) },
        pricingTiers: { create: pricingTiers },
        backingOptions: { create: backingOptions.map((id) => ({ backingId: id })) },
        features: { create: features.map((text, i) => ({ text, sortOrder: i })) },
      },
    });

    console.log(`  Created: ${data.name}`);
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
