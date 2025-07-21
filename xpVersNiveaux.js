import { createClient } from '@supabase/supabase-js';
import { getDopplerClient } from './utility/doppler.js'

await getDopplerClient()

// Supabase project info
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Custom XP → Level formula
 * Change this function to match your own formula
 */
function calculateLevelFromXp(xp) {
    let level = 0;

    while (true) {
        const requiredXp = Math.floor(50 * Math.pow(level + 1, 1.25));
        if (xp < requiredXp) break;
        level++;
    }

    return level;
}

async function updateAllLevelsFromXp() {
  const { data, error } = await supabase
    .from('levels')
    .select('user_id, total_xp');

  if (error) {
    console.error('❌ Failed to fetch rows:', error.message);
    return;
  }

  console.log(`🔄 Updating ${data.length} users...`);

  for (const row of data) {
    const newLevel = calculateLevelFromXp(row.total_xp);

    const { error: updateError } = await supabase
      .from('levels')
      .update({ level: newLevel })
      .eq('user_id', row.user_id);

    if (updateError) {
      console.error(`❌ Failed to update ${row.user_id}:`, updateError.message);
    } else {
      console.log(`✅ Updated ${row.user_id} → Level ${newLevel}`);
    }
  }

  console.log('🎉 All levels updated!');
}

updateAllLevelsFromXp().catch(console.error);