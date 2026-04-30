import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixData() {
  console.log('=== Merging Categories and Fixing Data ===');

  // 1. Merge Culture into Art and Culture
  const { data: cult } = await supabase.from('news_categories').select('id').eq('slug', 'culture').maybeSingle();
  const { data: art } = await supabase.from('news_categories').select('id').eq('slug', 'art-and-culture').maybeSingle();

  if (cult && art) {
    console.log('Merging Culture -> Art and Culture');
    await supabase.from('news').update({ category_id: art.id, category: 'Art and Culture' }).eq('category_id', cult.id);
    await supabase.from('news_categories').delete().eq('id', cult.id);
  }

  // 2. Merge Social Issue into Social Issues
  const { data: soc1 } = await supabase.from('news_categories').select('id').eq('slug', 'social-issue').maybeSingle();
  const { data: soc2 } = await supabase.from('news_categories').select('id').eq('slug', 'social-issues').maybeSingle();

  if (soc1 && soc2) {
    console.log('Merging Social Issue -> Social Issues');
    await supabase.from('news').update({ category_id: soc2.id, category: 'Social Issues' }).eq('category_id', soc1.id);
    await supabase.from('news_categories').delete().eq('id', soc1.id);
  }

  // 3. Merge Polity into Polity and Governance
  const { data: pol1 } = await supabase.from('news_categories').select('id').eq('slug', 'polity').maybeSingle();
  const { data: pol2 } = await supabase.from('news_categories').select('id').eq('slug', 'polity-and-governance').maybeSingle();

  if (pol1 && pol2) {
    console.log('Merging Polity -> Polity and Governance');
    await supabase.from('news').update({ category_id: pol2.id, category: 'Polity and Governance' }).eq('category_id', pol1.id);
    await supabase.from('news_categories').delete().eq('id', pol1.id);
  }

  // 4. Boost VisionIAS visibility
  console.log('Boosting VisionIAS visibility...');
  await supabase.from('news').update({ published_at: new Date().toISOString() }).eq('source', 'VisionIAS');

  console.log('Done.');
}

fixData();
