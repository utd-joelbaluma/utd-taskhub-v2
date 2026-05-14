import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";

// Supabase-js PKCE flow writes the code verifier to its configured `storage`
// adapter. On the server we have no localStorage, so we hand it an in-memory
// object that conforms to the Web Storage interface it expects.
export function createMemoryStorage(seed = {}) {
	const store = new Map(Object.entries(seed));
	return {
		getItem: (key) => (store.has(key) ? store.get(key) : null),
		setItem: (key, value) => {
			store.set(key, value);
		},
		removeItem: (key) => {
			store.delete(key);
		},
		_dump: () => Object.fromEntries(store),
	};
}

// The verifier key supabase-js uses is `sb-<project-ref>-auth-token-code-verifier`.
// We don't need to compute it precisely — we just sweep the storage map and
// pull out whichever entry ends with `-code-verifier`.
export function extractCodeVerifier(storage) {
	const entries = storage._dump();
	for (const [key, value] of Object.entries(entries)) {
		if (key.endsWith("-code-verifier") && typeof value === "string") {
			return { key, verifier: value };
		}
	}
	return { key: null, verifier: null };
}

export function createOAuthClient(storage) {
	if (!env.supabaseAnonKey) {
		throw new Error("Missing SUPABASE_ANON_KEY in environment variables.");
	}
	return createClient(env.supabaseUrl, env.supabaseAnonKey, {
		auth: {
			flowType: "pkce",
			persistSession: false,
			autoRefreshToken: false,
			detectSessionInUrl: false,
			storage,
		},
	});
}
