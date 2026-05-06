import { supabase } from "../config/supabase.js";

export async function getProjects(req, res, next) {
	try {
		const { data, error } = await supabase
			.from("projects")
			.select("*")
			.order("created_at", { ascending: false });

		if (error) {
			throw error;
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
		const { name, description, status } = req.body;

		if (!name) {
			return res.status(400).json({
				success: false,
				message: "Project name is required.",
			});
		}

		const { data, error } = await supabase
			.from("projects")
			.insert({
				name,
				description: description || null,
				status: status || "active",
			})
			.select()
			.single();

		if (error) {
			throw error;
		}

		res.status(201).json({
			success: true,
			message: "Project created successfully.",
			data,
		});
	} catch (error) {
		next(error);
	}
}
