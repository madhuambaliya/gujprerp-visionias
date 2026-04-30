# VisionIAS Scraper (V2)

A robust, TypeScript-based scraper for VisionIAS Current Affairs, featuring automated Gujarati translation, premium HTML formatting, and Supabase integration.

## Features
- **Playwright Based**: Uses headless Chromium for fast and reliable scraping of dynamic content.
- **Auto-Translation**: Translates English articles to Gujarati using Google Translate.
- **Premium Formatting**: Applies a cinematic, mobile-optimized HTML template to articles.
- **Supabase Integration**: Automatically deduplicates and inserts articles into your Supabase database.
- **History Tracking**: Uses GitHub Gists to keep track of scraped articles and avoid duplicates across GitHub Action runs.
- **GitHub Actions Ready**: Pre-configured workflow for scheduled daily runs.

## Local Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file from `.env.example` and fill in your credentials:
   - `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
   - `GH_PAT`: Your GitHub Personal Access Token (with `gist` scope)
   - `GIST_ID_VISIONIAS`: (Optional) The ID of the Gist to store history. If left blank, the script will create one for you and print the ID.
3. Run the scraper:
   ```bash
   npm start
   ```

## Deployment (GitHub Actions)
This project is ready to run on GitHub Actions. To set it up:

1. **GitHub Secrets**: Go to your repository settings > Secrets and variables > Actions and add the following secrets:
   - `SUPABASE_URL`: Your Supabase Project URL.
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase Service Role Key.
   - `GH_PAT`: A GitHub Personal Access Token with `gist` scope.
   - `GIST_ID_VISIONIAS`: (Optional) The Gist ID for history tracking.

2. **Workflow**: The scraper is scheduled to run twice daily (10:00 AM and 06:30 PM IST) via `.github/workflows/daily-scrape.yml`. You can also trigger it manually from the "Actions" tab.

## Development
- Run in dev mode: `npm run dev`
- Build: `npm run build`
- Test run (1 article): `npm run test-run`
