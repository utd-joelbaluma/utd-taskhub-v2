// TODO: Replace the placeholder below with a real email provider.
// Recommended options: Resend (resend.com), Nodemailer + SMTP, SendGrid.
//
// Example with Resend:
//   import { Resend } from 'resend';
//   const resend = new Resend(process.env.RESEND_API_KEY);
//   await resend.emails.send({ from, to, subject, html });

export async function sendInvitationEmail({
	to,
	invitedByName,
	projectName,
	role,
	inviteUrl,
}) {
	if (process.env.NODE_ENV === "development") {
		console.log("\n[Mailer] Invitation email (not sent in development)");
		console.log(`  To:       ${to}`);
		console.log(`  Invited:  ${invitedByName}`);
		console.log(`  Project:  ${projectName}`);
		console.log(`  Role:     ${role}`);
		console.log(`  Link:     ${inviteUrl}\n`);
	}

	// Replace with real send logic for production:
	// await resend.emails.send({
	//   from: 'noreply@yourdomain.com',
	//   to,
	//   subject: `You've been invited to join ${projectName} on TaskHub`,
	//   html: `<p>${invitedByName} invited you to join <strong>${projectName}</strong> as a <strong>${role}</strong>.</p>
	//          <p><a href="${inviteUrl}">Accept Invitation</a></p>
	//          <p>This link expires in 7 days.</p>`,
	// });
}
