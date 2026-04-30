# VisionIAS Scraper (V2)

A robust, TypeScript-based scraper for VisionIAS Current Affairs, featuring automated Gujarati translation, premium HTML formatting, and Supabase integration.

## Features
- **Playwright Based**: Uses headless Chromium for fast and reliable scraping of dynamic content.
- **Auto-Translation**: Translates English articles to Gujarati using Google Translate.
- **Premium Formatting**: Applies a cinematic, mobile-optimized HTML template to articles.
- **Supabase Integration**: Automatically deduplicates and inserts articles into your Supabase database.
- **History Tracking**: Uses GitHub Gists (or local files) to keep track of scraped articles and avoid duplicates.
- **Scheduled Runs**: Built-in cron job support for daily updates.

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in your credentials:
   - `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
   - `GH_PAT` (GitHub Token) and `GIST_ID_VISIONIAS`
3. Run the scraper:
   ```bash
   npm start
   ```

## Development
- Run in dev mode: `npm run dev`
- Build: `npm run build`
