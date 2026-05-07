import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Check, ArrowRight, MailCheck, XCircle, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { acceptInvitation } from "@/services/invitation.service";
import { registerUser, loginWithEmail } from "@/services/auth.service";
import { useAuth } from "@/context/AuthContext";

const passwordRules = [
	{ label: "At least 8 characters", test: (v: string) => v.length >= 8 },
	{ label: "One uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
	{ label: "One number", test: (v: string) => /[0-9]/.test(v) },
];

type PageState = "loading" | "requires_registration" | "success" | "error";

export default function AcceptInvitationPage() {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const { isAuthenticated } = useAuth();

	const token = searchParams.get("token") ?? "";

	const [pageState, setPageState] = useState<PageState>("loading");
	const [invitedEmail, setInvitedEmail] = useState("");
	const [statusMessage, setStatusMessage] = useState("");

	const [form, setForm] = useState({ name: "", password: "", confirm: "" });
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	function set(field: keyof typeof form) {
		return (e: React.ChangeEvent<HTMLInputElement>) =>
			setForm((prev) => ({ ...prev, [field]: e.target.value }));
	}

	useEffect(() => {
		if (!token) {
			setStatusMessage("No invitation token found. Check your invitation link.");
			setPageState("error");
			return;
		}

		acceptInvitation(token)
			.then((res) => {
				if (res.requires_registration) {
					setInvitedEmail(res.data?.email ?? "");
					setPageState("requires_registration");
				} else {
					// User was already registered — invitation accepted
					setStatusMessage(res.message);
					setPageState("success");
				}
			})
			.catch((err: Error) => {
				setStatusMessage(err.message);
				setPageState("error");
			});
	}, [token]);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError("");

		if (!form.name || !form.password || !form.confirm) {
			setError("Please fill in all fields.");
			return;
		}
		if (form.password !== form.confirm) {
			setError("Passwords do not match.");
			return;
		}
		const strength = passwordRules.filter((r) => r.test(form.password)).length;
		if (strength < 3) {
			setError("Password does not meet the requirements.");
			return;
		}

		setLoading(true);
		try {
			await registerUser(invitedEmail, form.password, form.name.trim());
			await acceptInvitation(token);
			const session = await loginWithEmail(invitedEmail, form.password);
			localStorage.setItem("access_token", session.access_token);
			localStorage.setItem("refresh_token", session.refresh_token);
			navigate("/");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Something went wrong.");
		} finally {
			setLoading(false);
		}
	}

	const passwordStrength = passwordRules.filter((r) => r.test(form.password)).length;
	const strengthLabel = ["", "Weak", "Fair", "Strong"][passwordStrength];
	const strengthColor = ["", "bg-danger", "bg-warning", "bg-secondary"][passwordStrength];

	// If already logged in and not requiring registration, go to dashboard
	useEffect(() => {
		if (isAuthenticated && pageState === "success") {
			navigate("/");
		}
	}, [isAuthenticated, pageState, navigate]);

	return (
		<div className="flex min-h-svh items-center justify-center bg-background px-4 py-10">
			<div className="w-full max-w-[420px]">
				{/* Logo */}
				<div className="flex items-center justify-center mb-8">
					<img src="/favicon.svg" alt="TaskHub" className="h-9 w-9" />
					<span className="ml-2 text-lg font-bold tracking-tight text-foreground">
						TaskHub
					</span>
				</div>

				{/* Loading */}
				{pageState === "loading" && (
					<div className="flex flex-col items-center gap-3 py-12 text-muted">
						<Loader2 className="h-8 w-8 animate-spin" />
						<p className="text-sm">Verifying your invitation…</p>
					</div>
				)}

				{/* Error */}
				{pageState === "error" && (
					<div className="rounded-xl border border-border bg-surface p-8 text-center shadow-sm">
						<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-danger/10">
							<XCircle className="h-6 w-6 text-danger" />
						</div>
						<h1 className="mb-2 text-lg font-semibold text-foreground">
							Invitation unavailable
						</h1>
						<p className="mb-6 text-sm text-muted">{statusMessage}</p>
						<Link
							to="/login"
							className="text-sm font-medium text-primary hover:underline"
						>
							Go to sign in
						</Link>
					</div>
				)}

				{/* Already registered — success */}
				{pageState === "success" && (
					<div className="rounded-xl border border-border bg-surface p-8 text-center shadow-sm">
						<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10">
							<MailCheck className="h-6 w-6 text-secondary" />
						</div>
						<h1 className="mb-2 text-lg font-semibold text-foreground">
							You're in!
						</h1>
						<p className="mb-6 text-sm text-muted">{statusMessage}</p>
						<Link to="/login">
							<Button className="w-full">
								Sign in to your account <ArrowRight className="ml-2 h-4 w-4" />
							</Button>
						</Link>
					</div>
				)}

				{/* Registration form */}
				{pageState === "requires_registration" && (
					<div className="rounded-xl border border-border bg-surface p-8 shadow-sm">
						{/* Badge */}
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
							{error && (
								<div className="rounded-lg border border-danger/20 bg-danger-subtle px-4 py-3 text-sm text-danger">
									{error}
								</div>
							)}

							{/* Email — locked */}
							<div>
								<label
									htmlFor="email"
									className="block text-sm font-medium text-muted-foreground mb-1.5"
								>
									Email address
								</label>
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

							{/* Full name */}
							<div>
								<label
									htmlFor="name"
									className="block text-sm font-medium text-muted-foreground mb-1.5"
								>
									Full name
								</label>
								<Input
									id="name"
									type="text"
									placeholder="Jane Smith"
									value={form.name}
									onChange={set("name")}
									autoComplete="name"
									autoFocus
									className={cn(
										error && !form.name && "border-danger focus-visible:ring-danger",
									)}
								/>
							</div>

							{/* Password */}
							<div>
								<label
									htmlFor="password"
									className="block text-sm font-medium text-muted-foreground mb-1.5"
								>
									Password
								</label>
								<div className="relative">
									<Input
										id="password"
										type={showPassword ? "text" : "password"}
										placeholder="••••••••"
										value={form.password}
										onChange={set("password")}
										autoComplete="new-password"
										className={cn(
											"pr-10",
											error && !form.password && "border-danger focus-visible:ring-danger",
										)}
									/>
									<button
										type="button"
										onClick={() => setShowPassword((v) => !v)}
										className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-muted-foreground transition-colors focus:outline-none"
										aria-label={showPassword ? "Hide password" : "Show password"}
									>
										{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
									</button>
								</div>

								{form.password && (
									<div className="mt-2">
										<div className="flex gap-1 mb-1.5">
											{[0, 1, 2].map((i) => (
												<div
													key={i}
													className={cn(
														"h-1 flex-1 rounded-full transition-colors",
														i < passwordStrength ? strengthColor : "bg-border",
													)}
												/>
											))}
										</div>
										<div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
											<div className="flex flex-wrap gap-x-3 gap-y-1">
												{passwordRules.map((rule) => (
													<span
														key={rule.label}
														className={cn(
															"flex items-center gap-1 text-[10px] transition-colors",
															rule.test(form.password) ? "text-secondary" : "text-muted",
														)}
													>
														<Check
															className={cn(
																"h-2.5 w-2.5",
																rule.test(form.password) ? "opacity-100" : "opacity-0",
															)}
														/>
														{rule.label}
													</span>
												))}
											</div>
											{strengthLabel && (
												<span
													className={cn(
														"shrink-0 text-[10px] font-medium",
														passwordStrength === 1 && "text-danger",
														passwordStrength === 2 && "text-warning",
														passwordStrength === 3 && "text-secondary",
													)}
												>
													{strengthLabel}
												</span>
											)}
										</div>
									</div>
								)}
							</div>

							{/* Confirm password */}
							<div>
								<label
									htmlFor="confirm"
									className="block text-sm font-medium text-muted-foreground mb-1.5"
								>
									Confirm password
								</label>
								<div className="relative">
									<Input
										id="confirm"
										type={showConfirm ? "text" : "password"}
										placeholder="••••••••"
										value={form.confirm}
										onChange={set("confirm")}
										autoComplete="new-password"
										className={cn(
											"pr-10",
											error &&
												form.password !== form.confirm &&
												form.confirm &&
												"border-danger focus-visible:ring-danger",
										)}
									/>
									<button
										type="button"
										onClick={() => setShowConfirm((v) => !v)}
										className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-muted-foreground transition-colors focus:outline-none"
										aria-label={showConfirm ? "Hide password" : "Show password"}
									>
										{showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
									</button>
								</div>
								{form.confirm && form.password !== form.confirm && (
									<p className="text-[11px] text-danger mt-1">Passwords do not match.</p>
								)}
							</div>

							<Button type="submit" className="w-full" disabled={loading}>
								{loading ? (
									<span className="flex items-center gap-2">
										<span className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
										Setting up your account…
									</span>
								) : (
									<span className="flex items-center gap-2">
										Accept and Register <ArrowRight className="h-4 w-4" />
									</span>
								)}
							</Button>
						</form>

						<p className="mt-6 text-center text-sm text-muted">
							Already have an account?{" "}
							<Link to="/login" className="text-primary font-medium hover:underline">
								Sign in
							</Link>
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
