import * as cheerio from 'cheerio';
import { decode } from 'html-entities';

/**
 * Formats HTML content for mobile-first display in React Native RenderHTML component.
 */
export const formatMobileHTML = (html: string): string => {
  if (!html) return '';

  const $ = cheerio.load(html);

  // Remove unwanted elements
  $('script, style, iframe, link, meta, noscript').remove();
  
  // VisionIAS specific removals
  $('[wire\\:click], [x-data], button').remove();

  // Strip all hyperlinks but keep text
  $('a').each((_, el) => {
    const $el = $(el);
    $el.replaceWith($el.text());
  });

  // Process all elements
  $('*').each((_, el) => {
    const $el = $(el);
    
    // Remove all attributes except src, style
    const attribs = $el.attr();
    if (attribs) {
      Object.keys(attribs).forEach(attr => {
        if (!['src', 'style'].includes(attr)) {
          $el.removeAttr(attr);
        }
      });
    }

    // Remove inline styles
    $el.removeAttr('style');
  });

  // Specific handling for images
  $('img').each((_, el) => {
    const $el = $(el);
    $el.attr('style', 'width:100%;height:auto;border-radius:12px;margin:10px 0;');
    $el.removeAttr('srcset');
    $el.removeAttr('sizes');
    $el.removeAttr('width');
    $el.removeAttr('height');
  });

  // Specific handling for tables
  $('table').each((_, el) => {
    $(el).attr('style', 'width:100%;border-collapse:collapse;margin:15px 0;font-size:0.9rem;');
  });
  $('th, td').each((_, el) => {
    $(el).attr('style', 'border:1px solid #e0e0e0;padding:10px;text-align:left;');
  });

  // Clean up empty tags
  $('p, h2, h3, div').each((_, el) => {
    const $el = $(el);
    if (!$el.text().trim() && $el.find('img').length === 0) {
      $el.remove();
    }
  });

  // Final HTML cleanup
  let cleaned = $('body').html() || '';
  
  // Decode HTML entities
  cleaned = decode(cleaned);
  
  cleaned = cleaned.replace(/&nbsp;/g, ' ');
  cleaned = cleaned.replace(/<p>\s*<\/p>/g, '');
  
  return cleaned.trim();
};
