import { supabase, supabaseAdmin } from "../config/supabase.js";
import { env } from "../config/env.js";
import {
	createNotifications,
	NotificationType,
} from "../services/notification.service.js";

export async function listUsers(req, res, next) {
	try {
		const { data, error } = await supabase
			.from("profiles")
			.select(
				"id, full_name, email, avatar_url, role, role_id, status, created_at, global_role:roles!profiles_role_id_fkey(id, key, name, scope)",
			)
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

export async function listUserInvitations(req, res, next) {
	try {
		const { status } = req.query;

		let query = supabase
			.from("invitations")
			.select(
				"id, email, role, status, created_at, cancelled_at, expires_at",
			)
			.is("project_id", null)
			.order("created_at", { ascending: false });

		if (status) query = query.eq("status", status);

		const { data, error } = await query;
		if (error) throw error;

		const mapped = data.map((inv) => ({
			id: inv.id,
			email: inv.email,
			role: inv.role,
			status: inv.status,
			invited_at: inv.created_at,
			invite_cancelled_at: inv.cancelled_at,
		}));

		res.status(200).json({
			success: true,
			count: mapped.length,
			data: mapped,
		});
	} catch (error) {
		next(error);
	}
}

export async function updateUserRole(req, res, next) {
	try {
		const { id: userId } = req.params;
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
			.select(
				"id, full_name, email, avatar_url, role, role_id, status, created_at, global_role:roles!profiles_role_id_fkey(id, key, name, scope)",
			)
			.maybeSingle();

		if (updateError) throw updateError;

		if (!updated) {
			return res.status(404).json({
				success: false,
				message: "User not found.",
			});
		}

		if (userId && userId !== req.profile.id) {
			createNotifications({
				userIds: [userId],
				type: NotificationType.ROLE_CHANGED,
				title: "Your role was updated",
				body: `Your role is now ${role.key}.`,
				data: { scope: "global", role_key: role.key },
			}).catch((e) => console.error("[notif]", e));
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

		const { data: invitation, error: findError } = await supabase
			.from("invitations")
			.select("id, status")
			.eq("id", userId)
			.is("project_id", null)
			.maybeSingle();

		if (findError) throw findError;

		if (!invitation) {
			return res.status(404).json({
				success: false,
				message: "Invitation not found.",
			});
		}

		if (invitation.status !== "pending") {
			return res.status(400).json({
				success: false,
				message: "Invitation cannot be cancelled.",
			});
		}

		const { error: updateError } = await supabase
			.from("invitations")
			.update({
				status: "cancelled",
				cancelled_at: new Date().toISOString(),
			})
			.eq("id", userId);

		if (updateError) throw updateError;

		res.status(200).json({
			success: true,
			message: "Invitation cancelled.",
		});
	} catch (error) {
		next(error);
	}
}
