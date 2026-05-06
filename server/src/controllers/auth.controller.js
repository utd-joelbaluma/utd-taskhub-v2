import { supabase } from "../config/supabase.js";
import { validateRegister, validateLogin } from "../utils/auth.validator.js";

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

		const { email, password, full_name } = req.body;

		const { data: authData, error: authError } =
			await supabase.auth.admin.createUser({
				email: email.trim().toLowerCase(),
				password,
				email_confirm: true,
			});

		if (authError) {
			if (authError.message.toLowerCase().includes("already registered")) {
				return res.status(409).json({
					success: false,
					message: "An account with this email already exists.",
				});
			}
			throw authError;
		}

		const { data: profile, error: profileError } = await supabase
			.from("profiles")
			.insert({
				id: authData.user.id,
				email: email.trim().toLowerCase(),
				full_name: full_name?.trim() || null,
				status: "active",
			})
			.select()
			.single();

		if (profileError) {
			// Roll back the auth user if profile insert fails
			await supabase.auth.admin.deleteUser(authData.user.id);
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

export async function logout(req, res, next) {
	try {
		const { error } = await supabase.auth.admin.signOut(req.token);

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

// ----------------------------------------------------------------
// Google Sign-In — not yet implemented.
// When ready, this will:
//   1. Generate a Supabase OAuth URL for Google.
//   2. Return the URL to the client.
//   3. A separate /auth/google/callback route will exchange the
//      code for a session via supabase.auth.exchangeCodeForSession().
// ----------------------------------------------------------------
export async function googleSignIn(req, res, next) {
	try {
		res.status(501).json({
			success: false,
			message: "Google sign-in is not yet implemented.",
		});
	} catch (error) {
		next(error);
	}
}
