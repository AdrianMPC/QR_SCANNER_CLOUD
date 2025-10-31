// src/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("⚠️ Faltan REACT_APP_SUPABASE_URL o REACT_APP_SUPABASE_KEY en .env");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
