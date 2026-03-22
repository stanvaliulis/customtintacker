import { Metadata } from 'next';
import Link from 'next/link';
import Container from '@/components/ui/Container';
import JsonLd from '@/components/seo/JsonLd';
import { getBreadcrumbSchema, getBlogListSchema } from '@/lib/structured-data';
import { siteConfig } from '@/data/siteConfig';
import { getAllBlogPosts } from '@/data/blog-posts';
import { BookOpen, Clock, Calendar, Tag } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Tin Tacker Blog | Tips, Guides & Embossed Aluminum Sign Insights',
  description:
    'Read the Custom Tin Tackers blog for tips, ordering guides, and industry insights about embossed aluminum tin tacker signs. Learn how breweries, bars, and brands use tin tackers for promotions, decor, and branding.',
  keywords: [
    'tin tacker blog',
    'tin tacker tips',
    'embossed aluminum sign guides',
    'brewery sign ideas',
    'bar sign ideas',
    'tin tacker display ideas',
    'tin tacker ordering guide',
  ],
  openGraph: {
    title: 'Tin Tacker Blog | Tips, Guides & Embossed Aluminum Sign Insights',
    description:
      'Tips, guides, and insights about custom embossed aluminum tin tacker signs for breweries, bars, brands, and promotional products distributors.',
    url: 'https://customtintackers.com/blog',
    type: 'website',
  },
  alternates: {
    canonical: 'https://customtintackers.com/blog',
  },
};

export default function BlogPage() {
  const posts = getAllBlogPosts();

  return (
    <div className="min-h-screen bg-gray-950">
      <JsonLd
        data={getBreadcrumbSchema([
          { name: 'Home', url: siteConfig.url },
          { name: 'Blog', url: `${siteConfig.url}/blog` },
        ])}
      />
      <JsonLd data={getBlogListSchema()} />

      {/* Dark Hero Header */}
      <section className="relative bg-gray-950 overflow-hidden border-b border-gray-800/50">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-amber-950/30" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-amber-600/5 rounded-full blur-3xl" />

        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 3px)',
          }}
        />

        <Container className="relative py-16 sm:py-20 lg:py-24">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-amber-400" />
              </div>
              <p className="text-amber-400/80 font-medium tracking-widest uppercase text-sm">
                Our Blog
              </p>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight">
              Tips, Guides &{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500">
                Insights
              </span>
            </h1>
            <p className="mt-4 text-lg sm:text-xl text-gray-400 max-w-2xl leading-relaxed">
              Everything you need to know about custom tin tacker signs — from
              ordering and manufacturing to creative display ideas and industry
              trends.
            </p>
            <div className="mt-6 flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-amber-500/60" />
                {posts.length} article{posts.length !== 1 ? 's' : ''}
              </span>
              <span className="w-1 h-1 rounded-full bg-gray-700" />
              <span>Updated regularly</span>
            </div>
          </div>
        </Container>
      </section>

      {/* Blog Grid */}
      <section className="py-10 sm:py-14">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {posts.map((post) => {
              const publishedDate = new Date(post.publishedAt);
              return (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group bg-gray-900/50 rounded-xl border border-gray-800/50 overflow-hidden hover:border-amber-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/5"
                >
                  {/* Cover Image */}
                  <div className="aspect-[16/9] bg-gray-800/50 relative overflow-hidden">
                    {post.coverImage ? (
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-gray-700 group-hover:text-amber-500/30 transition-colors duration-300" />
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-6">
                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {post.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400/80 border border-amber-500/20"
                        >
                          <Tag className="w-3 h-3" />
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Title */}
                    <h2 className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors duration-200 mb-2 line-clamp-2">
                      {post.title}
                    </h2>

                    {/* Excerpt */}
                    <p className="text-gray-400 text-sm leading-relaxed mb-4 line-clamp-2">
                      {post.excerpt}
                    </p>

                    {/* Meta */}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <time dateTime={post.publishedAt}>
                          {publishedDate.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </time>
                      </span>
                      <span className="w-1 h-1 rounded-full bg-gray-700" />
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {post.readingTime} min read
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </Container>
      </section>
    </div>
  );
}
