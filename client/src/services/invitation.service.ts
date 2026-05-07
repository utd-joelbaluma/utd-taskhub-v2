import { api } from "@/lib/api";

export interface AcceptInvitationResponse {
	success: boolean;
	requires_registration?: boolean;
	message: string;
	data?: {
		email: string;
		token: string;
		project_id?: string;
		role?: string;
	};
}

export async function acceptInvitation(token: string): Promise<AcceptInvitationResponse> {
	return api.post<AcceptInvitationResponse>("/invitations/accept", { token });
}
