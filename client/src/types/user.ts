export interface User {
	id: string;
	email: string;
	full_name: string | null;
	avatar_url: string | null;
	role: string;
	status: string;
	created_at: string;
}
