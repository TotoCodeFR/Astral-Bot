import { createClient } from '@supabase/supabase-js';

// Replace with your actual Supabase project details
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const GUILD_ID = '1200739738013937664';
let page = 0;
const maxPage = 11;

const headers = {
  'Accept': '*/*',
  'Accept-Encoding': 'identity',
  'Accept-Language': 'en-US,en;q=0.5',
  'Connection': 'keep-alive',
  'Origin': 'https://www.draftbot.fr',
  'Referer': 'https://www.draftbot.fr/',
  'User-Agent': 'Mozilla/5.0 (Node.js)',
  'baggage': 'sentry-environment=production,sentry-release=6.3.1-rc,sentry-public_key=24c985b2b34b450097e5fedf9d57d2f8,sentry-trace_id=576e4fedcf924b77a007cbf67911b08f',
  'sentry-trace': '576e4fedcf924b77a007cbf67911b08f-b878c593975f9919'
};

async function fetchAndInsertLevels() {
  while (page < maxPage) {
    const url = new URL(`https://api.draftbot.fr/activities/levels/${GUILD_ID}`);
    url.searchParams.set('page', page);

    console.log(`Fetching page ${page}...`);

    const response = await fetch(url, { headers });
    const data = await response.json();

    if (!data.users || !Array.isArray(data.users)) {
      console.error('Unexpected response format:', data);
      break;
    }

    for (const user of data.users) {
      const { id: user_id, level, totalXp } = user;

      const { error } = await supabase
        .from('levels')
        .upsert({ user_id, level, total_xp: parseInt(totalXp) });

      if (error) {
        console.error(`Failed to insert user ${user_id}:`, error.message);
      } else {
        console.log(`Inserted/Updated user ${user_id} → Level ${level}, XP ${totalXp}`);
      }
    }

    page++;
  }

  console.log('✅ All pages fetched and inserted.');
}

fetchAndInsertLevels().catch(console.error);
