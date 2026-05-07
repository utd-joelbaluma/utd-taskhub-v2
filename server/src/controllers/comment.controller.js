import { supabase } from "../config/supabase.js";
import { userHasProjectPermission } from "../middlewares/permission.middleware.js";
import { validateCreateComment, validateUpdateComment } from "../utils/comment.validator.js";

const COMMENT_SELECT = `
	id,
	body,
	task_id,
	ticket_id,
	created_at,
	updated_at,
	author:profiles!comments_created_by_fkey (
		id,
		full_name,
		email
	)
`;

// parentIdParam: 'taskId' | 'ticketId'
function getColumn(parentIdParam) {
	return parentIdParam === "taskId" ? "task_id" : "ticket_id";
}

export function makeGetComments(parentIdParam) {
	return async function (req, res, next) {
		try {
			const parentId = req.params[parentIdParam];
			const column = getColumn(parentIdParam);

			const { data, error } = await supabase
				.from("comments")
				.select(COMMENT_SELECT)
				.eq(column, parentId)
				.order("created_at", { ascending: true });

			if (error) throw error;

			res.status(200).json({ success: true, count: data.length, data });
		} catch (error) {
			next(error);
		}
	};
}

export function makeCreateComment(parentIdParam) {
	return async function (req, res, next) {
		try {
			const parentId = req.params[parentIdParam];
			const column = getColumn(parentIdParam);

			const errors = validateCreateComment(req.body);
			if (errors.length > 0) {
				return res.status(400).json({ success: false, message: "Validation failed.", errors });
			}

			const { data, error } = await supabase
				.from("comments")
				.insert({
					[column]: parentId,
					body: req.body.body.trim(),
					created_by: req.profile.id,
				})
				.select(COMMENT_SELECT)
				.single();

			if (error) throw error;

			res.status(201).json({ success: true, message: "Comment created successfully.", data });
		} catch (error) {
			next(error);
		}
	};
}

export function makeUpdateComment(parentIdParam) {
	return async function (req, res, next) {
		try {
			const parentId = req.params[parentIdParam];
			const { commentId } = req.params;
			const column = getColumn(parentIdParam);

			const errors = validateUpdateComment(req.body);
			if (errors.length > 0) {
				return res.status(400).json({ success: false, message: "Validation failed.", errors });
			}

			if (req.body.body === undefined) {
				return res.status(400).json({ success: false, message: "No valid fields provided for update." });
			}

			const { data: existing, error: findError } = await supabase
				.from("comments")
				.select("id, created_by")
				.eq("id", commentId)
				.eq(column, parentId)
				.maybeSingle();

			if (findError) throw findError;

			if (!existing) {
				return res.status(404).json({ success: false, message: "Comment not found." });
			}

			if (existing.created_by !== req.profile.id) {
				return res.status(403).json({ success: false, message: "You can only edit your own comments." });
			}

			const { data, error } = await supabase
				.from("comments")
				.update({ body: req.body.body.trim() })
				.eq("id", commentId)
				.select(COMMENT_SELECT)
				.single();

			if (error) throw error;

			res.status(200).json({ success: true, message: "Comment updated successfully.", data });
		} catch (error) {
			next(error);
		}
	};
}

export function makeDeleteComment(parentIdParam) {
	return async function (req, res, next) {
		try {
			const parentId = req.params[parentIdParam];
			const { commentId } = req.params;
			const column = getColumn(parentIdParam);

			const { data: existing, error: findError } = await supabase
				.from("comments")
				.select("id, created_by")
				.eq("id", commentId)
				.eq(column, parentId)
				.maybeSingle();

			if (findError) throw findError;

			if (!existing) {
				return res.status(404).json({ success: false, message: "Comment not found." });
			}

			const projectId = req.params.projectId || req.params.id;
			const isAuthor =
				existing.created_by === req.profile.id &&
				await userHasProjectPermission(req, projectId, "comments.delete_own");
			const isPrivileged = await userHasProjectPermission(
				req,
				projectId,
				"comments.moderate"
			);

			if (!isAuthor && !isPrivileged) {
				return res.status(403).json({ success: false, message: "You do not have permission to delete this comment." });
			}

			const { error } = await supabase.from("comments").delete().eq("id", commentId);
			if (error) throw error;

			res.status(200).json({ success: true, message: "Comment deleted successfully." });
		} catch (error) {
			next(error);
		}
	};
}
