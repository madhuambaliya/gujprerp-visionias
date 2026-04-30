/**
 * Configuration and constants for VisionIAS Scraper
 */

export const CONFIG = {
  BASE_URL: 'https://visionias.in',
  SEARCH_URL: 'https://visionias.in/current-affairs/search',
  PAGES_TO_SCRAPE: parseInt(process.env.PAGES_TO_SCRAPE || '2'),
  DELAY_BETWEEN_REQUESTS_MS: parseInt(process.env.DELAY_BETWEEN_REQUESTS_MS || '2000'),
  TRANSLATE_TO_GUJARATI: process.env.TRANSLATE_TO_GUJARATI !== 'false',

  // VisionIAS Subjects mapped to their own specific slugs
  SUBJECTS: [
    { code: 1, name: 'Culture', slug: 'art-and-culture' },
    { code: 2, name: 'History', slug: 'history' },
    { code: 3, name: 'Social Issue', slug: 'social-issues' },
    { code: 4, name: 'Geography', slug: 'geography' },
    { code: 5, name: 'Polity and Governance', slug: 'polity-and-governance' },
    { code: 6, name: 'International Relations', slug: 'international-relations' },
    { code: 7, name: 'Economy', slug: 'economy' },
    { code: 8, name: 'Environment', slug: 'environment' },
    { code: 9, name: 'Science and Technology', slug: 'science-and-technology' },
    { code: 10, name: 'Security', slug: 'security' },
    { code: 11, name: 'Ethics', slug: 'ethics' },
    { code: 12, name: 'Maps', slug: 'maps' },
    { code: 13, name: 'Personalities in News', slug: 'personalities-in-news' },
    { code: 14, name: 'Places in News', slug: 'places-in-news' },
    { code: 15, name: 'Schemes in News', slug: 'schemes-in-news' },
    { code: 16, name: 'Miscellaneous', slug: 'miscellaneous' },
  ],

  // Fallback map for category UUIDs
  CATEGORY_MAP: {
    'current_affairs': { slug: 'current_affairs', uuid: '6624e756-a258-4c7a-ad8e-8ec46c478bdd' },
    'art-and-culture': { slug: 'art-and-culture', uuid: '' },
    'history': { slug: 'history', uuid: '' },
    'social-issues': { slug: 'social-issues', uuid: '' },
    'geography': { slug: 'geography', uuid: '' },
    'polity-and-governance': { slug: 'polity-and-governance', uuid: '' },
    'international-relations': { slug: 'international-relations', uuid: '' },
    'economy': { slug: 'economy', uuid: '' },
    'environment': { slug: 'environment', uuid: '' },
    'science-and-technology': { slug: 'science-and-technology', uuid: '' },
    'security': { slug: 'security', uuid: '' },
    'ethics': { slug: 'ethics', uuid: '' },
    'maps': { slug: 'maps', uuid: '' },
    'personalities-in-news': { slug: 'personalities-in-news', uuid: '' },
    'places-in-news': { slug: 'places-in-news', uuid: '' },
    'schemes-in-news': { slug: 'schemes-in-news', uuid: '' },
    'miscellaneous': { slug: 'miscellaneous', uuid: '' },
    'default': { slug: 'current_affairs', uuid: '6624e756-a258-4c7a-ad8e-8ec46c478bdd' },
  } as Record<string, { slug: string, uuid: string }>
};

export function getSubjectUrl(subjectCode: number) {
  return `${CONFIG.SEARCH_URL}?subject=${subjectCode}&sort=recent&query=&type=articles&initiative=&time=month`;
}
