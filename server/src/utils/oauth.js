import crypto from "node:crypto";
import { env } from "../config/env.js";

// We manage PKCE ourselves and call Supabase's auth REST endpoints directly.
// supabase-js v2 server-side PKCE via a custom storage adapter proved
// unreliable (storage adapter never received the verifier write), so we
// generate the verifier/challenge here, set the verifier in a signed cookie,
// and exchange the code through `/auth/v1/token?grant_type=pkce`.

function base64urlEncode(buf) {
	return buf
		.toString("base64")
		.replace(/=+$/g, "")
		.replace(/\+/g, "-")
		.replace(/\//g, "_");
}

export function generatePKCEPair() {
	const verifier = base64urlEncode(crypto.randomBytes(64));
	const challenge = base64urlEncode(
		crypto.createHash("sha256").update(verifier).digest(),
	);
	return { verifier, challenge };
}

export function buildGoogleAuthorizeUrl({ redirectTo, codeChallenge }) {
	const params = new URLSearchParams({
		provider: "google",
		redirect_to: redirectTo,
		code_challenge: codeChallenge,
		code_challenge_method: "s256",
		flow_type: "pkce",
	});
	return `${env.supabaseUrl}/auth/v1/authorize?${params.toString()}`;
}

export async function exchangePKCEForSession({ code, verifier }) {
	if (!env.supabaseAnonKey) {
		throw new Error("Missing SUPABASE_ANON_KEY in environment variables.");
	}
	const url = `${env.supabaseUrl}/auth/v1/token?grant_type=pkce`;
	const res = await fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			apikey: env.supabaseAnonKey,
			Authorization: `Bearer ${env.supabaseAnonKey}`,
		},
		body: JSON.stringify({
			auth_code: code,
			code_verifier: verifier,
		}),
	});
	const json = await res.json().catch(() => ({}));
	if (!res.ok) {
		return { data: null, error: { status: res.status, body: json } };
	}
	return { data: json, error: null };
}
