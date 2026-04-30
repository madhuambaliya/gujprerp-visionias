import { logger } from './utils/logger';
import { categoryCache } from './db/categories';
import { visionScraper } from './scrapers/visionias';
import { formatMobileHTML } from './formatters/html';
import { translator } from './translators/google';
import { insertNews, checkExists, generateSlug, calculateReadTime, NewsInsert } from './db/news';
import { applyNewsTemplate } from './formatters/template';
import { CONFIG } from './config';
import { historyManager } from './utils/history';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  logger.info('=== VisionIAS News Scraper Initializing ===');
  
  // Initialize caches
  await categoryCache.init();
  await historyManager.init();
  
  logger.info('[Main] Starting scrape run...');
  await runScraper();

  logger.info('[Main] Scrape run complete. Exiting.');
  process.exit(0);
}

export async function runScraper() {
  logger.info(`[Main] Starting VisionIAS scrape run...`);
  
  try {
    await visionScraper.init();

    for (const subject of CONFIG.SUBJECTS) {
      logger.info(`[Main] Processing subject: ${subject.name}`);
      
      // 1. Get listings for subject (Try Month first, then Year fallback)
      let articleUrls = await visionScraper.scrapeListing(subject.code, subject.name, 'month');
      
      if (articleUrls.length === 0) {
        logger.info(`[Main] No articles found for ${subject.name} in 'month' range. Trying 'year' fallback...`);
        articleUrls = await visionScraper.scrapeListing(subject.code, subject.name, 'year');
      }
      
      logger.info(`[Main] Found ${articleUrls.length} articles for ${subject.name}`);

      // 2. Process each article
      for (const url of articleUrls) {
        try {
          if (historyManager.isScraped(url)) {
            logger.debug(`[Main] Skipping already scraped URL (History): ${url}`);
            continue;
          }

          const exists = await checkExists(url);
          if (exists) {
            logger.debug(`[Main] Skipping existing article (DB): ${url}`);
            historyManager.addUrl(url);
            await historyManager.saveHistory();
            continue;
          }

          // Delay to be respectful
          await new Promise(resolve => setTimeout(resolve, CONFIG.DELAY_BETWEEN_REQUESTS_MS));

          // Scrape detail
          const article = await visionScraper.scrapeArticle(url, subject.name);
          if (!article || !article.body) {
            logger.warn(`[Main] Empty body or failed scrape for: ${url}`);
            continue;
          }

          // Format HTML (English)
          const formattedBodyEn = formatMobileHTML(article.body);
          
          // Translation
          let titleGu: string | null = null;
          let bodyGu: string | null = null;
          let isTranslated = false;

          if (CONFIG.TRANSLATE_TO_GUJARATI) {
            logger.info(`[Main] Translating: ${article.title}`);
            titleGu = await translator.translate(article.title);
            bodyGu = await translator.translate(formattedBodyEn);
            isTranslated = !!(titleGu && bodyGu);
          }

          // Determine category ID
          const categoryId = categoryCache.getUuid(subject.slug);

          // Prepare Insert
          const newsInsert: NewsInsert = {
            title: article.title,
            title_gu: titleGu,
            body: formattedBodyEn,
            body_gu: bodyGu,
            image_url: article.imageUrl || null,
            source: 'VisionIAS',
            source_url: url,
            category: subject.name,
            category_id: categoryId,
            published_at: article.date,
            is_active: true,
            is_featured: false,
            is_translated: isTranslated,
            translated_at: isTranslated ? new Date().toISOString() : null,
            translation_source: 'google',
            content_type: 'html',
            tags: article.tags || [],
            slug: generateSlug(article.title, article.date),
            read_time_minutes: calculateReadTime(formattedBodyEn)
          };

          // Apply Beautiful Template to Gujarati Body
          if (newsInsert.body_gu && isTranslated) {
            const templatedHtml = applyNewsTemplate({
              title_gu: titleGu || '',
              category: subject.name,
              url: url,
              body_gu: bodyGu || '',
              image_url: article.imageUrl || ''
            });
            
            newsInsert.body_gu = templatedHtml;
            
            // Force main fields to Gujarati for the app reader
            newsInsert.title = titleGu || newsInsert.title;
            newsInsert.body = templatedHtml;
          }

          // Insert to DB
          const success = await insertNews(newsInsert);
          if (success) {
            logger.info(`[Main] Successfully inserted: ${article.title}`);
            historyManager.addUrl(url);
            await historyManager.saveHistory();
            
            if (process.argv.includes('--test')) {
              logger.info('[Main] --test mode: Successfully processed 1 article. Exiting.');
              return; 
            }
          }

        } catch (err) {
          logger.error(`[Main] Error processing article ${url}:`, err);
        }
      }
    }

  } catch (err) {
    logger.error('[Main] Critical error in scraper run:', err);
  } finally {
    await visionScraper.close();
  }
}

if (require.main === module) {
  main().catch(err => {
    logger.error('[Main] Fatal initialization error:', err);
    process.exit(1);
  });
}
