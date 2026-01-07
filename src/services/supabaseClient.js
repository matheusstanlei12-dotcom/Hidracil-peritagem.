
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log("Supabase Client Init - URL:", supabaseUrl ? "Found" : "MISSING");
console.log("Supabase Client Init - Key:", supabaseAnonKey ? "Found" : "MISSING");

let supabase = null;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase URL or Key missing!", { supabaseUrl, supabaseAnonKey });
} else {
    try {
        supabase = createClient(supabaseUrl, supabaseAnonKey);
        console.log("Supabase Client created successfully.");
    } catch (err) {
        console.error("Error creating Supabase client:", err);
    }
}

export { supabase };

