import { getSupabaseClient } from "./utility/supabase.js"
const supabase = getSupabaseClient()

export async function getLevel(user_id) {
    const { data, error } = await supabase
        .from('levels')
        .select('level, total_xp')
        .eq('user_id', user_id)
        .single()
    
    if (error) {
        if (error.code === "PGRST116") {
            const { error: levelsError } = await supabase
                .from('levels')
                .insert({ user_id: user_id, level: 0, total_xp: 0 });
            
            return getLevel(user_id)
        } else {
            console.error(`❌ Impossible de récupérer les données pour l'utilisateur ${user_id}:`, error.message);
        }
    }

    return data
}

export async function getMoney(user_id) {
    const { data, error } = await supabase
        .from('money')
        .select('money, record')
        .eq('user_id', user_id)
        .single()
    
    if (error) {
        if (error.code === "PGRST116") {
            const { error: moneyError } = await supabase
                .from('money')
                .insert({ user_id: user_id, level: 0, total_xp: 0 });
            
            return getMoney(user_id)
        } else {
            console.error(`❌ Impossible de récupérer les données pour l'utilisateur ${user_id}:`, error.message);
        }
    }

    return data
}

export async function getTopLevel(top = 5) {
    const { data, error } = await supabase
        .from('levels')
        .select('user_id, level, total_xp')
        .order('total_xp', { ascending: false })
        .limit(top)

    if (error) {
        console.error('❌ Impossible de récupérer les données des utilisateurs:', error.message);
    }

    return data
}