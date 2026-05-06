import { supabase } from "../config/supabase.js";
import {
	validateCreateColumn,
	validateUpdateColumn,
	validateReorderColumns,
} from "../utils/board-column.validator.js";

async function resolveBoard(projectId, boardId) {
	const { data, error } = await supabase
		.from("boards")
		.select("id")
		.eq("id", boardId)
		.eq("project_id", projectId)
		.maybeSingle();

	if (error) throw error;
	return data;
}

export async function getColumns(req, res, next) {
	try {
		const { projectId, boardId } = req.params;

		const board = await resolveBoard(projectId, boardId);
		if (!board) {
			return res.status(404).json({ success: false, message: "Board not found." });
		}

		const { data, error } = await supabase
			.from("board_columns")
			.select("id, board_id, name, status_key, position, created_at, updated_at")
			.eq("board_id", boardId)
			.order("position", { ascending: true });

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

export async function createColumn(req, res, next) {
	try {
		const { projectId, boardId } = req.params;

		const board = await resolveBoard(projectId, boardId);
		if (!board) {
			return res.status(404).json({ success: false, message: "Board not found." });
		}

		const errors = validateCreateColumn(req.body);
		if (errors.length > 0) {
			return res.status(400).json({
				success: false,
				message: "Validation failed.",
				errors,
			});
		}

		const { name, status_key, position } = req.body;

		// Default position to end of list when not provided
		let resolvedPosition = position;
		if (resolvedPosition === undefined) {
			const { count } = await supabase
				.from("board_columns")
				.select("id", { count: "exact", head: true })
				.eq("board_id", boardId);

			resolvedPosition = count ?? 0;
		}

		const { data, error } = await supabase
			.from("board_columns")
			.insert({
				board_id: boardId,
				name: name.trim(),
				status_key,
				position: resolvedPosition,
			})
			.select()
			.single();

		if (error) throw error;

		res.status(201).json({
			success: true,
			message: "Column created successfully.",
			data,
		});
	} catch (error) {
		next(error);
	}
}

export async function updateColumn(req, res, next) {
	try {
		const { projectId, boardId, columnId } = req.params;

		const board = await resolveBoard(projectId, boardId);
		if (!board) {
			return res.status(404).json({ success: false, message: "Board not found." });
		}

		const errors = validateUpdateColumn(req.body);
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
		if (req.body.status_key !== undefined) {
			updateData.status_key = req.body.status_key;
		}
		if (req.body.position !== undefined) {
			updateData.position = req.body.position;
		}

		if (Object.keys(updateData).length === 0) {
			return res.status(400).json({
				success: false,
				message: "No valid fields provided for update.",
			});
		}

		const { data, error } = await supabase
			.from("board_columns")
			.update(updateData)
			.eq("id", columnId)
			.eq("board_id", boardId)
			.select()
			.maybeSingle();

		if (error) throw error;

		if (!data) {
			return res.status(404).json({ success: false, message: "Column not found." });
		}

		res.status(200).json({
			success: true,
			message: "Column updated successfully.",
			data,
		});
	} catch (error) {
		next(error);
	}
}

export async function deleteColumn(req, res, next) {
	try {
		const { projectId, boardId, columnId } = req.params;

		const board = await resolveBoard(projectId, boardId);
		if (!board) {
			return res.status(404).json({ success: false, message: "Board not found." });
		}

		const { data: existing, error: findError } = await supabase
			.from("board_columns")
			.select("id")
			.eq("id", columnId)
			.eq("board_id", boardId)
			.maybeSingle();

		if (findError) throw findError;

		if (!existing) {
			return res.status(404).json({ success: false, message: "Column not found." });
		}

		const { error } = await supabase
			.from("board_columns")
			.delete()
			.eq("id", columnId);

		if (error) throw error;

		res.status(200).json({
			success: true,
			message: "Column deleted successfully.",
		});
	} catch (error) {
		next(error);
	}
}

export async function reorderColumns(req, res, next) {
	try {
		const { projectId, boardId } = req.params;

		const board = await resolveBoard(projectId, boardId);
		if (!board) {
			return res.status(404).json({ success: false, message: "Board not found." });
		}

		const errors = validateReorderColumns(req.body);
		if (errors.length > 0) {
			return res.status(400).json({
				success: false,
				message: "Validation failed.",
				errors,
			});
		}

		const { columns } = req.body;

		// Verify all column IDs belong to this board
		const ids = columns.map((c) => c.id);

		const { data: existing, error: fetchError } = await supabase
			.from("board_columns")
			.select("id")
			.eq("board_id", boardId)
			.in("id", ids);

		if (fetchError) throw fetchError;

		if (existing.length !== ids.length) {
			return res.status(400).json({
				success: false,
				message: "One or more column IDs do not belong to this board.",
			});
		}

		// Update each column's position
		await Promise.all(
			columns.map(({ id, position }) =>
				supabase
					.from("board_columns")
					.update({ position })
					.eq("id", id)
					.eq("board_id", boardId)
			)
		);

		// Return the updated list ordered by new positions
		const { data, error } = await supabase
			.from("board_columns")
			.select("id, board_id, name, status_key, position, created_at, updated_at")
			.eq("board_id", boardId)
			.order("position", { ascending: true });

		if (error) throw error;

		res.status(200).json({
			success: true,
			message: "Columns reordered successfully.",
			data,
		});
	} catch (error) {
		next(error);
	}
}
