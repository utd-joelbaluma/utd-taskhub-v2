import { supabase } from "../config/supabase.js";
import {
	validateCreateTask,
	validateUpdateTask,
	validateMoveTask,
} from "../utils/task.validator.js";

const TASK_SELECT = `
	id,
	project_id,
	board_column_id,
	title,
	description,
	status,
	priority,
	position,
	due_date,
	created_at,
	updated_at,
	assigned_to:profiles!tasks_assigned_to_fkey (
		id,
		full_name,
		email
	),
	created_by:profiles!tasks_created_by_fkey (
		id,
		full_name,
		email
	)
`;

export async function getTasks(req, res, next) {
	try {
		const { projectId } = req.params;
		const { column_id, status, priority, assigned_to } = req.query;

		let query = supabase
			.from("tasks")
			.select(TASK_SELECT)
			.eq("project_id", projectId)
			.order("position", { ascending: true });

		if (column_id) query = query.eq("board_column_id", column_id);
		if (status) query = query.eq("status", status);
		if (priority) query = query.eq("priority", priority);
		if (assigned_to) query = query.eq("assigned_to", assigned_to);

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

export async function getTaskById(req, res, next) {
	try {
		const { projectId, taskId } = req.params;

		const { data, error } = await supabase
			.from("tasks")
			.select(TASK_SELECT)
			.eq("id", taskId)
			.eq("project_id", projectId)
			.maybeSingle();

		if (error) throw error;

		if (!data) {
			return res.status(404).json({
				success: false,
				message: "Task not found.",
			});
		}

		res.status(200).json({ success: true, data });
	} catch (error) {
		next(error);
	}
}

export async function createTask(req, res, next) {
	try {
		const { projectId } = req.params;

		const errors = validateCreateTask(req.body);
		if (errors.length > 0) {
			return res.status(400).json({ success: false, message: "Validation failed.", errors });
		}

		const { title, description, status, priority, assigned_to, board_column_id, due_date } = req.body;

		// Derive position: place at end of the target column (or project-level if no column)
		let positionQuery = supabase
			.from("tasks")
			.select("position")
			.eq("project_id", projectId)
			.order("position", { ascending: false })
			.limit(1);

		if (board_column_id) {
			positionQuery = positionQuery.eq("board_column_id", board_column_id);
		} else {
			positionQuery = positionQuery.is("board_column_id", null);
		}

		const { data: lastTask } = await positionQuery.maybeSingle();
		const position = lastTask ? lastTask.position + 1 : 0;

		const { data, error } = await supabase
			.from("tasks")
			.insert({
				project_id: projectId,
				board_column_id: board_column_id || null,
				title: title.trim(),
				description: description?.trim() || null,
				status: status || "backlog",
				priority: priority || "medium",
				assigned_to: assigned_to || null,
				due_date: due_date || null,
				position,
				created_by: req.profile.id,
			})
			.select(TASK_SELECT)
			.single();

		if (error) throw error;

		res.status(201).json({
			success: true,
			message: "Task created successfully.",
			data,
		});
	} catch (error) {
		next(error);
	}
}

export async function updateTask(req, res, next) {
	try {
		const { projectId, taskId } = req.params;

		const errors = validateUpdateTask(req.body);
		if (errors.length > 0) {
			return res.status(400).json({ success: false, message: "Validation failed.", errors });
		}

		const ALLOWED = ["title", "description", "status", "priority", "assigned_to", "board_column_id", "due_date"];
		const updateData = {};

		for (const field of ALLOWED) {
			if (req.body[field] !== undefined) {
				updateData[field] = req.body[field];
			}
		}

		if (updateData.title) updateData.title = updateData.title.trim();
		if (updateData.description) updateData.description = updateData.description.trim();

		if (Object.keys(updateData).length === 0) {
			return res.status(400).json({ success: false, message: "No valid fields provided for update." });
		}

		const { data, error } = await supabase
			.from("tasks")
			.update(updateData)
			.eq("id", taskId)
			.eq("project_id", projectId)
			.select(TASK_SELECT)
			.maybeSingle();

		if (error) throw error;

		if (!data) {
			return res.status(404).json({ success: false, message: "Task not found." });
		}

		res.status(200).json({ success: true, message: "Task updated successfully.", data });
	} catch (error) {
		next(error);
	}
}

export async function deleteTask(req, res, next) {
	try {
		const { projectId, taskId } = req.params;

		const { data: existing, error: findError } = await supabase
			.from("tasks")
			.select("id")
			.eq("id", taskId)
			.eq("project_id", projectId)
			.maybeSingle();

		if (findError) throw findError;

		if (!existing) {
			return res.status(404).json({ success: false, message: "Task not found." });
		}

		const { error } = await supabase.from("tasks").delete().eq("id", taskId);
		if (error) throw error;

		res.status(200).json({ success: true, message: "Task deleted successfully." });
	} catch (error) {
		next(error);
	}
}

export async function moveTask(req, res, next) {
	try {
		const { projectId, taskId } = req.params;

		const errors = validateMoveTask(req.body);
		if (errors.length > 0) {
			return res.status(400).json({ success: false, message: "Validation failed.", errors });
		}

		const { board_column_id, position } = req.body;

		// Verify the task belongs to this project
		const { data: task, error: findError } = await supabase
			.from("tasks")
			.select("id, board_column_id, position")
			.eq("id", taskId)
			.eq("project_id", projectId)
			.maybeSingle();

		if (findError) throw findError;

		if (!task) {
			return res.status(404).json({ success: false, message: "Task not found." });
		}

		// Verify the target column belongs to a board in this project
		const { data: column, error: columnError } = await supabase
			.from("board_columns")
			.select("id, board_id, boards!inner(project_id)")
			.eq("id", board_column_id)
			.maybeSingle();

		if (columnError) throw columnError;

		if (!column || column.boards.project_id !== projectId) {
			return res.status(400).json({ success: false, message: "board_column_id does not belong to this project." });
		}

		// Fetch all tasks in the destination column (excluding the moving task), ordered by position
		const { data: columnTasks, error: tasksError } = await supabase
			.from("tasks")
			.select("id, position")
			.eq("board_column_id", board_column_id)
			.neq("id", taskId)
			.order("position", { ascending: true });

		if (tasksError) throw tasksError;

		// Clamp position to valid range
		const clampedPosition = Math.min(position, columnTasks.length);

		// Build new ordered list by splicing the task into the desired position
		columnTasks.splice(clampedPosition, 0, { id: taskId });

		// Build position updates for tasks whose position changed
		const updates = columnTasks
			.map((t, idx) => ({ id: t.id, position: idx }))
			.filter((t) => t.id !== taskId || true); // include all; we'll batch update

		// Update all affected tasks' positions and the moving task's column
		const positionUpdates = updates.filter((t) => t.id !== taskId).map((t) =>
			supabase.from("tasks").update({ position: t.position }).eq("id", t.id)
		);

		const movingTaskPosition = updates.find((t) => t.id === taskId).position;

		await Promise.all([
			...positionUpdates,
			supabase
				.from("tasks")
				.update({ board_column_id, position: movingTaskPosition })
				.eq("id", taskId),
		]);

		// Fetch and return the updated task
		const { data, error } = await supabase
			.from("tasks")
			.select(TASK_SELECT)
			.eq("id", taskId)
			.single();

		if (error) throw error;

		res.status(200).json({ success: true, message: "Task moved successfully.", data });
	} catch (error) {
		next(error);
	}
}
