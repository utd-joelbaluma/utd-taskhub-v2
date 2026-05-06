import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const passwordRules = [
	{ label: "At least 8 characters", test: (v: string) => v.length >= 8 },
	{ label: "One uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
	{ label: "One number", test: (v: string) => /[0-9]/.test(v) },
];

export default function RegisterPage() {
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

	function set(field: keyof typeof form) {
		return (e: React.ChangeEvent<HTMLInputElement>) =>
			setForm((prev) => ({ ...prev, [field]: e.target.value }));
	}

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError("");
		if (!form.name || !form.email || !form.password || !form.confirm) {
			setError("Please fill in all fields.");
			return;
		}
		if (form.password !== form.confirm) {
			setError("Passwords do not match.");
			return;
		}
		if (!agreed) {
			setError("You must agree to the terms to continue.");
			return;
		}
		setLoading(true);
		setTimeout(() => setLoading(false), 1500);
	}

	const passwordStrength = passwordRules.filter((r) =>
		r.test(form.password),
	).length;
	const strengthLabel = ["", "Weak", "Fair", "Strong"][passwordStrength];
	const strengthColor = ["", "bg-danger", "bg-warning", "bg-secondary"][
		passwordStrength
	];

	return (
		<div className="min-h-screen bg-background flex">
			{/* Left panel */}
			<div className="hidden lg:flex w-[480px] shrink-0 flex-col justify-between bg-foreground/95 p-10">
				<div className="flex items-center">
					<img
						src="/favicon.svg"
						alt="TaskHub"
						className="h-10 w-10"
					/>
					<span className="ml-2 text-surface text-lg font-bold tracking-tight">
						TaskHub
					</span>
				</div>

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
			<div className="flex-1 flex items-center justify-center px-6 py-12">
				<div className="w-full max-w-[420px]">
					<div className="flex lg:hidden items-center mb-8">
						<img
							src="/logo.svg"
							alt="TaskHub"
							className="h-8 w-auto"
						/>
					</div>

					<div className="mb-8">
						<h1 className="text-2xl font-semibold text-foreground tracking-tight mb-1">
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

					<div className="flex items-center gap-3 mb-5">
						<Separator className="flex-1" />
						<span className="text-xs text-muted">
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
									<div className="flex items-center justify-between">
										<div className="flex flex-wrap gap-x-3 gap-y-1">
											{passwordRules.map((rule) => (
												<span
													key={rule.label}
													className={cn(
														"text-[10px] flex items-center gap-1 transition-colors",
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
													"text-[10px] font-medium shrink-0",
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
								className="mt-0.5"
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
