import { api } from "@/lib/api";

export type TrashRecordType =
	| "projects"
	| "tasks"
	| "tickets"
	| "sprints"
	| "profiles";

export interface TrashDeleter {
	id: string;
	full_name: string | null;
	email: string;
	avatar_url: string | null;
}

export interface TrashItem {
	id: string;
	record_type: TrashRecordType;
	record_id: string;
	name: string | null;
	payload: Record<string, unknown>;
	deleted_at: string;
	deleted_by: string | null;
	deleter: TrashDeleter | null;
}

export interface ListTrashParams {
	record_type?: TrashRecordType;
	deleted_by?: string;
	from?: string;
	to?: string;
	q?: string;
	page?: number;
	limit?: number;
}

export interface ListTrashResponse {
	success: boolean;
	count: number;
	page: number;
	limit: number;
	totalPages: number;
	data: TrashItem[];
}

function buildQuery(params?: ListTrashParams): string {
	if (!params) return "";
	const qs = new URLSearchParams();
	if (params.record_type) qs.set("record_type", params.record_type);
	if (params.deleted_by) qs.set("deleted_by", params.deleted_by);
	if (params.from) qs.set("from", params.from);
	if (params.to) qs.set("to", params.to);
	if (params.q) qs.set("q", params.q);
	if (params.page) qs.set("page", String(params.page));
	if (params.limit) qs.set("limit", String(params.limit));
	const s = qs.toString();
	return s ? `?${s}` : "";
}

export async function listTrash(
	params?: ListTrashParams,
): Promise<ListTrashResponse> {
	return api.get<ListTrashResponse>(`/trash${buildQuery(params)}`);
}

export async function restoreTrashItem(id: string): Promise<void> {
	await api.post(`/trash/${id}/restore`, {});
}

export async function purgeTrashItem(id: string): Promise<void> {
	await api.delete(`/trash/${id}`);
}
