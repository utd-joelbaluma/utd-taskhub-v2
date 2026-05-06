import { supabase } from "../config/supabase.js";
import { validateCreateBoard, validateUpdateBoard } from "../utils/board.validator.js";

export async function getBoards(req, res, next) {
	try {
		const { projectId } = req.params;

		const { data, error } = await supabase
			.from("boards")
			.select(
				`
				id,
				project_id,
				name,
				description,
				created_at,
				updated_at,
				created_by:profiles!boards_created_by_fkey (
					id,
					full_name,
					email
				)
			`
			)
			.eq("project_id", projectId)
			.order("created_at", { ascending: true });

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

export async function getBoardById(req, res, next) {
	try {
		const { projectId, boardId } = req.params;

		const [boardResult, columnsResult] = await Promise.all([
			supabase
				.from("boards")
				.select(
					`
					id,
					project_id,
					name,
					description,
					created_at,
					updated_at,
					created_by:profiles!boards_created_by_fkey (
						id,
						full_name,
						email
					)
				`
				)
				.eq("id", boardId)
				.eq("project_id", projectId)
				.maybeSingle(),
			supabase
				.from("board_columns")
				.select("id, name, status_key, position, created_at, updated_at")
				.eq("board_id", boardId)
				.order("position", { ascending: true }),
		]);

		if (boardResult.error) throw boardResult.error;
		if (columnsResult.error) throw columnsResult.error;

		if (!boardResult.data) {
			return res.status(404).json({
				success: false,
				message: "Board not found.",
			});
		}

		res.status(200).json({
			success: true,
			data: {
				...boardResult.data,
				columns: columnsResult.data,
			},
		});
	} catch (error) {
		next(error);
	}
}

export async function createBoard(req, res, next) {
	try {
		const { projectId } = req.params;

		const errors = validateCreateBoard(req.body);
		if (errors.length > 0) {
			return res.status(400).json({
				success: false,
				message: "Validation failed.",
				errors,
			});
		}

		const { name, description } = req.body;

		const { data, error } = await supabase
			.from("boards")
			.insert({
				project_id: projectId,
				name: name.trim(),
				description: description?.trim() || null,
				created_by: req.profile.id,
			})
			.select()
			.single();

		if (error) throw error;

		res.status(201).json({
			success: true,
			message: "Board created successfully.",
			data,
		});
	} catch (error) {
		next(error);
	}
}

export async function updateBoard(req, res, next) {
	try {
		const { projectId, boardId } = req.params;

		const errors = validateUpdateBoard(req.body);
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

		if (Object.keys(updateData).length === 0) {
			return res.status(400).json({
				success: false,
				message: "No valid fields provided for update.",
			});
		}

		const { data, error } = await supabase
			.from("boards")
			.update(updateData)
			.eq("id", boardId)
			.eq("project_id", projectId)
			.select()
			.maybeSingle();

		if (error) throw error;

		if (!data) {
			return res.status(404).json({
				success: false,
				message: "Board not found.",
			});
		}

		res.status(200).json({
			success: true,
			message: "Board updated successfully.",
			data,
		});
	} catch (error) {
		next(error);
	}
}

export async function deleteBoard(req, res, next) {
	try {
		const { projectId, boardId } = req.params;

		const { data: existing, error: findError } = await supabase
			.from("boards")
			.select("id")
			.eq("id", boardId)
			.eq("project_id", projectId)
			.maybeSingle();

		if (findError) throw findError;

		if (!existing) {
			return res.status(404).json({
				success: false,
				message: "Board not found.",
			});
		}

		const { error } = await supabase
			.from("boards")
			.delete()
			.eq("id", boardId);

		if (error) throw error;

		res.status(200).json({
			success: true,
			message: "Board deleted successfully.",
		});
	} catch (error) {
		next(error);
	}
}
