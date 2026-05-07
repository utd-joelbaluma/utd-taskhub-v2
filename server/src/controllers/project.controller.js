import { supabase } from "../config/supabase.js";
import {
	validateCreateProject,
	validateUpdateProject,
} from "../utils/project.validator.js";

export async function getProjects(req, res, next) {
	try {
		const { status, search } = req.query;

		let query = supabase
			.from("projects")
			.select("*, project_members(user_id, role, profiles(id, full_name, avatar_url)), tasks(id, status)")
			.order("created_at", { ascending: false });

		if (status) query = query.eq("status", status);
		if (search) query = query.ilike("name", `%${search}%`);

		const { data, error } = await query;

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

export async function getProjectById(req, res, next) {
	try {
		const { id } = req.params;

		const { data, error } = await supabase
			.from("projects")
			.select("*, project_members(user_id, role, profiles(id, full_name, avatar_url))")
			.eq("id", id)
			.maybeSingle();

		if (error) throw error;

		if (!data) {
			return res.status(404).json({
				success: false,
				message: "Project not found.",
			});
		}

		res.status(200).json({
			success: true,
			data,
		});
	} catch (error) {
		next(error);
	}
}

export async function createProject(req, res, next) {
	try {
		const errors = validateCreateProject(req.body);

		if (errors.length > 0) {
			return res.status(400).json({
				success: false,
				message: "Validation failed.",
				errors,
			});
		}

		const { name, description, status, icon_type, icon_value, sprint_name, sprint_end_date, tags } = req.body;

		const { data, error } = await supabase
			.from("projects")
			.insert({
				name: name.trim(),
				description: description?.trim() || null,
				status: status || "planning",
				icon_type: icon_type || "icon",
				icon_value: icon_value?.trim() || "check",
				sprint_name: sprint_name?.trim() || null,
				sprint_end_date: sprint_end_date || null,
				tags: Array.isArray(tags) ? tags : [],
				created_by: req.profile.id,
			})
			.select()
			.single();

		if (error) throw error;

		const { error: memberError } = await supabase
			.from("project_members")
			.insert({ project_id: data.id, user_id: req.profile.id, role: "owner" });

		if (memberError) throw memberError;

		res.status(201).json({
			success: true,
			message: "Project created successfully.",
			data,
		});
	} catch (error) {
		next(error);
	}
}

export async function updateProject(req, res, next) {
	try {
		const { id } = req.params;

		const errors = validateUpdateProject(req.body);

		if (errors.length > 0) {
			return res.status(400).json({
				success: false,
				message: "Validation failed.",
				errors,
			});
		}

		const updateData = {};

		if (req.body.name !== undefined) {
			updateData.name = req.body.name.trim();
		}

		if (req.body.description !== undefined) {
			updateData.description = req.body.description?.trim() || null;
		}

		if (req.body.status !== undefined) {
			updateData.status = req.body.status;
		}

		if (req.body.icon_type !== undefined) {
			updateData.icon_type = req.body.icon_type || null;
		}

		if (req.body.icon_value !== undefined) {
			updateData.icon_value = req.body.icon_value?.trim() || null;
		}

		if (req.body.sprint_name !== undefined) {
			updateData.sprint_name = req.body.sprint_name?.trim() || null;
		}

		if (req.body.sprint_end_date !== undefined) {
			updateData.sprint_end_date = req.body.sprint_end_date || null;
		}

		if (req.body.tags !== undefined) {
			updateData.tags = Array.isArray(req.body.tags) ? req.body.tags : [];
		}

		if (Object.keys(updateData).length === 0) {
			return res.status(400).json({
				success: false,
				message: "No valid fields provided for update.",
			});
		}

		const { data, error } = await supabase
			.from("projects")
			.update(updateData)
			.eq("id", id)
			.select()
			.maybeSingle();

		if (error) throw error;

		if (!data) {
			return res.status(404).json({
				success: false,
				message: "Project not found.",
			});
		}

		res.status(200).json({
			success: true,
			message: "Project updated successfully.",
			data,
		});
	} catch (error) {
		next(error);
	}
}

export async function deleteProject(req, res, next) {
	try {
		const { id } = req.params;

		const { data: existingProject, error: findError } = await supabase
			.from("projects")
			.select("id")
			.eq("id", id)
			.maybeSingle();

		if (findError) throw findError;

		if (!existingProject) {
			return res.status(404).json({
				success: false,
				message: "Project not found.",
			});
		}

		const { error } = await supabase.from("projects").delete().eq("id", id);

		if (error) throw error;

		res.status(200).json({
			success: true,
			message: "Project deleted successfully.",
		});
	} catch (error) {
		next(error);
	}
}
