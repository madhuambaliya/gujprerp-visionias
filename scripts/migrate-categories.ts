import { getSupabaseClient } from '../src/db/client';
import { logger } from '../src/utils/logger';
import slugify from 'slugify';
import dotenv from 'dotenv';

dotenv.config();

const VISION_CATEGORIES = [
  { name: 'Culture' },
  { name: 'History' },
  { name: 'Social Issue' },
  { name: 'Geography' },
  { name: 'Polity and Governance' },
  { name: 'International Relations' },
  { name: 'Economy' },
  { name: 'Environment' },
  { name: 'Science and Technology' },
  { name: 'Security' },
  { name: 'Ethics' },
  { name: 'Maps' },
  { name: 'Personalities in News' },
  { name: 'Places in News' },
  { name: 'Schemes in News' },
  { name: 'Miscellaneous' },
];

async function migrate() {
  logger.info('🚀 Starting Category Migration...');
  const supabase = getSupabaseClient();

  try {
    // 1. Delete all categories except 'current_affairs'
    logger.info('🗑️ Deleting old categories (except current_affairs)...');
    const { error: deleteError } = await supabase
      .from('news_categories')
      .delete()
      .neq('slug', 'current_affairs');

    if (deleteError) {
      // Check if deletion failed due to foreign key constraints
      if (deleteError.code === '23503') {
        logger.warn('⚠️ Could not delete some categories because they are linked to existing news articles.');
        logger.info('Continuing with insertion of new categories...');
      } else {
        throw deleteError;
      }
    } else {
      logger.info('✅ Successfully cleared old categories.');
    }

    // 2. Insert VisionIAS categories
    logger.info('📥 Inserting VisionIAS categories...');
    const categoriesToInsert = VISION_CATEGORIES.map(cat => ({
      name: cat.name,
      slug: slugify(cat.name, { lower: true, strict: true }),
      is_active: true
    }));

    for (const cat of categoriesToInsert) {
      const { data, error } = await supabase
        .from('news_categories')
        .upsert(cat, { onConflict: 'slug' })
        .select()
        .single();

      if (error) {
        logger.error(`❌ Failed to insert category: ${cat.name}`, error);
      } else {
        logger.info(`✅ Category synced: ${cat.name} (${data.id})`);
      }
    }

    logger.info('🎉 Migration complete!');
  } catch (error) {
    logger.error('💥 Critical error during migration:', error);
  }
}

migrate();
