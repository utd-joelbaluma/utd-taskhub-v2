import { supabase, supabaseAdmin } from "../config/supabase.js";

export async function listUsers(req, res, next) {
	try {
			const { data, error } = await supabase
				.from("profiles")
				.select("id, full_name, email, avatar_url, role, role_id, status, created_at, global_role:roles!profiles_role_id_fkey(id, key, name, scope)")
			.order("created_at", { ascending: false });

		if (error) throw error;

		res.status(200).json({
			success: true,
			count: data.length,
			data,
		});
	} catch (error) {
		next(error);
	}
}

export async function inviteUser(req, res, next) {
	try {
		const { email, role = "user" } = req.body;

		if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			return res.status(400).json({
				success: false,
				message: "A valid email is required.",
			});
		}

		const normalizedEmail = email.trim().toLowerCase();

		const { data: existing } = await supabase
			.from("profiles")
			.select("id, status")
			.eq("email", normalizedEmail)
			.maybeSingle();

		if (existing?.status === "active") {
			return res.status(409).json({
				success: false,
				message: "A user with this email already exists.",
			});
		}

		const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
			normalizedEmail,
			{
				data: {
					role,
					invited_by: req.profile.id,
				},
			}
		);

		if (error) throw error;

		res.status(201).json({
			success: true,
			message: `Invitation sent to ${normalizedEmail}.`,
		});
	} catch (error) {
		next(error);
	}
}

export async function listUserInvitations(req, res, next) {
	try {
		const { status } = req.query;

			const { data: authData, error } =
				await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });

		if (error) throw error;

		const invited = authData.users.filter(
			(u) => u.invited_at && !u.email_confirmed_at
		);

		let filtered = invited;
		if (status === "pending") {
			filtered = invited.filter((u) => !u.app_metadata?.invite_cancelled_at);
		} else if (status === "cancelled") {
			filtered = invited.filter((u) => !!u.app_metadata?.invite_cancelled_at);
		}

		const data = filtered.map((u) => ({
			id: u.id,
			email: u.email,
			invited_at: u.invited_at,
			invite_cancelled_at: u.app_metadata?.invite_cancelled_at ?? null,
		}));

		res.status(200).json({
			success: true,
			count: data.length,
			data,
		});
	} catch (error) {
		next(error);
	}
}

export async function updateUserRole(req, res, next) {
	try {
		const { userId } = req.params;
		const { role_key } = req.body;

		if (!role_key || typeof role_key !== "string") {
			return res.status(400).json({
				success: false,
				message: "role_key is required.",
			});
		}

		const { data: role, error: roleError } = await supabase
			.from("roles")
			.select("id, key")
			.eq("scope", "global")
			.eq("key", role_key)
			.maybeSingle();

		if (roleError) throw roleError;

		if (!role) {
			return res.status(400).json({
				success: false,
				message: `Unknown global role: ${role_key}.`,
			});
		}

		const { data: updated, error: updateError } = await supabase
			.from("profiles")
			.update({ role: role.key, role_id: role.id })
			.eq("id", userId)
			.select("id, full_name, email, avatar_url, role, role_id, status, created_at, global_role:roles!profiles_role_id_fkey(id, key, name, scope)")
			.maybeSingle();

		if (updateError) throw updateError;

		if (!updated) {
			return res.status(404).json({
				success: false,
				message: "User not found.",
			});
		}

		res.status(200).json({
			success: true,
			message: "User role updated.",
			data: updated,
		});
	} catch (error) {
		next(error);
	}
}

export async function deleteUser(req, res, next) {
	try {
		const { id } = req.params;

		if (id === req.profile.id) {
			return res.status(400).json({
				success: false,
				message: "You cannot delete your own account.",
			});
		}

		const { data: authUser, error: fetchError } =
			await supabaseAdmin.auth.admin.getUserById(id);

		if (fetchError || !authUser?.user) {
			return res.status(404).json({
				success: false,
				message: "User not found.",
			});
		}

		const { error } = await supabaseAdmin.auth.admin.deleteUser(id);

		if (error) throw error;

		res.status(200).json({
			success: true,
			message: "User deleted.",
		});
	} catch (error) {
		next(error);
	}
}

export async function cancelUserInvitation(req, res, next) {
	try {
		const { userId } = req.params;

			const { data: authUser, error: fetchError } =
				await supabaseAdmin.auth.admin.getUserById(userId);

		if (fetchError || !authUser?.user) {
			return res.status(404).json({
				success: false,
				message: "Invitation not found.",
			});
		}

		const user = authUser.user;

		if (!user.invited_at || user.email_confirmed_at) {
			return res.status(400).json({
				success: false,
				message: "This invitation cannot be cancelled.",
			});
		}

		if (user.app_metadata?.invite_cancelled_at) {
			return res.status(409).json({
				success: false,
				message: "This invitation is already cancelled.",
			});
		}

			const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
			userId,
			{
				app_metadata: {
					...user.app_metadata,
					invite_cancelled_at: new Date().toISOString(),
				},
			}
		);

		if (updateError) throw updateError;

		res.status(200).json({
			success: true,
			message: "Invitation cancelled.",
		});
	} catch (error) {
		next(error);
	}
}
