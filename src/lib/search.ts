import { getAllProducts } from './products';
import { industries } from '@/data/industries';
import { blogPosts } from '@/data/blog-posts';
import { galleryItems } from '@/data/gallery';
import { formatPrice } from './utils';
import type { Product } from '@/types/product';
import type { SearchResult, SearchResultType } from '@/types/search';

export type { SearchResult, SearchResultType };
export {
  searchTypeLabels,
  searchTypeSingular,
  searchTypeOrder,
} from '@/types/search';

/** A single searchable document with weighted fields. */
interface SearchDoc {
  id: string;
  type: SearchResultType;
  title: string;
  description: string;
  url: string;
  meta?: string;
  image?: string;
  /** Extra terms — tags, keywords, synonyms, category labels. */
  keywords: string[];
  /** Long-form text, lowest weight. */
  body: string;
}

// ─── Static pages ──────────────────────────────────────────────────
// Hand-authored so tools and info pages are findable by what people
// actually type, not just by the page title.
const staticPages: SearchDoc[] = [
  {
    id: 'page-products',
    type: 'page',
    title: 'All Products',
    description:
      'Browse the full catalog of embossed aluminum tin tacker signs — every shape and size.',
    url: '/products',
    keywords: ['catalog', 'shop', 'browse', 'signs', 'tin tackers', 'shapes', 'sizes', 'buy', 'order'],
    body: 'square circle can shape bottle cap street sign arrow license plate die cut corrugated vinyl state tackers',
  },
  {
    id: 'page-ai-designer',
    type: 'page',
    title: 'AI Designer',
    description: 'Upload your artwork and get an instant embossed tin tacker mockup with pricing.',
    url: '/ai-designer',
    keywords: ['ai', 'artificial intelligence', 'mockup', 'preview', 'upload artwork', 'logo', 'proof', 'instant'],
    body: 'upload your logo and see it as an embossed aluminum sign with automatic pricing',
  },
  {
    id: 'page-design',
    type: 'page',
    title: 'Online Sign Designer',
    description: 'Design your tin tacker right in the browser — text, shapes, images, and templates.',
    url: '/design',
    keywords: ['designer', 'design tool', 'editor', 'customize', 'create', 'canvas', 'templates', 'make your own'],
    body: 'online design editor add text shapes upload images choose a template export print ready artwork',
  },
  {
    id: 'page-mockup',
    type: 'page',
    title: 'Mockup Generator',
    description: 'Preview your logo on different tin tacker shapes and colors.',
    url: '/mockup',
    keywords: ['mockup', 'visualizer', 'preview', 'colors', 'shapes', 'proof'],
    body: 'generate a quick visual mockup of your sign in different shapes and color combinations',
  },
  {
    id: 'page-quote',
    type: 'page',
    title: 'Get a Quote',
    description: 'Request custom pricing for your tin tacker order — usually back same day.',
    url: '/quote',
    keywords: ['quote', 'pricing', 'estimate', 'custom pricing', 'bulk pricing', 'rfq', 'request pricing', 'cost'],
    body: 'tell us shape size quantity and embossing and we will send pricing',
  },
  {
    id: 'page-samples',
    type: 'page',
    title: 'Request Samples',
    description: 'Order a physical sample pack to see and feel the embossing before you buy.',
    url: '/samples',
    keywords: ['sample', 'samples', 'sample pack', 'swatch', 'proof', 'free sample'],
    body: 'physical sample kit showing aluminum gauge embossing depth and print quality',
  },
  {
    id: 'page-artwork-templates',
    type: 'page',
    title: 'Artwork Templates',
    description: 'Download print-ready templates with bleed and safe areas for every shape.',
    url: '/artwork-templates',
    keywords: [
      'template',
      'templates',
      'artwork',
      'dieline',
      'bleed',
      'safe area',
      'download',
      'illustrator',
      'svg',
      'file setup',
    ],
    body: 'print ready svg templates 300 dpi bleed safe area mounting holes for designers',
  },
  {
    id: 'page-gallery',
    type: 'page',
    title: 'Gallery',
    description: 'Real tin tackers we have produced for breweries, bars, and brands.',
    url: '/gallery',
    keywords: ['gallery', 'examples', 'portfolio', 'past work', 'photos', 'inspiration', 'ideas'],
    body: 'browse finished tin tacker projects by industry and shape',
  },
  {
    id: 'page-distributors',
    type: 'page',
    title: 'Distributors & Wholesale',
    description: 'Promotional product distributor pricing — 40% off list, ASI/SAGE/PPAI friendly.',
    url: '/distributors',
    keywords: ['distributor', 'wholesale', 'asi', 'sage', 'ppai', 'reseller', 'trade', 'discount', 'margin', 'net pricing'],
    body: 'distributor program login for wholesale pricing net cost and margin display',
  },
  {
    id: 'page-wholesale-login',
    type: 'page',
    title: 'Distributor Login',
    description: 'Sign in to see your wholesale pricing and margins.',
    url: '/wholesale/login',
    keywords: ['login', 'sign in', 'account', 'wholesale login', 'distributor login', 'password'],
    body: 'log in to your distributor account',
  },
  {
    id: 'page-blog',
    type: 'page',
    title: 'Blog',
    description: 'Guides and ideas on tin tackers, signage, and brand marketing.',
    url: '/blog',
    keywords: ['blog', 'articles', 'guides', 'news', 'how to', 'tips'],
    body: 'articles about tin tacker signs breweries bars and promotional signage',
  },
  {
    id: 'page-about',
    type: 'page',
    title: 'About Us',
    description: 'Custom Tin Tackers is made by Interstate Graphics in Machesney Park, Illinois.',
    url: '/about',
    keywords: ['about', 'company', 'interstate graphics', 'made in usa', 'who we are', 'factory', 'illinois'],
    body: 'family run printing manufacturer machesney park illinois made in the usa',
  },
  {
    id: 'page-contact',
    type: 'page',
    title: 'Contact Us',
    description: 'Phone, email, and address — talk to a real person about your project.',
    url: '/contact',
    keywords: ['contact', 'phone', 'email', 'address', 'call', 'reach us', 'support', 'help', 'customer service'],
    body: 'phone 815 877 8300 machesney park illinois sales team contact form',
  },
  {
    id: 'page-shipping',
    type: 'page',
    title: 'Shipping & Turnaround',
    description: 'Lead times, rush options, and how orders ship.',
    url: '/shipping',
    keywords: ['shipping', 'delivery', 'turnaround', 'lead time', 'rush', 'freight', 'how long', 'when will'],
    body: 'production lead time rush orders freight and shipping policies',
  },
  {
    id: 'page-cart',
    type: 'page',
    title: 'Cart',
    description: 'Review your items and check out.',
    url: '/cart',
    keywords: ['cart', 'basket', 'checkout', 'order', 'buy'],
    body: 'shopping cart and checkout',
  },
  {
    id: 'page-privacy',
    type: 'page',
    title: 'Privacy Policy',
    description: 'How we handle your information.',
    url: '/privacy',
    keywords: ['privacy', 'policy', 'data', 'cookies'],
    body: 'privacy policy',
  },
  {
    id: 'page-terms',
    type: 'page',
    title: 'Terms of Service',
    description: 'Terms and conditions for orders.',
    url: '/terms',
    keywords: ['terms', 'conditions', 'legal', 'returns', 'policy'],
    body: 'terms and conditions of sale',
  },
];

// Friendly labels so "bottle cap" or "round" finds the right products
// even though the stored value is a slug.
const shapeLabels: Record<string, string> = {
  square: 'square',
  rectangle: 'rectangle rectangular',
  circle: 'circle round circular',
  can: 'can shape beer can',
  'bottle-cap': 'bottle cap crown cap',
  'die-cut': 'die cut custom shape',
  shield: 'shield crest badge',
  arrow: 'arrow directional',
  'street-sign': 'street sign road sign',
  'license-plate': 'license plate tag',
};

const categoryLabels: Record<string, string> = {
  standard: 'standard tacker',
  circle: 'circle tacker',
  'can-shape': 'can shape',
  specialty: 'specialty shape',
  custom: 'custom die cut',
  'street-sign': 'street sign',
  'license-plate': 'license plate',
  corrugated: 'corrugated',
};

function productToDoc(p: Product): SearchDoc {
  const price =
    p.pricingTiers.length > 0
      ? `From ${formatPrice(p.pricingTiers[p.pricingTiers.length - 1].pricePerUnit)}/ea`
      : 'Request Pricing';

  return {
    id: `product-${p.id}`,
    type: 'product',
    title: p.name,
    description: p.shortDescription,
    url: `/products/${p.slug}`,
    meta: `${p.dimensions.displaySize} • ${price}`,
    image: p.images[0],
    keywords: [
      p.sku ?? '',
      p.dimensions.displaySize,
      shapeLabels[p.shape] ?? p.shape,
      categoryLabels[p.category] ?? p.category,
      ...p.features,
    ].filter(Boolean),
    body: `${p.longDescription} ${p.metadata.material} ${p.metadata.printMethod}`,
  };
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Build every searchable document on the site. */
export async function buildSearchIndex(): Promise<SearchDoc[]> {
  const products = await getAllProducts();

  const productDocs = products.map(productToDoc);

  const industryDocs: SearchDoc[] = industries.map((i) => ({
    id: `industry-${i.slug}`,
    type: 'industry',
    title: i.breadcrumbLabel,
    description: i.heroSubtext,
    url: `/${i.slug}`,
    meta: `Signs from ${i.pricingStart}/ea`,
    keywords: [i.name, i.headline, ...i.keywords],
    body: `${i.useCases} ${i.benefits.map((b) => `${b.title} ${b.description}`).join(' ')} ${i.recommendedProducts
      .map((r) => r.name)
      .join(' ')}`,
  }));

  const articleDocs: SearchDoc[] = blogPosts.map((post) => ({
    id: `article-${post.slug}`,
    type: 'article',
    title: post.title,
    description: post.excerpt,
    url: `/blog/${post.slug}`,
    meta: `${post.readingTime} min read`,
    keywords: post.tags,
    body: `${post.metaDescription} ${stripHtml(post.content)}`,
  }));

  const galleryDocs: SearchDoc[] = galleryItems.map((item) => ({
    id: `gallery-${item.id}`,
    type: 'gallery',
    title: item.brandName,
    description: item.description,
    url: `/gallery?industry=${encodeURIComponent(item.industry)}`,
    meta: `${item.shape} • ${item.size}`,
    keywords: [item.industry, item.shape, item.size, 'gallery', 'example'],
    body: `${item.brandName} ${item.industry} tin tacker example`,
  }));

  return [...productDocs, ...industryDocs, ...articleDocs, ...staticPages, ...galleryDocs];
}

// ─── Scoring ───────────────────────────────────────────────────────

// Function words too common to be worth matching on. Deliberately excludes
// product vocabulary like "can", which is a real shape here.
const stopWords = new Set([
  'the', 'and', 'for', 'with', 'from', 'that', 'this', 'you', 'your', 'our',
  'are', 'was', 'has', 'have', 'all', 'any', 'get', 'its', 'how', 'what',
  'why', 'when', 'who', 'does', 'did', 'will', 'would', 'should', 'about',
  'into', 'than', 'then', 'there', 'been', 'were', 'just', 'not', 'but',
  'they', 'them', 'their', 'take', 'need', 'want', 'much', 'many',
]);

function normalize(text: string): string {
  return (
    text
      .toLowerCase()
      // Collapse every way of writing a size into one token so a search for
      // "12 inch" matches a 12" product — and only a 12" product.
      .replace(/(\d+)\s*(?:"|''|in|inch|inches)\b/g, '$1in')
      .replace(/(\d+)"/g, '$1in')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
  );
}

function tokenize(text: string): string[] {
  const t = normalize(text);
  return t ? t.split(' ') : [];
}

/**
 * Score one term against one field.
 * Exact whole-word beats prefix, which beats a mid-word substring.
 */
function scoreField(term: string, field: string, weight: number): number {
  if (!field) return 0;
  const words = field.split(' ');
  if (words.includes(term)) return weight;
  if (words.some((w) => w.startsWith(term))) return weight * 0.6;
  if (term.length >= 4 && field.includes(term)) return weight * 0.3;
  return 0;
}

/** Small ranking bump so products and tools outrank long-tail content on ties. */
const typeBoost: Record<SearchResultType, number> = {
  product: 1.15,
  page: 1.1,
  industry: 1.05,
  article: 1,
  gallery: 0.95,
};

function scoreDoc(doc: SearchDoc, terms: string[], rawQuery: string): number {
  const title = normalize(doc.title);
  const keywords = normalize(doc.keywords.join(' '));
  const description = normalize(doc.description);
  const body = normalize(doc.body);

  let total = 0;
  let matchedTerms = 0;

  for (const term of terms) {
    const termScore =
      scoreField(term, title, 12) +
      scoreField(term, keywords, 7) +
      scoreField(term, description, 4) +
      scoreField(term, body, 1.5);

    if (termScore > 0) matchedTerms++;
    total += termScore;
  }

  // Short queries are treated as AND — "circle tacker" should return circle
  // tackers, not every product with "tacker" in the name. Longer, sentence-like
  // queries relax to a majority so they still return something useful.
  const required = terms.length <= 3 ? terms.length : Math.ceil(terms.length * 0.6);
  if (matchedTerms < required) return 0;

  if (matchedTerms < terms.length) {
    total *= matchedTerms / terms.length;
  }

  // Whole-phrase hits are almost always what the user meant.
  const phrase = normalize(rawQuery);
  if (phrase.includes(' ')) {
    if (title.includes(phrase)) total += 25;
    else if (keywords.includes(phrase) || description.includes(phrase)) total += 10;
  }

  if (title === phrase) total += 40;
  else if (title.startsWith(phrase)) total += 15;

  // Favour concise titles the query nearly covers, so "12 inch square"
  // ranks 12" Square Tacker above 12" Square Embossed Vinyl Tacker.
  const titleWords = title.split(' ').filter(Boolean);
  if (titleWords.length > 0) {
    const covered = titleWords.filter((w) =>
      terms.some((term) => w === term || w.startsWith(term)),
    ).length;
    total += (covered / titleWords.length) * 12;
  }

  return total * typeBoost[doc.type];
}

export interface SearchOptions {
  limit?: number;
  types?: SearchResultType[];
}

export async function searchSite(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  const { limit = 20, types } = options;
  // Keep single digits (a 6" tacker) but drop stray letters and filler words.
  const terms = tokenize(query).filter(
    (t) => (t.length > 1 || /\d/.test(t)) && !stopWords.has(t),
  );
  if (terms.length === 0) return [];

  const index = await buildSearchIndex();
  const pool = types ? index.filter((d) => types.includes(d.type)) : index;

  const scored = pool
    .map((doc) => ({ doc, score: scoreDoc(doc, terms, query) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.doc.title.localeCompare(b.doc.title));

  // Drop the long tail of incidental body-text matches — anything scoring
  // under 6% of the best hit is noise, not a result.
  const floor = scored.length > 0 ? scored[0].score * 0.06 : 0;

  return scored
    .filter((r) => r.score >= floor)
    .slice(0, limit)
    .map(({ doc, score }) => ({
      id: doc.id,
      type: doc.type,
      title: doc.title,
      description: doc.description,
      url: doc.url,
      meta: doc.meta,
      image: doc.image,
      score,
    }));
}

