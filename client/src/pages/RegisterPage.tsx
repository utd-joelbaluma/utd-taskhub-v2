import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowRight, Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { registerUser } from "@/services/auth.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const DEFAULT_ROLE = "user";

const passwordRules = [
	{ label: "At least 8 characters", test: (v: string) => v.length >= 8 },
	{ label: "One uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
	{ label: "One number", test: (v: string) => /[0-9]/.test(v) },
];

export default function RegisterPage() {
	const { login, isAuthenticated } = useAuth();
	const navigate = useNavigate();

	const [showPassword, setShowPassword] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);
	const [form, setForm] = useState({
		name: "",
		email: "",
		password: "",
		confirm: "",
	});
	const [agreed, setAgreed] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		if (isAuthenticated) navigate("/", { replace: true });
	}, [isAuthenticated, navigate]);

	if (isAuthenticated) return <Navigate to="/" replace />;

	function set(field: keyof typeof form) {
		return (e: React.ChangeEvent<HTMLInputElement>) =>
			setForm((prev) => ({ ...prev, [field]: e.target.value }));
	}

	function handleGoogleSignIn() {
		const apiUrl =
			import.meta.env.VITE_API_URL ?? "http://localhost:5050/api/v1";
		window.location.href = `${apiUrl}/auth/google`;
	}

	function getPasswordStrengthCount(value: string) {
		return passwordRules.filter((r) => r.test(value)).length;
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError("");
		const name = form.name.trim();
		const email = form.email.trim().toLowerCase();
		if (!name || !email || !form.password || !form.confirm) {
			setError("Please fill in all fields.");
			return;
		}
		if (form.password !== form.confirm) {
			setError("Passwords do not match.");
			return;
		}
		if (getPasswordStrengthCount(form.password) < passwordRules.length) {
			setError("Password does not meet all requirements.");
			return;
		}
		if (!agreed) {
			setError("You must agree to the terms to continue.");
			return;
		}

		setLoading(true);
		try {
			await registerUser(email, form.password, name, DEFAULT_ROLE);
			await login(email, form.password, false);
			toast.success("Account created. Welcome!");
			navigate("/", { replace: true });
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Registration failed.";
			setError(message);
		} finally {
			setLoading(false);
		}
	}

	const passwordStrength = passwordRules.filter((r) =>
		r.test(form.password),
	).length;
	const strengthLabel = ["", "Weak", "Fair", "Strong"][passwordStrength];
	const strengthColor = ["", "bg-danger", "bg-warning", "bg-secondary"][
		passwordStrength
	];

	return (
		<div className="flex min-h-svh bg-background lg:min-h-screen">
			{/* Left panel */}
			<div className="hidden w-[420px] shrink-0 flex-col justify-between bg-foreground/95 p-8 xl:flex xl:w-[480px] xl:p-10">
				<Link
					to="/"
					aria-label="TaskHub home"
					className="flex items-center"
				>
					<img
						src="/favicon.svg"
						alt="TaskHub"
						className="h-10 w-10"
					/>
					<span className="ml-2 text-surface text-lg font-bold tracking-tight">
						TaskHub
					</span>
				</Link>

				<div>
					<div className="mb-8 space-y-5">
						{[
							{
								step: "01",
								title: "Create your account",
								desc: "Set up your personal workspace in under a minute.",
								active: true,
							},
							{
								step: "02",
								title: "Invite your team",
								desc: "Bring in collaborators via email invites.",
								active: false,
							},
							{
								step: "03",
								title: "Start shipping",
								desc: "Manage sprints, tasks, and issues from one place.",
								active: false,
							},
						].map((item) => (
							<div
								key={item.step}
								className="flex items-start gap-4"
							>
								<div
									className={cn(
										"h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold border-2 mt-0.5",
										item.active
											? "bg-primary border-primary text-primary-foreground"
											: "bg-transparent border-surface/20 text-surface/40",
									)}
								>
									{item.active ? (
										<Check className="h-3.5 w-3.5" />
									) : (
										item.step
									)}
								</div>
								<div>
									<p
										className={cn(
											"text-sm font-semibold",
											item.active
												? "text-surface"
												: "text-surface/40",
										)}
									>
										{item.title}
									</p>
									<p
										className={cn(
											"text-xs mt-0.5",
											item.active
												? "text-surface/70"
												: "text-surface/30",
										)}
									>
										{item.desc}
									</p>
								</div>
							</div>
						))}
					</div>

					<div className="rounded-xl bg-surface/8 border border-surface/10 p-5">
						<div className="flex items-center gap-3 mb-3">
							<div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-semibold">
								SR
							</div>
							<div>
								<p className="text-surface text-sm font-medium">
									Sarah R., Engineering Lead
								</p>
								<p className="text-surface/50 text-xs">
									Acme Corp
								</p>
							</div>
						</div>
						<p className="text-surface/80 text-sm leading-relaxed">
							"TaskHub cut our sprint planning time in half. The
							board is clean, fast, and actually makes sense."
						</p>
					</div>
				</div>

				<p className="text-surface/30 text-xs">
					© 2026 TaskHub. All rights reserved.
				</p>
			</div>

			{/* Right panel */}
			<div className="flex min-h-svh flex-1 items-start justify-center overflow-y-auto px-4 py-6 sm:items-center sm:px-6 sm:py-10 lg:min-h-screen lg:px-10 xl:px-6 xl:py-12">
				<div className="w-full max-w-[420px]">
					<Link
						to="/"
						aria-label="TaskHub home"
						className="mb-8 flex items-center justify-center xl:hidden"
					>
						<img
							src="/logo.svg"
							alt="TaskHub"
							className="h-8 w-auto max-w-full"
						/>
					</Link>

					<div className="mb-6 sm:mb-8">
						<h1 className="mb-1 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
							Create your account
						</h1>
						<p className="text-sm text-muted">
							Get started free. No credit card required.
						</p>
					</div>

					<Button
						variant="outline"
						className="w-full mb-4 gap-2"
						type="button"
						onClick={handleGoogleSignIn}
					>
						<svg
							viewBox="0 0 24 24"
							className="h-4 w-4"
							aria-hidden="true"
						>
							<path
								d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
								fill="#4285F4"
							/>
							<path
								d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
								fill="#34A853"
							/>
							<path
								d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
								fill="#FBBC05"
							/>
							<path
								d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
								fill="#EA4335"
							/>
						</svg>
						Continue with Google
					</Button>

					<div className="mb-5 flex items-center gap-3">
						<Separator className="flex-1" />
						<span className="shrink-0 text-xs text-muted">
							or register with email
						</span>
						<Separator className="flex-1" />
					</div>

					<form
						onSubmit={handleSubmit}
						noValidate
						className="space-y-4"
					>
						{error && (
							<div className="rounded-lg border border-danger/20 bg-danger-subtle px-4 py-3 text-sm text-danger">
								{error}
							</div>
						)}

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
								className={cn(
									error &&
										!form.name &&
										"border-danger focus-visible:ring-danger",
								)}
							/>
						</div>

						<div>
							<label
								htmlFor="email"
								className="block text-sm font-medium text-muted-foreground mb-1.5"
							>
								Work email
							</label>
							<Input
								id="email"
								type="email"
								placeholder="jane@company.com"
								value={form.email}
								onChange={set("email")}
								autoComplete="email"
								className={cn(
									error &&
										!form.email &&
										"border-danger focus-visible:ring-danger",
								)}
							/>
						</div>

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
										error &&
											!form.password &&
											"border-danger focus-visible:ring-danger",
									)}
								/>
								<button
									type="button"
									onClick={() => setShowPassword((v) => !v)}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-muted-foreground transition-colors focus:outline-none"
									aria-label={
										showPassword
											? "Hide password"
											: "Show password"
									}
								>
									{showPassword ? (
										<EyeOff className="h-4 w-4" />
									) : (
										<Eye className="h-4 w-4" />
									)}
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
													i < passwordStrength
														? strengthColor
														: "bg-border",
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
														rule.test(form.password)
															? "text-secondary"
															: "text-muted",
													)}
												>
													<Check
														className={cn(
															"h-2.5 w-2.5",
															rule.test(
																form.password,
															)
																? "opacity-100"
																: "opacity-0",
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
													passwordStrength === 1 &&
														"text-danger",
													passwordStrength === 2 &&
														"text-warning",
													passwordStrength === 3 &&
														"text-secondary",
												)}
											>
												{strengthLabel}
											</span>
										)}
									</div>
								</div>
							)}
						</div>

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
									aria-label={
										showConfirm
											? "Hide password"
											: "Show password"
									}
								>
									{showConfirm ? (
										<EyeOff className="h-4 w-4" />
									) : (
										<Eye className="h-4 w-4" />
									)}
								</button>
							</div>
							{form.confirm && form.password !== form.confirm && (
								<p className="text-[11px] text-danger mt-1">
									Passwords do not match.
								</p>
							)}
						</div>

						<label className="flex items-start gap-2.5 cursor-pointer">
							<Checkbox
								id="terms"
								checked={agreed}
								onCheckedChange={(v) => setAgreed(!!v)}
								className="mt-0.5 shrink-0"
							/>
							<span className="text-sm text-muted-foreground leading-snug">
								I agree to the{" "}
								<a
									href="#"
									className="text-primary hover:underline"
								>
									Terms of Service
								</a>{" "}
								and{" "}
								<a
									href="#"
									className="text-primary hover:underline"
								>
									Privacy Policy
								</a>
							</span>
						</label>

						<Button
							type="submit"
							className="w-full"
							disabled={loading}
						>
							{loading ? (
								<span className="flex items-center gap-2">
									<span className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
									Creating account…
								</span>
							) : (
								<span className="flex items-center gap-2">
									Create account{" "}
									<ArrowRight className="h-4 w-4" />
								</span>
							)}
						</Button>
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
			</div>
		</div>
	);
}
