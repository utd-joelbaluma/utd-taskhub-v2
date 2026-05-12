import { useState } from "react";
import { MailCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { FieldLabel } from "./FieldLabel";
import { FormErrorBanner } from "./FormErrorBanner";
import { PasswordInput } from "./PasswordInput";
import { PasswordStrengthMeter } from "./PasswordStrengthMeter";
import { SubmitButton } from "./SubmitButton";
import { getPasswordStrength } from "./passwordRules";

export type CompleteAccountValues = {
	name: string;
	password: string;
	confirm: string;
};

type Props = {
	loading: boolean;
	error: string;
	onSubmit: (values: CompleteAccountValues) => void;
};

export function CompleteAccountForm({ loading, error, onSubmit }: Props) {
	const [form, setForm] = useState<CompleteAccountValues>({
		name: "",
		password: "",
		confirm: "",
	});
	const [localError, setLocalError] = useState("");

	function set(field: keyof CompleteAccountValues) {
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
				<span>Invitation accepted — set up your account</span>
			</div>

			<h1 className="mb-1 text-xl font-semibold tracking-tight text-foreground">
				Complete your account
			</h1>
			<p className="mb-6 text-sm text-muted">
				Set your name and a password to finish joining.
			</p>

			<form onSubmit={handleSubmit} noValidate className="space-y-4">
				<FormErrorBanner message={shownError} />

				<div>
					<FieldLabel htmlFor="complete-name">Full name</FieldLabel>
					<Input
						id="complete-name"
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
					<FieldLabel htmlFor="complete-password">Password</FieldLabel>
					<PasswordInput
						id="complete-password"
						value={form.password}
						onChange={set("password")}
						autoComplete="new-password"
						hasError={Boolean(shownError && !form.password)}
					/>
					<PasswordStrengthMeter password={form.password} />
				</div>

				<div>
					<FieldLabel htmlFor="complete-confirm">
						Confirm password
					</FieldLabel>
					<PasswordInput
						id="complete-confirm"
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
					idleText="Finish setup"
				/>
			</form>
		</div>
	);
}
