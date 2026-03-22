import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Container from '@/components/ui/Container';
import JsonLd from '@/components/seo/JsonLd';
import {
  getBreadcrumbSchema,
  getBlogPostSchema,
} from '@/lib/structured-data';
import { siteConfig } from '@/data/siteConfig';
import {
  blogPosts,
  getBlogPostBySlug,
  getRelatedPosts,
} from '@/data/blog-posts';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Tag,
  BookOpen,
  ChevronRight,
} from 'lucide-react';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) return {};

  return {
    title: post.metaTitle,
    description: post.metaDescription,
    keywords: post.tags,
    openGraph: {
      title: post.metaTitle,
      description: post.metaDescription,
      url: `https://customtintackers.com/blog/${post.slug}`,
      type: 'article',
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [post.author],
      tags: post.tags,
      images: [
        {
          url: post.coverImage.startsWith('http')
            ? post.coverImage
            : `https://customtintackers.com${post.coverImage}`,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.metaTitle,
      description: post.metaDescription,
    },
    alternates: {
      canonical: `https://customtintackers.com/blog/${post.slug}`,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = getRelatedPosts(post, 3);
  const publishedDate = new Date(post.publishedAt);
  const updatedDate = new Date(post.updatedAt);

  return (
    <div className="min-h-screen bg-gray-950">
      <JsonLd
        data={getBreadcrumbSchema([
          { name: 'Home', url: siteConfig.url },
          { name: 'Blog', url: `${siteConfig.url}/blog` },
          { name: post.title, url: `${siteConfig.url}/blog/${post.slug}` },
        ])}
      />
      <JsonLd data={getBlogPostSchema(post)} />

      {/* Article Header with Cover Image */}
      <section className="relative bg-gray-950 overflow-hidden border-b border-gray-800/50">
        {/* Cover image as background */}
        {post.coverImage && (
          <img
            src={post.coverImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-20"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/80 to-gray-950/60" />

        <Container className="relative py-12 sm:py-16 lg:py-20">
          <div className="max-w-3xl mx-auto">
            {/* Breadcrumbs */}
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-2 text-sm text-gray-500 mb-8"
            >
              <Link
                href="/"
                className="hover:text-amber-400 transition-colors"
              >
                Home
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <Link
                href="/blog"
                className="hover:text-amber-400 transition-colors"
              >
                Blog
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-gray-400 truncate max-w-[200px]">
                {post.title}
              </span>
            </nav>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400/80 border border-amber-500/20"
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                </span>
              ))}
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
              {post.title}
            </h1>

            {/* Meta Row */}
            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-amber-500/60" />
                {post.author}
              </span>
              <span className="w-1 h-1 rounded-full bg-gray-700" />
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-500/60" />
                <time dateTime={post.publishedAt}>
                  {publishedDate.toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </time>
              </span>
              <span className="w-1 h-1 rounded-full bg-gray-700" />
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-500/60" />
                {post.readingTime} min read
              </span>
            </div>

            {post.updatedAt !== post.publishedAt && (
              <p className="mt-3 text-xs text-gray-600">
                Updated{' '}
                <time dateTime={post.updatedAt}>
                  {updatedDate.toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </time>
              </p>
            )}
          </div>
        </Container>
      </section>

      {/* Article Content */}
      <section className="py-10 sm:py-14">
        <Container>
          <div className="max-w-3xl mx-auto">
            {/* Article Body */}
            <article
              className="prose-blog"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Back to Blog */}
            <div className="mt-12 pt-8 border-t border-gray-800/50">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 text-sm font-medium text-amber-400 hover:text-amber-300 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to all articles
              </Link>
            </div>
          </div>

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <div className="max-w-3xl mx-auto mt-16">
              <h2 className="text-2xl font-bold text-white mb-6">
                Related Articles
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {relatedPosts.map((related) => {
                  const relDate = new Date(related.publishedAt);
                  return (
                    <Link
                      key={related.id}
                      href={`/blog/${related.slug}`}
                      className="group bg-gray-900/50 rounded-xl border border-gray-800/50 overflow-hidden hover:border-amber-500/30 transition-all duration-300"
                    >
                      <div className="aspect-[16/9] bg-gray-800/50 flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-gray-700 group-hover:text-amber-500/30 transition-colors" />
                      </div>
                      <div className="p-4">
                        <h3 className="text-sm font-semibold text-white group-hover:text-amber-400 transition-colors line-clamp-2 mb-2">
                          {related.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <time dateTime={related.publishedAt}>
                            {relDate.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </time>
                          <span className="w-1 h-1 rounded-full bg-gray-700" />
                          <span>{related.readingTime} min</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </Container>
      </section>
    </div>
  );
}
