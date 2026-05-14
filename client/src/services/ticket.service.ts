import { api } from "@/lib/api";
import type { Task } from "@/services/task.service";

export type TicketType = "bug" | "feature_request" | "issue" | "support" | "other";
export type TicketStatus = "open" | "in_review" | "resolved" | "closed" | "cancelled";
export type TicketPriority = "low" | "medium" | "high" | "urgent";

export interface TicketProfile {
	id: string;
	full_name: string | null;
	email: string;
}

export interface Ticket {
	id: string;
	project_id: string;
	converted_task_id: string | null;
	title: string;
	description: string | null;
	type: TicketType;
	status: TicketStatus;
	priority: TicketPriority;
	assigned_to: TicketProfile | null;
	created_by: TicketProfile;
	due_date: string | null;
	resolution: string | null;
	closed_at: string | null;
	closed_by: TicketProfile | null;
	created_at: string;
	updated_at: string;
}

export interface ListTicketsParams {
	status?: TicketStatus;
	type?: TicketType;
	priority?: TicketPriority;
	assigned_to?: string;
}

export interface CreateTicketPayload {
	title: string;
	description?: string;
	type?: TicketType;
	priority?: TicketPriority;
	status?: TicketStatus;
	assigned_to?: string;
	due_date?: string;
}

export interface UpdateTicketPayload {
	title?: string;
	description?: string;
	type?: TicketType;
	priority?: TicketPriority;
	status?: TicketStatus;
	assigned_to?: string;
	due_date?: string;
}

export interface ConvertTicketPayload {
	title?: string;
	description?: string;
	priority?: string;
	status?: string;
	assigned_to?: string;
	due_date?: string;
	tags?: string[];
	board_column_id?: string;
}

export async function listTickets(
	projectId: string,
	params?: ListTicketsParams
): Promise<Ticket[]> {
	const query = new URLSearchParams();
	if (params?.status) query.set("status", params.status);
	if (params?.type) query.set("type", params.type);
	if (params?.priority) query.set("priority", params.priority);
	if (params?.assigned_to) query.set("assigned_to", params.assigned_to);
	const qs = query.toString();
	const res = await api.get<{ success: boolean; data: Ticket[] }>(
		`/projects/${projectId}/tickets${qs ? `?${qs}` : ""}`
	);
	return res.data;
}

export async function getTicket(projectId: string, ticketId: string): Promise<Ticket> {
	const res = await api.get<{ success: boolean; data: Ticket }>(
		`/projects/${projectId}/tickets/${ticketId}`
	);
	return res.data;
}

export async function createTicket(
	projectId: string,
	payload: CreateTicketPayload
): Promise<Ticket> {
	const res = await api.post<{ success: boolean; data: Ticket }>(
		`/projects/${projectId}/tickets`,
		payload
	);
	return res.data;
}

export async function updateTicket(
	projectId: string,
	ticketId: string,
	payload: UpdateTicketPayload
): Promise<Ticket> {
	const res = await api.patch<{ success: boolean; data: Ticket }>(
		`/projects/${projectId}/tickets/${ticketId}`,
		payload
	);
	return res.data;
}

export async function deleteTicket(projectId: string, ticketId: string): Promise<void> {
	await api.delete(`/projects/${projectId}/tickets/${ticketId}`);
}

export async function closeTicket(
	projectId: string,
	ticketId: string,
	resolution?: string
): Promise<Ticket> {
	const res = await api.post<{ success: boolean; data: Ticket }>(
		`/projects/${projectId}/tickets/${ticketId}/close`,
		resolution !== undefined ? { resolution } : {}
	);
	return res.data;
}

export async function convertTicketToTask(
	projectId: string,
	ticketId: string,
	payload: ConvertTicketPayload
): Promise<{ ticket: Ticket; task: Task }> {
	const res = await api.post<{ success: boolean; data: { ticket: Ticket; task: Task } }>(
		`/projects/${projectId}/tickets/${ticketId}/convert`,
		payload
	);
	return res.data;
}
