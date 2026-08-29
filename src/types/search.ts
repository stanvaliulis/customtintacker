export type SearchResultType = 'product' | 'industry' | 'article' | 'page' | 'gallery';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  description: string;
  url: string;
  meta?: string;
  image?: string;
  score: number;
}

export const searchTypeLabels: Record<SearchResultType, string> = {
  product: 'Products',
  page: 'Pages & Tools',
  industry: 'Industries',
  article: 'Articles',
  gallery: 'Gallery',
};

export const searchTypeSingular: Record<SearchResultType, string> = {
  product: 'Product',
  page: 'Page',
  industry: 'Industry',
  article: 'Article',
  gallery: 'Gallery',
};

/** Display order for grouped results — most commercially useful first. */
export const searchTypeOrder: SearchResultType[] = [
  'product',
  'page',
  'industry',
  'article',
  'gallery',
];
