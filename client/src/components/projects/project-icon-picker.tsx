import { ImageIcon, Upload, X } from "lucide-react";
import { dynamicIconImports, type IconName } from "lucide-react/dynamic.js";
import { Button } from "@/components/ui/button";
import { Icon, IconPicker } from "@/components/ui/icon-picker";
import { cn } from "@/lib/utils";
import {
	DEFAULT_PROJECT_ICON,
	type ProjectIconType,
} from "./project-icon-options";

function toIconName(value: string | null | undefined): IconName {
	if (value && value in dynamicIconImports) return value as IconName;
	return DEFAULT_PROJECT_ICON as IconName;
}

export function ProjectIcon({
	type,
	value,
	className,
	iconClassName,
}: {
	type?: ProjectIconType | null;
	value?: string | null;
	className?: string;
	iconClassName?: string;
}) {
	if (type === "image" && value) {
		return (
			<div
				className={cn(
					"h-8 w-8 overflow-hidden rounded-lg bg-muted-subtle",
					className,
				)}
			>
				<img
					src={value}
					alt=""
					className="h-full w-full object-cover"
				/>
			</div>
		);
	}

	return (
		<div
			className={cn(
				"h-8 w-8 rounded-lg bg-primary-subtle flex items-center justify-center",
				className,
			)}
		>
			<Icon
				name={toIconName(value)}
				className={cn("h-4 w-4 text-primary", iconClassName)}
			/>
		</div>
	);
}

export function ProjectIconPicker({
	iconType,
	iconValue,
	onChange,
	error,
}: {
	iconType: ProjectIconType;
	iconValue: string;
	onChange: (next: { iconType: ProjectIconType; iconValue: string }) => void;
	error?: string;
}) {
	function handleFileChange(file: File | undefined) {
		if (!file) return;
		if (!file.type.startsWith("image/")) {
			onChange({ iconType: "icon", iconValue });
			return;
		}

		const reader = new FileReader();
		reader.onload = () => {
			if (typeof reader.result === "string") {
				onChange({ iconType: "image", iconValue: reader.result });
			}
		};
		reader.readAsDataURL(file);
	}

	return (
		<div>
			<label className="text-sm font-medium text-muted-foreground mb-2 block">
				Project Icon
			</label>
			<div className="flex items-center gap-2">
				<IconPicker
					value={toIconName(
						iconType === "icon" ? iconValue : DEFAULT_PROJECT_ICON,
					)}
					onValueChange={(value) =>
						onChange({ iconType: "icon", iconValue: value })
					}
					modal
					searchPlaceholder="Search Lucide icons..."
				>
					<div className="w-1/2 flex items-center gap-2 border border-border py-2 rounded-2xl cursor-pointer hover:bg-primary-subtle">
						<Icon
							name={toIconName(
								iconType === "icon"
									? iconValue
									: DEFAULT_PROJECT_ICON,
							)}
							className="h-4 w-5 ml-2"
						/>
						<span className="truncate text-primary h-full w-full text-xs">
							{iconType === "icon" ? iconValue : "Select icon"}
						</span>
					</div>
				</IconPicker>
				<span className="text-slate-400 min-w-15">- OR -</span>
				<label
					className={cn(
						"flex h-10 w-1/2 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 text-sm transition-colors",
						iconType === "image"
							? "border-primary bg-primary-subtle text-primary"
							: "border-border bg-surface text-muted-foreground hover:border-border-strong hover:text-foreground",
					)}
				>
					{iconType === "image" ? (
						<ImageIcon className="h-4 w-4" />
					) : (
						<Upload className="h-4 w-4" />
					)}
					Upload image
					<input
						type="file"
						accept="image/*"
						className="sr-only"
						onChange={(event) =>
							handleFileChange(event.target.files?.[0])
						}
					/>
				</label>
			</div>
			{iconType === "image" && iconValue && (
				<div className="mt-3 flex items-center gap-3">
					<ProjectIcon
						type="image"
						value={iconValue}
						className="h-12 w-12"
					/>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() =>
							onChange({
								iconType: "icon",
								iconValue: DEFAULT_PROJECT_ICON,
							})
						}
					>
						<X className="mr-2 h-3.5 w-3.5" />
						Remove image
					</Button>
				</div>
			)}
			{error && <p className="text-xs text-danger mt-1">{error}</p>}
		</div>
	);
}
