import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { CalendarDays, Mail, ShieldCheck, Upload, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import {
	getProfile,
	updateProfile,
	uploadProfileAvatar,
	type Profile,
	type UpdateProfilePayload,
} from "@/services/profile.service";

const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

const STATUS_VARIANT: Record<string, string> = {
	active: "bg-success-subtle text-success border-success/20",
	invited: "bg-accent-subtle text-accent border-accent/20",
	disabled: "bg-danger-subtle text-danger border-danger/20",
};

const ROLE_VARIANT: Record<string, string> = {
	admin: "bg-primary-subtle text-primary border-primary/20",
	manager: "bg-accent-subtle text-accent border-accent/20",
	developer: "bg-success-subtle text-success border-success/20",
	user: "bg-muted-subtle text-muted-foreground border-border",
};

function getInitials(name: string | null, email: string): string {
	if (name) {
		return name
			.split(" ")
			.map((p) => p[0])
			.join("")
			.toUpperCase()
			.slice(0, 2);
	}
	return email.slice(0, 2).toUpperCase();
}

function formatDate(dateStr: string): string {
	return new Date(dateStr).toLocaleDateString("en-US", {
		month: "long",
		day: "numeric",
		year: "numeric",
	});
}

export default function ProfilePage() {
	const { user } = useAuth();
	const [profile, setProfile] = useState<Profile | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [avatarFile, setAvatarFile] = useState<File | null>(null);
	const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
	const [avatarMarkedForRemoval, setAvatarMarkedForRemoval] = useState(false);
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const [form, setForm] = useState<UpdateProfilePayload>({
		full_name: "",
		avatar_url: "",
	});

	useEffect(() => {
		return () => {
			if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
		};
	}, [avatarPreviewUrl]);

	useEffect(() => {
		if (!user?.id) return;
		setLoading(true);
		getProfile(user.id)
			.then((p) => {
				setProfile(p);
				setForm({
					full_name: p.full_name ?? "",
					avatar_url: p.avatar_url ?? "",
				});
				setAvatarFile(null);
				setAvatarPreviewUrl(null);
				setAvatarMarkedForRemoval(false);
			})
			.catch(() => toast.error("Failed to load profile."))
			.finally(() => setLoading(false));
	}, [user?.id]);

	function handleAvatarChange(file: File | undefined) {
		if (!file) return;

		if (!file.type.startsWith("image/")) {
			toast.error("Choose an image file for your avatar.");
			return;
		}

		if (file.size > AVATAR_MAX_BYTES) {
			toast.error("Avatar image must be 2 MB or smaller.");
			return;
		}

		if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
		setAvatarFile(file);
		setAvatarPreviewUrl(URL.createObjectURL(file));
		setAvatarMarkedForRemoval(false);
		setForm((f) => ({ ...f, avatar_url: profile?.avatar_url ?? "" }));
	}

	function handleRemoveAvatar() {
		if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
		setAvatarFile(null);
		setAvatarPreviewUrl(null);
		setAvatarMarkedForRemoval(true);
		setForm((f) => ({ ...f, avatar_url: "" }));
		if (fileInputRef.current) fileInputRef.current.value = "";
	}

	async function handleSave(e: React.FormEvent) {
		e.preventDefault();
		if (!profile) return;
		setSaving(true);
		try {
			const payload: UpdateProfilePayload = {};
			const trimmedName = form.full_name?.trim();
			const trimmedAvatar = form.avatar_url?.trim();
			if (trimmedName !== (profile.full_name ?? "")) payload.full_name = trimmedName || null;
			if (!avatarFile && (avatarMarkedForRemoval || trimmedAvatar !== (profile.avatar_url ?? ""))) payload.avatar_url = trimmedAvatar || null;

			if (Object.keys(payload).length === 0 && !avatarFile) {
				toast.info("No changes to save.");
				return;
			}

			let updated = profile;
			if (Object.keys(payload).length > 0) {
				updated = await updateProfile(profile.id, payload);
			}
			if (avatarFile) {
				updated = await uploadProfileAvatar(profile.id, avatarFile);
			}
			setProfile(updated);
			setForm({
				full_name: updated.full_name ?? "",
				avatar_url: updated.avatar_url ?? "",
			});
			if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
			setAvatarFile(null);
			setAvatarPreviewUrl(null);
			setAvatarMarkedForRemoval(false);
			if (fileInputRef.current) fileInputRef.current.value = "";
			toast.success("Profile updated.");
		} catch {
			toast.error("Failed to update profile.");
		} finally {
			setSaving(false);
		}
	}

	if (loading) {
		return (
			<div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-5 md:px-6">
				<div className="mb-6">
					<Skeleton className="h-7 w-32" />
					<Skeleton className="mt-1 h-4 w-56" />
				</div>
				<div className="grid gap-6 md:grid-cols-[280px_1fr]">
					<Card className="flex flex-col items-center gap-4 p-6">
						<Skeleton className="h-20 w-20 rounded-full" />
						<Skeleton className="h-5 w-36" />
						<Skeleton className="h-4 w-48" />
						<Skeleton className="h-5 w-20 rounded-full" />
					</Card>
					<Card className="p-6">
						<Skeleton className="mb-4 h-5 w-40" />
						<Separator className="mb-4" />
						<div className="space-y-4">
							<Skeleton className="h-9 w-full" />
							<Skeleton className="h-9 w-full" />
							<Skeleton className="h-9 w-24" />
						</div>
					</Card>
				</div>
			</div>
		);
	}

	if (!profile) return null;

	const initials = getInitials(profile.full_name, profile.email);
	const displayName = profile.full_name ?? profile.email.split("@")[0];
	const avatarSrc = avatarPreviewUrl ?? (avatarMarkedForRemoval ? null : profile.avatar_url);

	return (
		<div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-5 md:px-6">
			<div className="mb-6">
				<h1 className="text-xl font-semibold text-foreground">Profile</h1>
				<p className="mt-0.5 text-sm text-muted-foreground">
					Manage your personal information
				</p>
			</div>

			<div className="grid gap-6 md:grid-cols-[280px_1fr]">
				{/* Identity card */}
				<Card className="flex flex-col items-center gap-3 p-6 text-center">
					<Avatar className="h-20 w-20 text-xl">
						{avatarSrc && (
							<AvatarImage src={avatarSrc} alt={displayName} />
						)}
						<AvatarFallback className="text-lg">{initials}</AvatarFallback>
					</Avatar>

					<div>
						<p className="text-base font-semibold text-foreground">
							{displayName}
						</p>
						<p className="mt-0.5 flex items-center justify-center gap-1 text-xs text-muted-foreground">
							<Mail className="h-3 w-3" />
							{profile.email}
						</p>
					</div>

					<div className="flex flex-wrap justify-center gap-2">
						<span
							className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${ROLE_VARIANT[profile.role] ?? ROLE_VARIANT.user}`}
						>
							<ShieldCheck className="h-3 w-3" />
							{profile.role}
						</span>
						<span
							className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_VARIANT[profile.status] ?? STATUS_VARIANT.active}`}
						>
							{profile.status}
						</span>
					</div>

					{profile.created_at && (
						<p className="flex items-center gap-1 text-xs text-muted-foreground">
							<CalendarDays className="h-3 w-3" />
							Joined {formatDate(profile.created_at)}
						</p>
					)}
				</Card>

				{/* Edit form */}
				<Card className="p-6">
					<h2 className="text-sm font-semibold text-foreground">
						Personal Information
					</h2>
					<Separator className="my-4" />

					<form onSubmit={handleSave} className="space-y-4">
						<div className="space-y-1.5">
							<label
								htmlFor="full_name"
								className="text-xs font-medium text-muted-foreground"
							>
								Full Name
							</label>
							<Input
								id="full_name"
								placeholder="Your full name"
								value={form.full_name ?? ""}
								onChange={(e) =>
									setForm((f) => ({ ...f, full_name: e.target.value }))
								}
							/>
						</div>

						<div className="space-y-1.5">
							<label
								htmlFor="avatar_upload"
								className="text-xs font-medium text-muted-foreground"
							>
								Avatar
							</label>
							<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
								<label className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg border border-border-strong bg-surface px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted-subtle">
									<Upload className="h-4 w-4" />
									Choose image
									<input
										ref={fileInputRef}
										id="avatar_upload"
										type="file"
										accept="image/jpeg,image/png,image/webp,image/gif"
										className="sr-only"
										onChange={(e) => handleAvatarChange(e.target.files?.[0])}
									/>
								</label>
								{avatarFile && (
									<span className="truncate text-sm text-muted-foreground">
										{avatarFile.name}
									</span>
								)}
								{(avatarFile || (!avatarMarkedForRemoval && profile.avatar_url)) && (
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={handleRemoveAvatar}
									>
										<X className="mr-2 h-3.5 w-3.5" />
										Remove
									</Button>
								)}
							</div>
							<p className="text-xs text-muted-foreground">
								Upload a JPG, PNG, WebP, or GIF image up to 2 MB.
							</p>
						</div>

						<div className="space-y-1.5">
							<label className="text-xs font-medium text-muted-foreground">
								Email
							</label>
							<Input value={profile.email} disabled className="opacity-60" />
							<p className="text-xs text-muted-foreground">
								Email cannot be changed here.
							</p>
						</div>

						<div className="pt-2">
							<Button type="submit" disabled={saving} size="sm">
								{saving ? "Saving..." : "Save Changes"}
							</Button>
						</div>
					</form>
				</Card>
			</div>
		</div>
	);
}
