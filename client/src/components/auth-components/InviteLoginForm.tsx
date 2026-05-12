import { useState } from "react";
import { MailCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { FieldLabel } from "./FieldLabel";
import { FormErrorBanner } from "./FormErrorBanner";
import { PasswordInput } from "./PasswordInput";
import { SubmitButton } from "./SubmitButton";

export type InviteLoginValues = { email: string; password: string };

type Props = {
	statusMessage: string;
	loading: boolean;
	error: string;
	onSubmit: (values: InviteLoginValues) => void;
};

export function InviteLoginForm({
	statusMessage,
	loading,
	error,
	onSubmit,
}: Props) {
	const [form, setForm] = useState<InviteLoginValues>({
		email: "",
		password: "",
	});
	const [localError, setLocalError] = useState("");

	function set(field: keyof InviteLoginValues) {
		return (e: React.ChangeEvent<HTMLInputElement>) =>
			setForm((prev) => ({ ...prev, [field]: e.target.value }));
	}

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setLocalError("");
		if (!form.email || !form.password) {
			setLocalError("Please fill in all fields.");
			return;
		}
		onSubmit(form);
	}

	const shownError = localError || error;

	return (
		<div className="rounded-xl border border-border bg-surface p-8 shadow-sm">
			<div className="mb-6 flex items-center gap-2 rounded-lg bg-secondary/8 px-3 py-2 text-sm text-secondary">
				<MailCheck className="h-4 w-4 shrink-0" />
				<span>{statusMessage}</span>
			</div>

			<h1 className="mb-1 text-xl font-semibold tracking-tight text-foreground">
				Sign in to continue
			</h1>
			<p className="mb-6 text-sm text-muted">
				Your invitation has been accepted. Sign in to access your workspace.
			</p>

			<form onSubmit={handleSubmit} noValidate className="space-y-4">
				<FormErrorBanner message={shownError} />

				<div>
					<FieldLabel htmlFor="login-email">Email address</FieldLabel>
					<Input
						id="login-email"
						type="email"
						placeholder="you@example.com"
						value={form.email}
						onChange={set("email")}
						autoComplete="email"
						autoFocus
						className={cn(
							shownError &&
								!form.email &&
								"border-danger focus-visible:ring-danger",
						)}
					/>
				</div>

				<div>
					<FieldLabel htmlFor="login-password">Password</FieldLabel>
					<PasswordInput
						id="login-password"
						value={form.password}
						onChange={set("password")}
						autoComplete="current-password"
						hasError={Boolean(shownError && !form.password)}
					/>
				</div>

				<SubmitButton
					loading={loading}
					loadingText="Signing in…"
					idleText="Sign in"
				/>
			</form>
		</div>
	);
}
