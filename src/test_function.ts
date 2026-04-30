import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../android-app/.env') });

const url = 'https://jfctlkzstlkpozgpqnyb.supabase.co/functions/v1/v1/get-news-categories';
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

async function testFunction() {
  try {
    const response = await axios.get(url, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`
      }
    });
    console.log('Status:', response.status);
    console.log('Categories Count:', response.data.data.categories.length);
    console.log('Categories:', response.data.data.categories.map((c: any) => `${c.name} (${c.article_count})`).join(', '));
  } catch (error: any) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testFunction();
