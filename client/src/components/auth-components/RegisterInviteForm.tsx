import { useState } from "react";
import { Link } from "react-router-dom";
import { MailCheck, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { FieldLabel } from "./FieldLabel";
import { FormErrorBanner } from "./FormErrorBanner";
import { PasswordInput } from "./PasswordInput";
import { PasswordStrengthMeter } from "./PasswordStrengthMeter";
import { SubmitButton } from "./SubmitButton";
import { getPasswordStrength } from "./passwordRules";

export type RegisterInviteValues = {
	name: string;
	password: string;
	confirm: string;
};

type Props = {
	invitedEmail: string;
	loading: boolean;
	error: string;
	onSubmit: (values: RegisterInviteValues) => void;
};

export function RegisterInviteForm({
	invitedEmail,
	loading,
	error,
	onSubmit,
}: Props) {
	const [form, setForm] = useState<RegisterInviteValues>({
		name: "",
		password: "",
		confirm: "",
	});
	const [localError, setLocalError] = useState("");

	function set(field: keyof RegisterInviteValues) {
		return (e: React.ChangeEvent<HTMLInputElement>) =>
			setForm((prev) => ({ ...prev, [field]: e.target.value }));
	}

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setLocalError("");

		if (!form.name || !form.password || !form.confirm) {
			setLocalError("Please fill in all fields.");
			return;
		}
		if (form.password !== form.confirm) {
			setLocalError("Passwords do not match.");
			return;
		}
		if (getPasswordStrength(form.password) < 3) {
			setLocalError("Password does not meet the requirements.");
			return;
		}
		onSubmit(form);
	}

	const shownError = localError || error;

	return (
		<div className="rounded-xl border border-border bg-surface p-8 shadow-sm">
			<div className="mb-6 flex items-center gap-2 rounded-lg bg-primary/8 px-3 py-2 text-sm text-primary">
				<MailCheck className="h-4 w-4 shrink-0" />
				<span>You've been invited to join a project</span>
			</div>

			<h1 className="mb-1 text-xl font-semibold tracking-tight text-foreground">
				Complete your account
			</h1>
			<p className="mb-6 text-sm text-muted">
				Set up your profile to accept the invitation.
			</p>

			<form onSubmit={handleSubmit} noValidate className="space-y-4">
				<FormErrorBanner message={shownError} />

				<div>
					<FieldLabel htmlFor="email">Email address</FieldLabel>
					<div className="relative">
						<Input
							id="email"
							type="email"
							value={invitedEmail}
							readOnly
							className="pr-9 bg-muted/30 cursor-not-allowed text-muted-foreground"
						/>
						<Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
					</div>
				</div>

				<div>
					<FieldLabel htmlFor="name">Full name</FieldLabel>
					<Input
						id="name"
						type="text"
						placeholder="Jane Smith"
						value={form.name}
						onChange={set("name")}
						autoComplete="name"
						autoFocus
						className={cn(
							shownError &&
								!form.name &&
								"border-danger focus-visible:ring-danger",
						)}
					/>
				</div>

				<div>
					<FieldLabel htmlFor="password">Password</FieldLabel>
					<PasswordInput
						id="password"
						value={form.password}
						onChange={set("password")}
						autoComplete="new-password"
						hasError={Boolean(shownError && !form.password)}
					/>
					<PasswordStrengthMeter password={form.password} />
				</div>

				<div>
					<FieldLabel htmlFor="confirm">Confirm password</FieldLabel>
					<PasswordInput
						id="confirm"
						value={form.confirm}
						onChange={set("confirm")}
						autoComplete="new-password"
						hasError={Boolean(
							shownError &&
								form.password !== form.confirm &&
								form.confirm,
						)}
					/>
					{form.confirm && form.password !== form.confirm && (
						<p className="text-[11px] text-danger mt-1">
							Passwords do not match.
						</p>
					)}
				</div>

				<SubmitButton
					loading={loading}
					loadingText="Setting up your account…"
					idleText="Accept and Register"
				/>
			</form>

			<p className="mt-6 text-center text-sm text-muted">
				Already have an account?{" "}
				<Link
					to="/login"
					className="text-primary font-medium hover:underline"
				>
					Sign in
				</Link>
			</p>
		</div>
	);
}
