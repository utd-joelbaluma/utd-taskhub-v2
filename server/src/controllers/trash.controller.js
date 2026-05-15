import { supabase } from "../config/supabase.js";

const VALID_RECORD_TYPES = ["projects", "tasks", "tickets", "sprints", "profiles"];
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export async function listTrash(req, res, next) {
	try {
		const { record_type, deleted_by, from: fromDate, to: toDate, q } = req.query;

		if (record_type && !VALID_RECORD_TYPES.includes(record_type)) {
			return res.status(400).json({
				success: false,
				message: `record_type must be one of: ${VALID_RECORD_TYPES.join(", ")}.`,
			});
		}

		const rawPage = parseInt(req.query.page, 10);
		const rawLimit = parseInt(req.query.limit, 10);
		const page = rawPage > 0 ? rawPage : 1;
		const limit = rawLimit > 0 ? Math.min(rawLimit, MAX_LIMIT) : DEFAULT_LIMIT;
		const rangeFrom = (page - 1) * limit;
		const rangeTo = rangeFrom + limit - 1;

		let query = supabase
			.from("trash")
			.select(
				"id, record_type, record_id, name, payload, deleted_at, deleted_by, " +
					"deleter:profiles!trash_deleted_by_fkey(id, full_name, email, avatar_url)",
				{ count: "exact" },
			)
			.order("deleted_at", { ascending: false })
			.range(rangeFrom, rangeTo);

		if (record_type) query = query.eq("record_type", record_type);
		if (deleted_by) query = query.eq("deleted_by", deleted_by);
		if (fromDate) query = query.gte("deleted_at", fromDate);
		if (toDate) query = query.lte("deleted_at", toDate);
		if (q) query = query.ilike("name", `%${q}%`);

		const { data, error, count } = await query;
		if (error) throw error;

		res.status(200).json({
			success: true,
			count,
			page,
			limit,
			totalPages: Math.ceil((count ?? 0) / limit),
			data,
		});
	} catch (error) {
		next(error);
	}
}

export async function restoreTrash(req, res, next) {
	try {
		const { id } = req.params;

		const { data, error } = await supabase.rpc("restore_trash_record", {
			trash_id: id,
		});

		if (error) {
			const msg = error.message || "Restore failed.";
			const status =
				error.code === "P0002"
					? 404
					: error.code === "P0001"
						? 400
						: 500;
			return res.status(status).json({ success: false, message: msg });
		}

		res.status(200).json({ success: true, message: "Record restored.", data });
	} catch (error) {
		next(error);
	}
}

export async function purgeTrash(req, res, next) {
	try {
		const { id } = req.params;

		const { data, error } = await supabase
			.from("trash")
			.delete()
			.eq("id", id)
			.select("id")
			.maybeSingle();

		if (error) throw error;
		if (!data) {
			return res.status(404).json({ success: false, message: "Trash entry not found." });
		}

		res.status(200).json({ success: true, message: "Permanently deleted." });
	} catch (error) {
		next(error);
	}
}
