import { chromium, Browser, BrowserContext, Page } from 'playwright';
import * as cheerio from 'cheerio';
import { CONFIG, getSubjectUrl } from '../config';
import { logger } from '../utils/logger';

export interface VisionArticle {
  title: string;
  url: string;
  body: string;
  category: string;
  date: string;
  imageUrl?: string;
  tags?: string[];
}

export class VisionIASScraper {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;

  async init() {
    logger.info('[VisionIAS] Launching browser...');
    this.browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    this.context = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      logger.info('[VisionIAS] Browser closed');
    }
  }

  private async createFastPage(): Promise<Page> {
    if (!this.context) throw new Error('Scraper not initialized');
    const page = await this.context.newPage();
    await page.route('**/*', route => {
      const type = route.request().resourceType();
      if (['image', 'media', 'font'].includes(type)) {
        route.abort();
      } else {
        route.continue();
      }
    });
    return page;
  }

  async scrapeListing(subjectCode: number, subjectName: string, timeRange: 'month' | 'year' = 'month'): Promise<string[]> {
    const url = `${CONFIG.SEARCH_URL}?subject=${subjectCode}&sort=recent&query=&type=articles&initiative=&time=${timeRange}`;
    logger.info(`[VisionIAS] Fetching articles for: ${subjectName} (Range: ${timeRange}) from ${url}`);

    const page = await this.createFastPage();
    const links: string[] = [];

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await new Promise(r => setTimeout(r, 4000)); // Wait for Livewire

      // Load more if needed
      for (let i = 0; i < (CONFIG.PAGES_TO_SCRAPE - 1); i++) {
        try {
          const loadMoreButton = await page.$('button[wire\\:click="loadMore"]');
          if (!loadMoreButton || !(await loadMoreButton.isVisible())) break;
          await loadMoreButton.click();
          await new Promise(r => setTimeout(r, 3000));
        } catch (e) {
          break;
        }
      }

      const content = await page.content();
      const $ = cheerio.load(content);
      const articleUrlPattern = /\/current-affairs\/(news-today\/\d{4}-\d{2}-\d{2}\/|upsc-daily-news-summary\/article\/)/;
      const now = new Date();
      const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      
      // Calculate next month
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const nextMonthStr = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`;

      $('a[href]').each((i, el) => {
        const href = $(el).attr('href');
        if (!href) return;
        if (!articleUrlPattern.test(href)) return;
        if (href.endsWith('/archive') || href.includes('/search') || href.includes('page=')) return;

        // Filter by current or next month if date is in URL (Skip if SCRAPE_HISTORICAL is true)
        const hasDate = href.match(/\d{4}-\d{2}-\d{2}/);
        if (hasDate && process.env.SCRAPE_HISTORICAL !== 'true') {
          const dateStr = hasDate[0];
          if (!dateStr.startsWith(currentMonthStr) && !dateStr.startsWith(nextMonthStr)) {
            return; // Skip old months
          }
        }

        const fullUrl = href.startsWith('http') ? href : `${CONFIG.BASE_URL}${href}`;
        if (!links.includes(fullUrl)) {
          links.push(fullUrl);
        }
      });

    } catch (error) {
      logger.error(`[VisionIAS] Error fetching listing for ${subjectName}:`, error);
    } finally {
      await page.close();
    }

    return links;
  }

  async scrapeArticle(articleUrl: string, category: string): Promise<VisionArticle | null> {
    const page = await this.createFastPage();
    try {
      await page.goto(articleUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await new Promise(r => setTimeout(r, 2000));

      const content = await page.content();
      const $ = cheerio.load(content);
      const articleContent = $('#article-content');

      if (!articleContent.length) return null;

      let title = this.extractTitleFromUrl(articleUrl);
      let bodyHtml = articleContent.html() || '';

      // Extract date from URL or content
      // We use the current time for published_at so new scrapes appear at the top
      let date = new Date().toISOString();
      const dateMatch = articleUrl.match(/(\d{4})-(\d{2})-(\d{2})/);
      // If we want to keep the historical date, we could store it elsewhere, 
      // but for the app's news feed, 'published_at' controls sorting.

      return {
        title: title || 'Untitled Article',
        url: articleUrl,
        body: bodyHtml,
        category: category,
        date: date,
        imageUrl: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80&w=1000'
      };

    } catch (error) {
      logger.error(`[VisionIAS] Error scraping article ${articleUrl}:`, error);
      return null;
    } finally {
      await page.close();
    }
  }

  private extractTitleFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const fragment = urlObj.hash.replace('#', '');
      if (fragment && fragment.length > 2) return this.formatSlug(fragment);
      
      const parts = urlObj.pathname.split('/').filter(Boolean);
      const slug = parts.pop();
      if (slug && !slug.match(/^\d{4}-\d{2}-\d{2}$/) && slug !== 'article') return this.formatSlug(slug);
      
      const prevSlug = parts.pop();
      if (prevSlug) return this.formatSlug(prevSlug);
    } catch (e) {}
    return '';
  }

  private formatSlug(slug: string): string {
    return slug.replace(/-/g, ' ').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
}

export const visionScraper = new VisionIASScraper();
