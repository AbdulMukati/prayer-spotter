// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://tidzojlnrijhmtmwytrr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpZHpvamxucmlqaG10bXd5dHJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5MTQyNDQsImV4cCI6MjA1MDQ5MDI0NH0.ysTfMbJXQ6XM8xPEGTTSm7Bf6O3aetdQ72Iyh8_3J4E";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);