import { createClient } from '@supabase/supabase-js';

// Supabase project info
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
  'Priority': 'u=4',
  'Referer': 'https://www.draftbot.fr/',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-site',
  'Sec-GPC': '1',
  'TE': 'trailers',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0',
  'baggage': 'sentry-environment=production,sentry-release=6.3.1-rc,sentry-public_key=24c985b2b34b450097e5fedf9d57d2f8,sentry-trace_id=7e5deb61f478462ba29edf198d6630e5',
  'sentry-trace': '7e5deb61f478462ba29edf198d6630e5-9ca81e6d1e5f9fc8'
};

async function fetchAndInsertEconomy() {
  while (page < maxPage) {
    const url = new URL(`https://api.draftbot.fr/activities/economy/${GUILD_ID}`);
    url.searchParams.set('page', page);

    console.log(`Fetching page ${page}...`);

    const response = await fetch(url, { headers });
    const data = await response.json();

    if (!data.users || !Array.isArray(data.users)) {
      console.error('Unexpected response format:', data);
      break;
    }

    for (const user of data.users) {
      const { id: user_id, money, record } = user;

      const { error } = await supabase
        .from('money')
        .upsert({ user_id, money: parseInt(money), record: parseInt(record) });

      if (error) {
        console.error(`❌ Failed to insert user ${user_id}:`, error.message);
      } else {
        console.log(`✅ Inserted/Updated user ${user_id} → 💰 ${money}, 🏆 ${record}`);
      }
    }

    page++;
  }

  console.log('🎉 All pages fetched and inserted.');
}

fetchAndInsertEconomy().catch(console.error);
