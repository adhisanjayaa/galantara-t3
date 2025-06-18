// File: src/server/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";
import { env } from "~/env.js";

// Inisialisasi klien Supabase dengan URL dan Kunci Servis dari environment variables
export const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      // Nonaktifkan penyimpanan sesi otomatis karena kita akan menangani otorisasi di sisi server
      persistSession: false,
      autoRefreshToken: false,
    },
  },
);
