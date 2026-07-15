import { Link, useLoaderData, useSearchParams } from "react-router";
import type { Route } from "./+types/blog";
import { getBlogPostSummaries } from "~/data/blogPosts.server";
import { Calendar, Clock, ChevronRight, User } from "lucide-react";
import { Card } from "~/components/ui/Card";

export function meta({ }: Route.MetaArgs) {
  const title = "Ghiduri pentru mașini second-hand, verificări și costuri | AutoFans";
  const description = "Ghiduri practice pentru cumpărarea unei mașini second-hand: acte, verificări la vizionare, istoric VIN, costuri reale și întreținere.";
  const image = "https://www.autofans.ro/hero_background.jpg";

  return [
    { title },
    { name: "description", content: description },
    { name: "robots", content: "index,follow,max-image-preview:large" },
    { tagName: "link", rel: "canonical", href: "https://www.autofans.ro/blog" },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:image", content: image },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: image }
  ];
}

export async function loader() {
  return { posts: getBlogPostSummaries() };
}

export default function BlogIndex() {
  const { posts: blogPosts } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const activeTag = searchParams.get('tag')?.trim() || '';
  const allTags = Array.from(new Set(blogPosts.flatMap((post) => post.tags))).sort((a, b) => a.localeCompare(b, 'ro'));
  const filteredPosts = activeTag
    ? blogPosts.filter((post) => post.tags.some((tag) => tag.localeCompare(activeTag, 'ro', { sensitivity: 'accent' }) === 0))
    : blogPosts;
  const featuredPost = filteredPosts.find((post) => post.isFeatured) || filteredPosts[0];
  const otherPosts = filteredPosts.filter((post) => post.id !== featuredPost?.id);
  const blogSchema = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    '@id': 'https://www.autofans.ro/blog#blog',
    name: 'AutoFans Blog',
    url: 'https://www.autofans.ro/blog',
    description: 'Ghiduri practice pentru cumpărarea și deținerea unei mașini.',
    inLanguage: 'ro-RO',
    publisher: { '@id': 'https://www.autofans.ro/#organization' },
    blogPost: blogPosts.map((post) => ({
      '@type': 'BlogPosting',
      '@id': `https://www.autofans.ro/blog/${post.slug}#article`,
      headline: post.title,
      url: `https://www.autofans.ro/blog/${post.slug}`,
      datePublished: post.publishedAt,
      dateModified: post.updatedAt,
    })),
  };

  return (
    <div className="min-h-screen bg-[#121212] pt-8 pb-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="mb-12 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">AutoFans <span className="text-accent-gold">Blog</span></h1>
          <p className="text-xl text-gray-400 max-w-2xl">Descoperă cele mai noi trenduri, review-uri sincere și sfaturi esențiale din lumea auto.</p>
        </div>

        <nav aria-label="Filtrează articolele după etichetă" className="mb-10 flex flex-wrap gap-2">
          <Link to="/blog" aria-current={!activeTag ? 'page' : undefined} className={`rounded-full border px-3 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold ${!activeTag ? 'border-accent-gold bg-accent-gold/15 text-accent-gold' : 'border-white/10 bg-white/[0.03] text-gray-300 hover:border-white/30 hover:text-white'}`}>
            Toate articolele
          </Link>
          {allTags.map((tag) => {
            const isActive = tag.localeCompare(activeTag, 'ro', { sensitivity: 'accent' }) === 0;
            return (
              <Link key={tag} to={`/blog?tag=${encodeURIComponent(tag)}`} aria-current={isActive ? 'page' : undefined} className={`rounded-full border px-3 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold ${isActive ? 'border-accent-gold bg-accent-gold/15 text-accent-gold' : 'border-white/10 bg-white/[0.03] text-gray-300 hover:border-white/30 hover:text-white'}`}>
                #{tag}
              </Link>
            );
          })}
        </nav>

        {/* Featured Post */}
        {featuredPost ? <div className="mb-16">
          <Link to={`/blog/${featuredPost.slug}`} className="group block">
            <div className="relative rounded-3xl overflow-hidden bg-glass border border-white/10 aspect-[21/9] md:aspect-[21/8]">
              <img 
                src={featuredPost.coverImage} 
                alt={featuredPost.title} 
                fetchPriority="high"
                sizes="(max-width: 768px) 100vw, 1280px"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 bg-accent-gold/20 text-accent-gold border border-accent-gold/30 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                    {featuredPost.category}
                  </span>
                  <div className="flex items-center text-gray-300 text-sm">
                    <Clock className="w-4 h-4 mr-1" />
                    {featuredPost.readTime} min citire
                  </div>
                </div>
                
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight group-hover:text-accent-gold transition-colors duration-300">
                  {featuredPost.title}
                </h2>
                <p className="text-gray-300 text-lg md:text-xl max-w-3xl mb-6 line-clamp-2">
                  {featuredPost.excerpt}
                </p>
                
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-accent-gold/50 bg-secondary-950 text-sm font-black text-accent-gold" aria-hidden="true">AF</div>
                  <div>
                    <p className="text-white font-semibold">{featuredPost.author.name}</p>
                    <p className="text-gray-400 text-sm">{new Date(featuredPost.publishedAt).toLocaleDateString('ro-RO', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div> : (
          <div className="mb-16 rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
            <h2 className="text-xl font-bold text-white">Nu există încă articole pentru „{activeTag}”.</h2>
            <Link to="/blog" className="mt-4 inline-flex min-h-11 items-center rounded-xl border border-accent-gold/50 px-4 text-sm font-bold text-accent-gold hover:bg-accent-gold/10">Vezi toate articolele</Link>
          </div>
        )}

        {/* Grid Posts */}
        {otherPosts.length > 0 && <div className="mb-8">
          <h3 className="text-2xl font-bold text-white mb-6">Ultimele articole</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {otherPosts.map(post => (
              <Card key={post.id} className="bg-glass border-white/10 hover:border-accent-gold/30 transition-all duration-300 group overflow-hidden flex flex-col h-full">
                <Link to={`/blog/${post.slug}`} className="block relative aspect-video overflow-hidden">
                  <img 
                    src={post.coverImage} 
                    alt={post.title} 
                    loading="lazy"
                    decoding="async"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-black/50 text-white border border-white/20 rounded-full text-xs font-bold backdrop-blur-md">
                      {post.category}
                    </span>
                  </div>
                </Link>
                
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-center text-gray-400 text-xs mb-4 gap-4">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1.5" />
                      {new Date(post.publishedAt).toLocaleDateString('ro-RO', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1.5" />
                      {post.readTime} min
                    </div>
                  </div>
                  
                  <Link to={`/blog/${post.slug}`}>
                    <h4 className="text-xl font-bold text-white mb-3 group-hover:text-accent-gold transition-colors line-clamp-2">
                      {post.title}
                    </h4>
                  </Link>
                  <p className="text-gray-400 text-sm mb-6 line-clamp-3 flex-grow">
                    {post.excerpt}
                  </p>
                  
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-accent-gold/40 bg-secondary-950 text-[10px] font-black text-accent-gold" aria-hidden="true">AF</div>
                      <span className="text-sm text-gray-300 font-medium">{post.author.name}</span>
                    </div>
                    <Link to={`/blog/${post.slug}`} className="text-accent-gold hover:text-yellow-400 p-2 rounded-full hover:bg-accent-gold/10 transition-colors">
                      <ChevronRight className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>}

      </div>
    </div>
  );
}
