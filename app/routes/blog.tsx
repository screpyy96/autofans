import { Link } from "react-router";
import type { Route } from "./+types/blog";
import { mockBlogPosts } from "~/data/mockBlog";
import { Calendar, Clock, ChevronRight, User } from "lucide-react";
import { Card } from "~/components/ui/Card";

export function meta({ }: Route.MetaArgs) {
  const title = "Blog Auto Premium - Noutăți, Review-uri și Ghiduri | AutoFans.ro";
  const description = "Descoperă cele mai noi știri din lumea auto, review-uri detaliate pentru mașini premium și ghiduri complete pentru cumpărarea unei mașini second-hand.";
  const image = "https://autofans.ro/hero_background.jpg";

  return [
    { title },
    { name: "description", content: description },
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

export default function BlogIndex() {
  const featuredPost = mockBlogPosts.find(p => p.isFeatured) || mockBlogPosts[0];
  const otherPosts = mockBlogPosts.filter(p => p.id !== featuredPost.id);

  return (
    <div className="min-h-screen bg-[#121212] pt-8 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="mb-12 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">AutoFans <span className="text-accent-gold">Blog</span></h1>
          <p className="text-xl text-gray-400 max-w-2xl">Descoperă cele mai noi trenduri, review-uri sincere și sfaturi esențiale din lumea auto.</p>
        </div>

        {/* Featured Post */}
        <div className="mb-16">
          <Link to={`/blog/${featuredPost.slug}`} className="group block">
            <div className="relative rounded-3xl overflow-hidden bg-glass border border-white/10 aspect-[21/9] md:aspect-[21/8]">
              <img 
                src={featuredPost.coverImage} 
                alt={featuredPost.title} 
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
                  <img src={featuredPost.author.avatar} alt={featuredPost.author.name} className="w-12 h-12 rounded-full border-2 border-white/20" />
                  <div>
                    <p className="text-white font-semibold">{featuredPost.author.name}</p>
                    <p className="text-gray-400 text-sm">{new Date(featuredPost.publishedAt).toLocaleDateString('ro-RO', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Grid Posts */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-white mb-6">Ultimele articole</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {otherPosts.map(post => (
              <Card key={post.id} className="bg-glass border-white/10 hover:border-accent-gold/30 transition-all duration-300 group overflow-hidden flex flex-col h-full">
                <Link to={`/blog/${post.slug}`} className="block relative aspect-video overflow-hidden">
                  <img 
                    src={post.coverImage} 
                    alt={post.title} 
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
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                        <img src={post.author.avatar} alt={post.author.name} className="w-full h-full object-cover" />
                      </div>
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
        </div>

      </div>
    </div>
  );
}
