import { useLoaderData, Link } from "react-router";
import type { Route } from "./+types/blog.$slug";
import { mockBlogPosts } from "~/data/mockBlog";
import { ArrowLeft, Calendar, Clock, Share2, Twitter, Facebook, Link as LinkIcon } from "lucide-react";
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function meta({ data }: Route.MetaArgs) {
  const post = data?.post;
  if (!post) return [{ title: "Articol inexistent - AutoFans Blog" }];

  return [
    { title: `${post.title} | AutoFans Blog` },
    { name: "description", content: post.excerpt },
    { property: "og:title", content: post.title },
    { property: "og:description", content: post.excerpt },
    { property: "og:image", content: post.coverImage },
    { property: "og:type", content: "article" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: post.title },
    { name: "twitter:description", content: post.excerpt },
    { name: "twitter:image", content: post.coverImage }
  ];
}

export async function loader({ params }: Route.LoaderArgs) {
  const post = mockBlogPosts.find(p => p.slug === params.slug);
  if (!post) {
    throw new Response("Not Found", { status: 404 });
  }
  return { post };
}

export default function BlogPost() {
  const { post } = useLoaderData<typeof loader>();

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.excerpt,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copiat în clipboard!");
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] pb-20">
      {/* Hero Header */}
      <div className="relative h-[60vh] min-h-[400px] w-full">
        <div className="absolute inset-0">
          <img 
            src={post.coverImage} 
            alt={post.title} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-[#121212]" />
        </div>

        <div className="absolute inset-0 flex flex-col justify-end pb-16 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto w-full">
            <Link to="/blog" className="inline-flex items-center text-gray-300 hover:text-white mb-8 transition-colors">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Înapoi la Blog
            </Link>

            <div className="flex items-center gap-3 mb-6">
              <span className="px-3 py-1 bg-accent-gold/20 text-accent-gold border border-accent-gold/30 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                {post.category}
              </span>
              <div className="flex items-center text-gray-300 text-sm">
                <Clock className="w-4 h-4 mr-1" />
                {post.readTime} min citire
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              {post.title}
            </h1>

            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <img src={post.author.avatar} alt={post.author.name} className="w-12 h-12 rounded-full border-2 border-white/20" />
                <div>
                  <p className="text-white font-semibold text-lg">{post.author.name}</p>
                  <div className="flex items-center text-gray-400 text-sm">
                    <span>{post.author.role}</span>
                    <span className="mx-2">•</span>
                    <Calendar className="w-4 h-4 mr-1.5" />
                    {new Date(post.publishedAt).toLocaleDateString('ro-RO', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={handleShare}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full border border-white/10 transition-colors backdrop-blur-md"
                >
                  <Share2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Distribuie</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-8 relative z-10">
        <div className="bg-glass border border-white/5 rounded-3xl p-6 md:p-12 shadow-2xl">
          <div className="prose prose-invert prose-lg max-w-none prose-headings:text-white prose-a:text-accent-gold hover:prose-a:text-yellow-400 prose-img:rounded-2xl">
            <Markdown remarkPlugins={[remarkGfm]}>
              {post.content}
            </Markdown>
          </div>
          
          {/* Tags */}
          <div className="mt-12 pt-8 border-t border-white/10">
            <h3 className="text-white font-semibold mb-4">Etichete:</h3>
            <div className="flex flex-wrap gap-2">
              {post.tags.map(tag => (
                <span key={tag} className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm text-gray-300 hover:text-white hover:border-white/30 cursor-pointer transition-colors">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
