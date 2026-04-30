import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugDatabase() {
  console.log('=== Database Debug Report ===');

  const { count: totalNews } = await supabase.from('news').select('*', { count: 'exact', head: true });
  console.log('Total News Articles:', totalNews);

  // 0. Dump ALL categories
  console.log('\n--- ALL Categories in DB ---');
  const { data: allCats } = await supabase.from('news_categories').select('id, name, slug, is_active');
  console.table(allCats);
  const { data: finalStats } = await supabase.rpc('get_news_category_stats'); // Assuming this exists or just query
  
  // Alternative query
  const { data: counts } = await supabase
    .from('news_categories')
    .select('id, name, slug, is_active, news(count)');

  const stats: any[] = counts?.map(c => ({
    name: c.name,
    slug: c.slug,
    id: c.id,
    active: c.is_active,
    count: (c.news as any)?.[0]?.count || 0
  })).filter(s => s.count > 0) || [];

  console.log('\n--- Category Recency & Active Status Check ---');
  for (const cat of stats) {
    const { data: latest } = await supabase
      .from('news')
      .select('published_at, is_active')
      .eq('category_id', cat.id)
      .order('published_at', { ascending: false })
      .limit(1);
    cat.latest = latest?.[0]?.published_at;
    cat.latest_active = latest?.[0]?.is_active;

    const { count: activeCount } = await supabase
      .from('news')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', cat.id)
      .eq('is_active', true);
    cat.active_count = activeCount;
  }
  console.table(stats);
}

debugDatabase();
