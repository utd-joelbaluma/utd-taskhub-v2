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
			.select("*")
			.order("created_at", { ascending: false });

		if (status) {
			query = query.eq("status", status);
		}

		if (search) {
			query = query.ilike("name", `%${search}%`);
		}

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
			.select("*")
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

		const { name, description, status } = req.body;

		const { data, error } = await supabase
			.from("projects")
			.insert({
				name: name.trim(),
				description: description?.trim() || null,
				status: status || "active",
			})
			.select()
			.single();

		if (error) throw error;

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
