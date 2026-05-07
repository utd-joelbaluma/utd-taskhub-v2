import { supabaseAdmin } from "../config/supabase.js";

export async function sendInvitationEmail({
	to,
	invitedByName,
	projectName,
	role,
	inviteUrl,
}) {
	if (process.env.NODE_ENV === "development") {
		console.log("\n[Mailer] Sending invitation via Supabase Auth");
		console.log(`  To:       ${to}`);
		console.log(`  Invited:  ${invitedByName}`);
		console.log(`  Project:  ${projectName}`);
		console.log(`  Role:     ${role}`);
		console.log(`  Link:     ${inviteUrl}\n`);
	}

	const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(to, {
		redirectTo: inviteUrl,
		data: { invited_by: invitedByName, project_name: projectName, role },
	});

	if (error) {
		// Non-fatal: user may already exist in Supabase Auth.
		// The invitation record is still created and can be accepted via the token link.
		console.warn(`[Mailer] inviteUserByEmail failed for ${to}:`, error.message);
	}
}
