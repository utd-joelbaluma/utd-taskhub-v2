import { supabase, supabaseAdmin } from "../config/supabase.js";
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
			await supabaseAdmin.auth.admin.createUser({
				email: email.trim().toLowerCase(),
				password,
				email_confirm: true,
				user_metadata: { full_name: full_name?.trim() || null },
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

		// Trigger has already inserted the profile row; update full_name if provided
		const { data: profile, error: profileError } = await supabase
			.from("profiles")
			.update({ full_name: full_name?.trim() || null })
			.eq("id", authData.user.id)
			.select()
			.single();

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
		const { full_name, password } = req.body;

		if (!password || password.length < 8) {
			return res.status(400).json({
				success: false,
				message: "Password must be at least 8 characters.",
			});
		}

		const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
			req.profile.id,
			{ password },
		);
		if (updateError) throw updateError;

		if (full_name?.trim()) {
			await supabase
				.from("profiles")
				.update({ full_name: full_name.trim() })
				.eq("id", req.profile.id);
		}

		res.status(200).json({ success: true, message: "Account setup complete." });
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
