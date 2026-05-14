import { supabase, supabaseAdmin } from "../config/supabase.js";
import { env } from "../config/env.js";
import {
	createMemoryStorage,
	extractCodeVerifier,
	createOAuthClient,
} from "../utils/oauth.js";
import {
	validateRegister,
	validateLogin,
	validateRefreshSession,
} from "../utils/auth.validator.js";

const PKCE_COOKIE_NAME = "sb_pkce";
const PKCE_COOKIE_MAX_AGE_MS = 10 * 60 * 1000;

function clientRedirect(res, params) {
	const query = new URLSearchParams(params).toString();
	return res.redirect(`${env.appUrl}/auth/callback?${query}`);
}

function clientRedirectWithSession(res, session) {
	const hash = new URLSearchParams({
		access_token: session.access_token,
		refresh_token: session.refresh_token,
		expires_at: String(session.expires_at ?? ""),
	}).toString();
	return res.redirect(`${env.appUrl}/auth/callback#${hash}`);
}

function pkceCookieOptions() {
	return {
		httpOnly: true,
		signed: true,
		secure: env.nodeEnv !== "development",
		sameSite: "lax",
		path: "/",
		maxAge: PKCE_COOKIE_MAX_AGE_MS,
	};
}

export async function register(req, res, next) {
	try {
		const errors = validateRegister(req.body);

		if (errors.length > 0) {
			return res.status(400).json({
				success: false,
				message: "Validation failed.",
				errors,
			});
		}

		const { email, password, full_name, role } = req.body;

		const { data: authData, error: authError } =
			await supabaseAdmin.auth.admin.createUser({
				email: email.trim().toLowerCase(),
				password,
				email_confirm: true,
				user_metadata: {
					full_name: full_name?.trim() || null,
					role: role,
				},
			});
		if (authError) {
			if (
				authError.message.toLowerCase().includes("already registered")
			) {
				return res.status(409).json({
					success: false,
					message: "An account with this email already exists.",
				});
			} else {
				return res.status(500).json({
					success: false,
					message: authError.message,
				});
			}
		}

		// Trigger has already inserted the profile row; update full_name and role
		const { data: profile, error: profileError } = await supabaseAdmin
			.from("profiles")
			.update({ full_name: full_name?.trim() || null, role: role })
			.eq("id", authData.user.id)
			.select()
			.maybeSingle();

		if (profileError) {
			await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
			throw profileError;
		}

		res.status(201).json({
			success: true,
			message: "Account created successfully.",
			data: {
				user: profile,
			},
		});
	} catch (error) {
		next(error);
	}
}

export async function login(req, res, next) {
	try {
		const errors = validateLogin(req.body);

		if (errors.length > 0) {
			return res.status(400).json({
				success: false,
				message: "Validation failed.",
				errors,
			});
		}

		const { email, password } = req.body;

		const { data, error } = await supabase.auth.signInWithPassword({
			email: email.trim().toLowerCase(),
			password,
		});

		if (error) {
			return res.status(401).json({
				success: false,
				message: "Invalid email or password.",
			});
		}

		const { data: profile, error: profileError } = await supabase
			.from("profiles")
			.select("*")
			.eq("id", data.user.id)
			.maybeSingle();

		if (profileError) throw profileError;

		if (!profile) {
			return res.status(404).json({
				success: false,
				message: "User profile not found.",
			});
		}

		if (profile.status === "disabled") {
			return res.status(403).json({
				success: false,
				message: "Your account has been disabled.",
			});
		}

		res.status(200).json({
			success: true,
			message: "Logged in successfully.",
			data: {
				access_token: data.session.access_token,
				refresh_token: data.session.refresh_token,
				expires_at: data.session.expires_at,
				user: profile,
			},
		});
	} catch (error) {
		next(error);
	}
}

export async function refreshSession(req, res, next) {
	try {
		const errors = validateRefreshSession(req.body);

		if (errors.length > 0) {
			return res.status(400).json({
				success: false,
				message: "Validation failed.",
				errors,
			});
		}

		const { refresh_token } = req.body;

		const { data, error } = await supabase.auth.refreshSession({
			refresh_token,
		});

		if (error || !data.session || !data.user) {
			return res.status(401).json({
				success: false,
				message: "Session expired.",
			});
		}

		const { data: profile, error: profileError } = await supabase
			.from("profiles")
			.select("*")
			.eq("id", data.user.id)
			.maybeSingle();

		if (profileError) throw profileError;

		if (!profile) {
			return res.status(404).json({
				success: false,
				message: "User profile not found.",
			});
		}

		if (profile.status === "disabled") {
			return res.status(403).json({
				success: false,
				message: "Your account has been disabled.",
			});
		}

		res.status(200).json({
			success: true,
			message: "Session refreshed successfully.",
			data: {
				access_token: data.session.access_token,
				refresh_token: data.session.refresh_token,
				expires_at: data.session.expires_at,
				user: profile,
			},
		});
	} catch (error) {
		next(error);
	}
}

export async function logout(req, res, next) {
	try {
		const { error } = await supabaseAdmin.auth.admin.signOut(req.token);

		if (error) throw error;

		res.status(200).json({
			success: true,
			message: "Logged out successfully.",
		});
	} catch (error) {
		next(error);
	}
}

export async function me(req, res, next) {
	try {
		res.status(200).json({
			success: true,
			data: {
				user: req.profile,
			},
		});
	} catch (error) {
		next(error);
	}
}

export async function completeInvite(req, res, next) {
	try {
		const { full_name, password, role } = req.body;

		if (!password || password.length < 8) {
			return res.status(400).json({
				success: false,
				message: "Password must be at least 8 characters.",
			});
		}

		const { error: updateError } =
			await supabaseAdmin.auth.admin.updateUserById(req.profile.id, {
				password,
			});
		if (updateError) throw updateError;

		const profileUpdate = {};
		if (full_name?.trim()) profileUpdate.full_name = full_name.trim();
		if (role) profileUpdate.role = role;

		if (Object.keys(profileUpdate).length > 0) {
			await supabaseAdmin
				.from("profiles")
				.update(profileUpdate)
				.eq("id", req.profile.id);
		}

		res.status(200).json({
			success: true,
			message: "Account setup complete.",
		});
	} catch (error) {
		next(error);
	}
}

// Server-initiated Google sign-in (PKCE).
// 1. startGoogleSignIn: builds the Supabase auth URL, stores the PKCE verifier
//    in a signed HTTP-only cookie, redirects the browser to Google.
// 2. googleSignInCallback: Supabase redirects back with `?code=...`. We exchange
//    the code for a session using the verifier cookie, validate the profile,
//    then redirect to the client with tokens in the URL fragment.
export async function startGoogleSignIn(req, res, next) {
	try {
		const storage = createMemoryStorage();
		const client = createOAuthClient(storage);

		const redirectTo = `${env.apiUrl}/api/${env.apiVersion}/auth/google/callback`;

		const { data, error } = await client.auth.signInWithOAuth({
			provider: "google",
			options: {
				redirectTo,
				skipBrowserRedirect: true,
			},
		});

		if (error || !data?.url) {
			console.error("[google-oauth] signInWithOAuth failed", {
				error,
				hasUrl: !!data?.url,
				redirectTo,
			});
			return clientRedirect(res, { error: "oauth_failed" });
		}

		const { key, verifier } = extractCodeVerifier(storage);
		if (!verifier) {
			console.error("[google-oauth] no PKCE verifier in storage", {
				keys: Object.keys(storage._dump()),
			});
			return clientRedirect(res, { error: "oauth_failed" });
		}

		console.log("[google-oauth] start ok", {
			verifierKey: key,
			redirectTo,
			authUrl: data.url,
		});

		res.cookie(PKCE_COOKIE_NAME, verifier, pkceCookieOptions());
		return res.redirect(data.url);
	} catch (error) {
		next(error);
	}
}

export async function googleSignInCallback(req, res, next) {
	try {
		const {
			code,
			error: providerError,
			error_description: providerErrorDescription,
			error_code: providerErrorCode,
		} = req.query;
		const verifier = req.signedCookies?.[PKCE_COOKIE_NAME];

		const clearCookie = () =>
			res.clearCookie(PKCE_COOKIE_NAME, { path: "/" });

		console.log("[google-oauth] callback received", {
			hasCode: !!code,
			hasVerifierCookie: !!verifier,
			cookieKeys: Object.keys(req.cookies || {}),
			signedCookieKeys: Object.keys(req.signedCookies || {}),
			providerError: providerError || null,
			providerErrorCode: providerErrorCode || null,
			providerErrorDescription: providerErrorDescription || null,
		});

		if (providerError) {
			console.error("[google-oauth] provider returned error", {
				providerError,
				providerErrorCode,
				providerErrorDescription,
			});
			clearCookie();
			return clientRedirect(res, { error: "oauth_failed" });
		}

		if (!code) {
			console.error("[google-oauth] missing code in callback query");
			clearCookie();
			return clientRedirect(res, { error: "oauth_failed" });
		}

		if (!verifier) {
			console.error(
				"[google-oauth] missing PKCE verifier cookie on callback",
				{
					rawCookieHeader: req.headers.cookie || null,
				},
			);
			clearCookie();
			return clientRedirect(res, { error: "oauth_failed" });
		}

		// supabase-js reads the verifier from its `storage` adapter. The
		// storage key is `sb-<project-ref>-auth-token-code-verifier`; we
		// seed it under a few plausible key variants and call
		// exchangeCodeForSession which will look it up.
		const host = new URL(env.supabaseUrl).hostname;
		const projectRef = host.split(".")[0];
		const candidateKeys = [
			`sb-${projectRef}-auth-token-code-verifier`,
			`sb-${host}-auth-token-code-verifier`,
		];
		const seed = Object.fromEntries(candidateKeys.map((k) => [k, verifier]));
		const storage = createMemoryStorage(seed);
		const client = createOAuthClient(storage);

		const { data, error } = await client.auth.exchangeCodeForSession(code);

		if (error || !data?.session || !data?.user) {
			console.error("[google-oauth] exchangeCodeForSession failed", {
				error,
				hasSession: !!data?.session,
				hasUser: !!data?.user,
				triedKeys: candidateKeys,
			});
			clearCookie();
			return clientRedirect(res, { error: "oauth_failed" });
		}

		const { data: profile, error: profileError } = await supabaseAdmin
			.from("profiles")
			.select("id, status")
			.eq("id", data.user.id)
			.maybeSingle();

		if (profileError) {
			clearCookie();
			throw profileError;
		}

		if (!profile) {
			clearCookie();
			return clientRedirect(res, { error: "profile_missing" });
		}

		if (profile.status === "disabled") {
			clearCookie();
			return clientRedirect(res, { error: "account_disabled" });
		}

		clearCookie();
		return clientRedirectWithSession(res, data.session);
	} catch (error) {
		next(error);
	}
}
