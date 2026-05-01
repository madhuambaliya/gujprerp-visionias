import translate from 'google-translate-api-next';
import { logger } from '../utils/logger';

export class GoogleTranslator {
  private MAX_CHUNK_SIZE = 2000; // Safer limit for free API

  async translate(text: string, targetLanguage: string = 'gu'): Promise<string | null> {
    if (!text || text.trim() === '') return null;

    // If text is too long, split it into chunks
    if (text.length > this.MAX_CHUNK_SIZE) {
      return this.translateLongText(text, targetLanguage);
    }

    return this.translateWithRetry(text, targetLanguage);
  }

  private async translateWithRetry(text: string, targetLanguage: string, retries: number = 2): Promise<string | null> {
    for (let i = 0; i <= retries; i++) {
      try {
        const res = await translate(text, { to: targetLanguage });
        
        if (this.isTranslated(res.text)) {
          return res.text;
        } else {
          logger.warn(`[Translator] Attempt ${i + 1}: Translation returned English for: ${text.substring(0, 30)}...`);
        }
      } catch (error: any) {
        logger.error(`[Translator] Attempt ${i + 1} Error:`, error.message || error);
        if (i < retries) {
          const delay = 1000 * (i + 1);
          await new Promise(r => setTimeout(r, delay));
        }
      }
    }
    return null;
  }

  private async translateLongText(text: string, targetLanguage: string): Promise<string | null> {
    logger.info(`[Translator] Splitting long text into chunks (${text.length} chars)`);
    
    // Split by paragraphs to keep context
    const paragraphs = text.split('\n');
    let chunks: string[] = [];
    let currentChunk = '';

    for (const p of paragraphs) {
      if ((currentChunk.length + p.length) < this.MAX_CHUNK_SIZE) {
        currentChunk += (currentChunk ? '\n' : '') + p;
      } else {
        if (currentChunk) chunks.push(currentChunk);
        currentChunk = p;
      }
    }
    if (currentChunk) chunks.push(currentChunk);

    let translatedChunks: string[] = [];
    for (const chunk of chunks) {
      const translated = await this.translateWithRetry(chunk, targetLanguage);
      if (!translated) {
        logger.error('[Translator] Failed to translate a chunk of long text.');
        return null; // Fail the whole article to avoid mixed content
      }
      translatedChunks.push(translated);
      await new Promise(r => setTimeout(r, 500)); // Delay between chunks
    }

    return translatedChunks.join('\n');
  }

  private isTranslated(text: string): boolean {
    // Gujarati characters are in the range \u0A80-\u0AFF
    const gujaratiRegex = /[\u0A80-\u0AFF]/;
    return gujaratiRegex.test(text);
  }

  async translateBatch(texts: string[], targetLanguage: string = 'gu'): Promise<(string | null)[]> {
    if (!texts || texts.length === 0) return [];

    const results: (string | null)[] = [];
    for (const text of texts) {
      const result = await this.translate(text, targetLanguage);
      results.push(result);
      // Small delay to avoid rate limits on free API
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    return results;
  }
}

export const translator = new GoogleTranslator();
