import { supabase, supabaseAdmin } from "../config/supabase.js";
import { userHasGlobalPermission } from "../middlewares/permission.middleware.js";
import { validateUpdateProfile } from "../utils/profile.validator.js";

export async function listProfiles(req, res, next) {
	try {
		const { data, error } = await supabase
			.from("profiles")
			.select("id, full_name, email, avatar_url, role, role_id, status, global_role:roles!profiles_role_id_fkey(id, key, name, scope)")
			.eq("status", "active")
			.order("full_name", { ascending: true });

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

export async function getProfile(req, res, next) {
	try {
		const { id } = req.params;

		const { data: profile, error } = await supabase
			.from("profiles")
			.select("id, email, full_name, avatar_url, role, role_id, status, created_at, updated_at, global_role:roles!profiles_role_id_fkey(id, key, name, scope)")
			.eq("id", id)
			.maybeSingle();

		if (error) throw error;

		if (!profile) {
			return res.status(404).json({
				success: false,
				message: "Profile not found.",
			});
		}

		res.status(200).json({
			success: true,
			data: { profile },
		});
	} catch (error) {
		next(error);
	}
}

export async function updateProfile(req, res, next) {
	try {
		const { id } = req.params;
		const canManageProfiles = await userHasGlobalPermission(req, "profiles.manage");
		const isSelf = req.profile.id === id;

		// Only the profile owner or a profile manager can update a profile.
		if (!isSelf && !canManageProfiles) {
			return res.status(403).json({
				success: false,
				message: "You can only update your own profile.",
			});
		}

		const errors = validateUpdateProfile(req.body, canManageProfiles);
		if (errors.length > 0) {
			return res.status(400).json({
				success: false,
				message: "Validation failed.",
				errors,
			});
		}

		// Build update payload from allowed fields
		const updateData = {};

		if (req.body.full_name !== undefined) {
			updateData.full_name =
				req.body.full_name?.trim() || null;
		}

		if (req.body.avatar_url !== undefined) {
			updateData.avatar_url = req.body.avatar_url?.trim() || null;
		}

		// Permission-protected fields
		if (canManageProfiles) {
			if (req.body.role !== undefined) {
				updateData.role = req.body.role;
			}
			if (req.body.role_id !== undefined) {
				updateData.role_id = req.body.role_id;
			}
			if (req.body.status !== undefined) {
				updateData.status = req.body.status;
			}
		}

		if (Object.keys(updateData).length === 0) {
			return res.status(400).json({
				success: false,
				message: "No valid fields provided for update.",
			});
		}

		const { data: profile, error } = await supabaseAdmin
			.from("profiles")
			.update(updateData)
			.eq("id", id)
			.select("id, email, full_name, avatar_url, role, role_id, status, created_at, updated_at, global_role:roles!profiles_role_id_fkey(id, key, name, scope)")
			.maybeSingle();

		if (error) throw error;

		if (!profile) {
			return res.status(404).json({
				success: false,
				message: "Profile not found.",
			});
		}

		res.status(200).json({
			success: true,
			message: "Profile updated successfully.",
			data: { profile },
		});
	} catch (error) {
		next(error);
	}
}
