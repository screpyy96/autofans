import { blogPosts } from './blogPosts';

export { blogPosts };

/** The index only needs card metadata; never serialize all article bodies there. */
export function getBlogPostSummaries() {
  return blogPosts.map(({ content: _content, faqs: _faqs, ...post }) => post);
}
