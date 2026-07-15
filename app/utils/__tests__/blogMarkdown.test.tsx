import { describe, expect, it } from 'vitest';
import { renderBlogMarkdown } from '../blogMarkdown.server';

describe('renderBlogMarkdown', () => {
  it('renders semantic Markdown and protects external links', () => {
    const html = renderBlogMarkdown('## Titlu\n\n[Link extern](https://example.com)');

    expect(html).toContain('<h2>Titlu</h2>');
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it('keeps authored raw HTML inert', () => {
    const html = renderBlogMarkdown('Text <script>alert("x")</script>');

    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});
