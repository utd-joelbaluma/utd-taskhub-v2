import { supabase, supabaseAdmin } from "../config/supabase.js";
import { env } from "../config/env.js";
import { sendEmail } from "../utils/emailer-util.js";

export const ensureUserDoesNotExist = async (email) => {
	const { data, error } = await supabase
		.from("profiles")
		.select("id")
		.eq("email", email)
		.maybeSingle();

	if (error) throw error;

	if (data) {
		throw new Error("User already exists.");
	}
};

const INVITATION_EXPIRATION_MS = 7 * 24 * 60 * 60 * 1000;

const isValidEmail = (email) => {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const normalizeEmail = (email) => {
	return email.trim().toLowerCase();
};

const getInvitationExpiration = () => {
	return new Date(Date.now() + INVITATION_EXPIRATION_MS).toISOString();
};

const generateInviteEmailTemplate = ({ role, inviteUrl }) => {
	return `
		<h1>Welcome to UTD TaskHub</h1>

		<p>
			You’ve been invited as a <strong>${role}</strong>
			to join <strong>UTD TaskHub</strong>.
		</p>

		<p>
			Manage tasks, collaborate with your team,
			and track project progress efficiently.
		</p>

		<div style="margin: 24px 0;">
			<a
				href="${inviteUrl}"
				style="
					background-color: #2563eb;
					color: #ffffff;
					padding: 12px 20px;
					text-decoration: none;
					border-radius: 6px;
					display: inline-block;
					font-weight: bold;
				"
			>
				Accept Invitation
			</a>
		</div>

		<p style="font-size: 12px; color: #666;">
			If the button doesn’t work, copy and paste this link:
			<br />
			${inviteUrl}
		</p>

		<br />

		<p>
			See you inside,<br />
			UTD TaskHub Team
		</p>
	`;
};

const createInvitationPayload = ({ email, role, invitedBy }) => ({
	email,
	project_id: null,
	invited_by: invitedBy,
	role,
	status: "pending",
	expires_at: getInvitationExpiration(),
});

const findPendingInvitation = async (email) => {
	const { data, error } = await supabase
		.from("invitations")
		.select("*")
		.eq("email", email)
		.eq("status", "pending")
		.maybeSingle();

	if (error) throw error;

	return data;
};

const updateInvitation = async (id, payload) => {
	const { data, error } = await supabase
		.from("invitations")
		.update({
			...payload,
			expires_at: getInvitationExpiration(),
		})
		.eq("id", id)
		.select()
		.single();

	if (error) throw error;

	return data;
};

const createInvitation = async (payload) => {
	const { data, error } = await supabase
		.from("invitations")
		.insert(payload)
		.select()
		.single();

	if (error) throw error;

	return data;
};

const saveInvitation = async ({ email, role, invitedBy }) => {
	const payload = createInvitationPayload({
		email,
		role,
		invitedBy,
	});

	// Only check pending invitations
	// Cancelled invitations are ignored
	const existingInvitation = await findPendingInvitation(email);

	// Update existing pending invitation
	if (existingInvitation) {
		return updateInvitation(existingInvitation.id, payload);
	}

	// Create new invitation
	return createInvitation(payload);
};

export async function inviteUser(req, res, next) {
	try {
		const { email, role = "user" } = req.body;

		if (!isValidEmail(email)) {
			return res.status(400).json({
				success: false,
				message: "A valid email is required.",
			});
		}

		const normalizedEmail = normalizeEmail(email);

		// Prevent inviting existing users
		await ensureUserDoesNotExist(normalizedEmail);

		const invitation = await saveInvitation({
			email: normalizedEmail,
			role,
			invitedBy: req.profile.id,
		});

		const inviteUrl = `${env.appUrl}/invitations/accept?token=${invitation.token}`;

		await sendEmail({
			to: normalizedEmail,
			subject: "You're invited to UTD TaskHub 🚀",
			html: generateInviteEmailTemplate({
				role,
				inviteUrl,
			}),
			text: `You’ve been invited as a ${role} to UTD TaskHub. Accept your invitation here: ${inviteUrl}`,
		});

		return res.status(201).json({
			success: true,
			message: `Invitation sent to ${normalizedEmail}.`,
			data: { invitation },
		});
	} catch (error) {
		next(error);
	}
}
