import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";

if (!env.supabaseUrl) {
	throw new Error("Missing SUPABASE_URL in environment variables.");
}

if (!env.supabaseSecretKey) {
	throw new Error("Missing SUPABASE_SECRET_KEY in environment variables.");
}

export const supabase = createClient(env.supabaseUrl, env.supabaseSecretKey, {
	auth: {
		persistSession: false,
		autoRefreshToken: false,
	},
});
