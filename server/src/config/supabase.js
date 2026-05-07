import { createClient } from "@supabase/supabase-js";
import { AsyncLocalStorage } from "node:async_hooks";
import { fetch, Headers, Request, Response } from "undici";
import WebSocket from "ws";
import { env } from "./env.js";

if (!globalThis.fetch) globalThis.fetch = fetch;
if (!globalThis.Headers) globalThis.Headers = Headers;
if (!globalThis.Request) globalThis.Request = Request;
if (!globalThis.Response) globalThis.Response = Response;

if (!env.supabaseUrl) {
	throw new Error("Missing SUPABASE_URL in environment variables.");
}

if (!env.supabaseSecretKey) {
	throw new Error("Missing SUPABASE_SECRET_KEY in environment variables.");
}

const requestContext = new AsyncLocalStorage();

export const supabaseAdmin = createClient(env.supabaseUrl, env.supabaseSecretKey, {
	auth: {
		persistSession: false,
		autoRefreshToken: false,
	},
	realtime: {
		transport: WebSocket,
	},
});

export function createSupabaseForToken(token) {
	if (!env.supabaseAnonKey) {
		throw new Error("Missing SUPABASE_ANON_KEY in environment variables.");
	}

	return createClient(env.supabaseUrl, env.supabaseAnonKey, {
		global: {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		},
		auth: {
			persistSession: false,
			autoRefreshToken: false,
		},
		realtime: {
			transport: WebSocket,
		},
	});
}

export function bindSupabaseContext(req, res, next) {
	requestContext.run({ supabase: supabaseAdmin }, () => next());
}

export function setRequestSupabase(client) {
	const store = requestContext.getStore();
	if (store) {
		store.supabase = client;
	}
}

export function getSupabase(req) {
	return req?.supabase || requestContext.getStore()?.supabase || supabaseAdmin;
}

export const supabase = new Proxy(
	{},
	{
		get(_target, prop) {
			const client = getSupabase();
			const value = client[prop];
			return typeof value === "function" ? value.bind(client) : value;
		},
	},
);
