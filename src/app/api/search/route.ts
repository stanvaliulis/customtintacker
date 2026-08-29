import { NextRequest, NextResponse } from 'next/server';
import { searchSite, type SearchResultType } from '@/lib/search';

const VALID_TYPES: SearchResultType[] = ['product', 'industry', 'article', 'page', 'gallery'];

export const revalidate = 3600;

export async function GET(req: NextRequest) {
  const query = (req.nextUrl.searchParams.get('q') ?? '').trim().slice(0, 100);

  if (query.length < 2) {
    return NextResponse.json({ query, results: [], total: 0 });
  }

  const limitParam = Number(req.nextUrl.searchParams.get('limit'));
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 50) : 8;

  const typeParam = req.nextUrl.searchParams.get('type');
  const types = typeParam
    ? (typeParam.split(',').filter((t): t is SearchResultType =>
        VALID_TYPES.includes(t as SearchResultType),
      ))
    : undefined;

  try {
    const results = await searchSite(query, {
      limit,
      types: types && types.length > 0 ? types : undefined,
    });

    return NextResponse.json(
      { query, results, total: results.length },
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } },
    );
  } catch (error) {
    console.error('Search failed:', error);
    return NextResponse.json({ error: 'Search unavailable' }, { status: 500 });
  }
}
