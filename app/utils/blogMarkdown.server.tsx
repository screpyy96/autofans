import { renderToStaticMarkup } from 'react-dom/server';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Article Markdown is authored in this repository. Render it once on the
 * server so readers receive semantic HTML without downloading a Markdown
 * parser just to read a single article.
 */
export function renderBlogMarkdown(markdown: string) {
  return renderToStaticMarkup(
    <Markdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ href = '', children }) => {
          const external = href.startsWith('http://') || href.startsWith('https://');
          return external
            ? <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
            : <a href={href}>{children}</a>;
        },
      }}
    >
      {markdown}
    </Markdown>,
  );
}
