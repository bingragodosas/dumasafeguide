
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://mulpurkwsadxohfpbcsu.supabase.co";

const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11bHB1cmt3c2FkeG9oZnBiY3N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3Njg2MTEsImV4cCI6MjA5MDM0NDYxMX0.a2IiLRTojN87mpty8CqCWAnHblqynX65NbIWPmWoYQE";

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);