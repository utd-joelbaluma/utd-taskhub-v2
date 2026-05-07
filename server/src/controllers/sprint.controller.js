import { supabase } from "../config/supabase.js";
import {
	validateCreateSprint,
	validateUpdateSprint,
	computeEndDate,
} from "../utils/sprint.validator.js";

const SPRINT_SELECT = `
	id,
	project_id,
	name,
	start_date,
	end_date,
	status,
	created_at,
	updated_at,
	created_by:profiles!sprints_created_by_fkey (
		id,
		full_name,
		email
	)
`;

export async function listSprints(req, res, next) {
	try {
		const { projectId } = req.params;

		const { data, error } = await supabase
			.from("sprints")
			.select(SPRINT_SELECT)
			.eq("project_id", projectId)
			.order("start_date", { ascending: true });

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

export async function createSprint(req, res, next) {
	try {
		const { projectId } = req.params;
		const { name, start_date, end_date, status } = req.body;

		const errors = validateCreateSprint({ name, start_date, end_date, status });
		if (errors.length > 0) {
			return res.status(400).json({ success: false, message: "Validation failed.", errors });
		}

		const resolvedEndDate = end_date || computeEndDate(start_date);

		const { data, error } = await supabase
			.from("sprints")
			.insert({
				project_id: projectId,
				name: name.trim(),
				start_date,
				end_date: resolvedEndDate,
				status: status || "planned",
				created_by: req.profile.id,
			})
			.select(SPRINT_SELECT)
			.single();

		if (error) {
			if (error.code === "23505") {
				return res.status(409).json({
					success: false,
					message: "A sprint already exists for that week in this project.",
				});
			}
			throw error;
		}

		res.status(201).json({
			success: true,
			message: "Sprint created.",
			data,
		});
	} catch (error) {
		next(error);
	}
}

export async function updateSprint(req, res, next) {
	try {
		const { projectId, sprintId } = req.params;
		const { name, start_date, end_date, status } = req.body;

		const errors = validateUpdateSprint({ name, start_date, end_date, status });
		if (errors.length > 0) {
			return res.status(400).json({ success: false, message: "Validation failed.", errors });
		}

		const updates = {};
		if (name !== undefined) updates.name = name.trim();
		if (start_date !== undefined) {
			updates.start_date = start_date;
			updates.end_date = end_date || computeEndDate(start_date);
		}
		if (status !== undefined) updates.status = status;

		if (Object.keys(updates).length === 0) {
			return res.status(400).json({ success: false, message: "No fields to update." });
		}

		const { data, error } = await supabase
			.from("sprints")
			.update(updates)
			.eq("id", sprintId)
			.eq("project_id", projectId)
			.select(SPRINT_SELECT)
			.maybeSingle();

		if (error) {
			if (error.code === "23505") {
				return res.status(409).json({
					success: false,
					message: "A sprint already exists for that week in this project.",
				});
			}
			throw error;
		}

		if (!data) {
			return res.status(404).json({ success: false, message: "Sprint not found." });
		}

		res.status(200).json({ success: true, message: "Sprint updated.", data });
	} catch (error) {
		next(error);
	}
}

export async function deleteSprint(req, res, next) {
	try {
		const { projectId, sprintId } = req.params;

		const { data, error } = await supabase
			.from("sprints")
			.delete()
			.eq("id", sprintId)
			.eq("project_id", projectId)
			.select("id")
			.maybeSingle();

		if (error) throw error;

		if (!data) {
			return res.status(404).json({ success: false, message: "Sprint not found." });
		}

		res.status(200).json({ success: true, message: "Sprint deleted." });
	} catch (error) {
		next(error);
	}
}
