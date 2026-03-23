export type GalleryIndustry =
  | 'Brewery'
  | 'Bar'
  | 'Restaurant'
  | 'Cannabis'
  | 'Coffee'
  | 'Sports';

export type GalleryShape =
  | 'Square'
  | 'Circle'
  | 'Bottle Cap'
  | 'Can Shape'
  | 'Street Sign'
  | 'Arrow'
  | 'License Plate'
  | 'Custom Die-Cut';

export interface GalleryItem {
  id: string;
  brandName: string;
  industry: GalleryIndustry;
  shape: GalleryShape;
  size: string;
  description: string;
  imagePath: string;
}

export const galleryIndustries: GalleryIndustry[] = [
  'Brewery',
  'Bar',
  'Restaurant',
  'Cannabis',
  'Coffee',
  'Sports',
];

export const galleryShapes: GalleryShape[] = [
  'Square',
  'Circle',
  'Bottle Cap',
  'Can Shape',
  'Street Sign',
  'Arrow',
  'License Plate',
  'Custom Die-Cut',
];

export const galleryItems: GalleryItem[] = [
  {
    id: 'hoppy-trail-brewing',
    brandName: 'Hoppy Trail Brewing',
    industry: 'Brewery',
    shape: 'Bottle Cap',
    size: '22" x 22"',
    description:
      'Giant bottle cap tacker for their flagship IPA. Hangs behind the bar in their taproom and six partner bars across Portland.',
    imagePath: '/images/gallery/hoppy-trail.jpg',
  },
  {
    id: 'rusty-tap-pub',
    brandName: 'The Rusty Tap',
    industry: 'Bar',
    shape: 'Street Sign',
    size: '24" x 5"',
    description:
      'Vintage-style street sign tacker used as directional signage throughout their multi-room speakeasy. Ordered 200 units for all locations.',
    imagePath: '/images/gallery/rusty-tap.jpg',
  },
  {
    id: 'green-leaf-dispensary',
    brandName: 'Green Leaf Dispensary',
    industry: 'Cannabis',
    shape: 'Custom Die-Cut',
    size: '18" x 14"',
    description:
      'Custom leaf-shaped die-cut tacker with embossed logo. Used as point-of-sale displays in 12 dispensary locations across Colorado.',
    imagePath: '/images/gallery/green-leaf.jpg',
  },
  {
    id: 'iron-forge-brewing',
    brandName: 'Iron Forge Brewing Co.',
    industry: 'Brewery',
    shape: 'Square',
    size: '18" x 18"',
    description:
      'Bold embossed square tacker featuring their anvil logo. Distributed to 40+ craft beer bars in the Midwest.',
    imagePath: '/images/gallery/iron-forge.jpg',
  },
  {
    id: 'daily-grind-coffee',
    brandName: 'The Daily Grind',
    industry: 'Coffee',
    shape: 'Circle',
    size: '18" diameter',
    description:
      'Warm-toned circular tacker displayed at the register in all 8 cafe locations. Customers constantly ask where they can buy one.',
    imagePath: '/images/gallery/daily-grind.jpg',
  },
  {
    id: 'sideline-sports-bar',
    brandName: 'Sideline Sports Bar',
    industry: 'Sports',
    shape: 'License Plate',
    size: '12" x 6"',
    description:
      'License-plate style tackers for each NFL team. Regulars collect them and hang them in their home bars. A seasonal hit every fall.',
    imagePath: '/images/gallery/sideline-sports.jpg',
  },
  {
    id: 'mesa-verde-cantina',
    brandName: 'Mesa Verde Cantina',
    industry: 'Restaurant',
    shape: 'Arrow',
    size: '27" x 8"',
    description:
      'Arrow-shaped tackers pointing to the patio bar. Desert-inspired color palette with embossed cactus motif.',
    imagePath: '/images/gallery/mesa-verde.jpg',
  },
  {
    id: 'timber-creek-brewery',
    brandName: 'Timber Creek Brewery',
    industry: 'Brewery',
    shape: 'Can Shape',
    size: '8.5" x 14"',
    description:
      'Can-shaped tacker replicating their best-selling lager can. Used as trade show giveaways at the Great American Beer Festival.',
    imagePath: '/images/gallery/timber-creek.jpg',
  },
  {
    id: 'velvet-lounge',
    brandName: 'Velvet Lounge',
    industry: 'Bar',
    shape: 'Custom Die-Cut',
    size: '20" x 16"',
    description:
      'Art-deco inspired die-cut tacker shaped like a cocktail glass. Gold and black embossed design for an upscale look.',
    imagePath: '/images/gallery/velvet-lounge.jpg',
  },
  {
    id: 'elevation-cannabis',
    brandName: 'Elevation Cannabis Co.',
    industry: 'Cannabis',
    shape: 'Circle',
    size: '14" diameter',
    description:
      'Mountain-themed circular tacker with vibrant gradient print. Displayed in dispensary windows as eye-catching signage.',
    imagePath: '/images/gallery/elevation-cannabis.jpg',
  },
  {
    id: 'morning-ritual-coffee',
    brandName: 'Morning Ritual Coffee',
    industry: 'Coffee',
    shape: 'Square',
    size: '14" x 14"',
    description:
      'Minimalist square tacker with their sunrise logo. Ordered in batches for wholesale partners stocking their beans.',
    imagePath: '/images/gallery/morning-ritual.jpg',
  },
  {
    id: 'full-count-baseball',
    brandName: 'Full Count Sports Grill',
    industry: 'Sports',
    shape: 'Bottle Cap',
    size: '16" x 16"',
    description:
      'Baseball-themed bottle cap tacker with stitching detail. A top seller during spring training season.',
    imagePath: '/images/gallery/full-count.jpg',
  },
  {
    id: 'coastal-brewing',
    brandName: 'Coastal Brewing Company',
    industry: 'Brewery',
    shape: 'Circle',
    size: '22" diameter',
    description:
      'Ocean-blue circular tacker with embossed wave pattern. Shipped 500 units to bars along the Eastern Seaboard.',
    imagePath: '/images/gallery/coastal-brewing.jpg',
  },
  {
    id: 'smoke-mirrors-bar',
    brandName: 'Smoke & Mirrors',
    industry: 'Bar',
    shape: 'Arrow',
    size: '21" x 7"',
    description:
      'Neon-style arrow tacker with glow effect print pointing to the hidden entrance of their speakeasy.',
    imagePath: '/images/gallery/smoke-mirrors.jpg',
  },
  {
    id: 'toro-steakhouse',
    brandName: 'Toro Steakhouse',
    industry: 'Restaurant',
    shape: 'Custom Die-Cut',
    size: '24" x 18"',
    description:
      'Bull-head shaped die-cut tacker in matte black with gold embossing. Mounted in the entryway of all three locations.',
    imagePath: '/images/gallery/toro-steakhouse.jpg',
  },
  {
    id: 'summit-roasters',
    brandName: 'Summit Roasters',
    industry: 'Coffee',
    shape: 'Street Sign',
    size: '18" x 4"',
    description:
      'Street-sign style tacker reading "Summit Roasters Blvd" in retro typography. Popular gift shop item at their flagship cafe.',
    imagePath: '/images/gallery/summit-roasters.jpg',
  },
];
