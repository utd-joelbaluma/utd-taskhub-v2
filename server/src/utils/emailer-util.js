// utils/mail.js

import nodemailer from "nodemailer";
import { env } from "../config/env.js";

// Create reusable transporter
const transporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: env.GMAIL_USER,
		pass: env.GMAIL_APP_PASSWORD, // NOT your normal password
	},
});

// Default sender
const DEFAULT_SENDER = {
	email: env.GMAIL_USER,
	name: env.MAIL_SENDER_NAME || "My App",
};

/**
 * Send Email via Gmail SMTP
 *
 * @param {Object} params
 * @param {string|string[]} params.to
 * @param {string} params.subject
 * @param {string} params.html
 * @param {string} [params.text]
 * @param {Object} [params.from]
 */
const sendEmail = async ({
	to,
	subject,
	html,
	text,
	from = DEFAULT_SENDER,
}) => {
	try {
		if (!to) throw new Error("Recipient email is required");
		if (!subject) throw new Error("Email subject is required");
		if (!html && !text) throw new Error("Email content is required");

		const recipients = Array.isArray(to) ? to.join(",") : to;

		const info = await transporter.sendMail({
			from: `"${from.name}" <${from.email}>`,
			to: recipients,
			subject,
			text: text || " ",
			html,
		});

		console.log("Email sent:", info.messageId);

		return info;
	} catch (error) {
		console.error("Failed to send email:", error);
		throw error;
	}
};

export { sendEmail };
