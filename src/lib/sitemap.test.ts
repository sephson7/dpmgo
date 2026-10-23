import { describe, expect, it } from 'vitest';
import { getRouter } from '@/router';
import { sitemapStaticPaths, sitemapXML } from './sitemap';

describe('public sitemap boundaries', () => {
  it('includes the rider guide but not checkout, admin, redirects or APIs', () => {
    expect(sitemapStaticPaths(getRouter())).toEqual(['/']);
  });
  it('uses the public domain and does not invent modification dates', () => {
    const xml = sitemapXML('https://dpmgo.app', [{ path: '/' }, { path: '/' }]);
    expect(xml).toContain('<loc>https://dpmgo.app/</loc>');
    expect(xml.match(/<url>/g)).toHaveLength(1);
    expect(xml).not.toContain('<lastmod>');
  });
  it('rejects external URLs and query-string URLs', () => {
    expect(() => sitemapXML('https://dpmgo.app', [{ path: '//other.example/' }])).toThrow();
    expect(() => sitemapXML('https://dpmgo.app', [{ path: '/?session_id=private' }])).toThrow();
  });
});