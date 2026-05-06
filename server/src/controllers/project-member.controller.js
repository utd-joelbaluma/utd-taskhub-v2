import { supabase } from "../config/supabase.js";
import {
	validateAddMember,
	validateUpdateMemberRole,
} from "../utils/project-member.validator.js";

export async function listMembers(req, res, next) {
	try {
		const { projectId } = req.params;

		const { data, error } = await supabase
			.from("project_members")
			.select("*, profiles(id, full_name, email, avatar_url, role)")
			.eq("project_id", projectId)
			.order("joined_at", { ascending: true });

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

export async function addMember(req, res, next) {
	try {
		const { projectId } = req.params;

		const errors = validateAddMember(req.body);

		if (errors.length > 0) {
			return res.status(400).json({
				success: false,
				message: "Validation failed.",
				errors,
			});
		}

		const { user_id, role = "member" } = req.body;

		const { data, error } = await supabase
			.from("project_members")
			.insert({ project_id: projectId, user_id, role })
			.select("*, profiles(id, full_name, email, avatar_url, role)")
			.single();

		if (error) {
			if (error.code === "23505") {
				return res.status(409).json({
					success: false,
					message: "User is already a member of this project.",
				});
			}
			throw error;
		}

		res.status(201).json({
			success: true,
			message: "Member added successfully.",
			data,
		});
	} catch (error) {
		next(error);
	}
}

export async function updateMemberRole(req, res, next) {
	try {
		const { projectId, userId } = req.params;

		const errors = validateUpdateMemberRole(req.body);

		if (errors.length > 0) {
			return res.status(400).json({
				success: false,
				message: "Validation failed.",
				errors,
			});
		}

		const { data, error } = await supabase
			.from("project_members")
			.update({ role: req.body.role })
			.eq("project_id", projectId)
			.eq("user_id", userId)
			.select("*, profiles(id, full_name, email, avatar_url, role)")
			.maybeSingle();

		if (error) throw error;

		if (!data) {
			return res.status(404).json({
				success: false,
				message: "Member not found.",
			});
		}

		res.status(200).json({
			success: true,
			message: "Member role updated.",
			data,
		});
	} catch (error) {
		next(error);
	}
}

export async function removeMember(req, res, next) {
	try {
		const { projectId, userId } = req.params;

		const { data: existing, error: findError } = await supabase
			.from("project_members")
			.select("id")
			.eq("project_id", projectId)
			.eq("user_id", userId)
			.maybeSingle();

		if (findError) throw findError;

		if (!existing) {
			return res.status(404).json({
				success: false,
				message: "Member not found.",
			});
		}

		const { error } = await supabase
			.from("project_members")
			.delete()
			.eq("project_id", projectId)
			.eq("user_id", userId);

		if (error) throw error;

		res.status(200).json({
			success: true,
			message: "Member removed successfully.",
		});
	} catch (error) {
		next(error);
	}
}
