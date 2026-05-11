import { useState } from "react";
import { Check, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { SectionBlock } from "./SectionBlock";
import {
	PERMISSION_GROUPS,
	ROLE_COLUMNS,
	NONE,
	type AccessLevel,
	type PermRow,
} from "./rolePermissionsData";

function AccessCell({
	level,
	onChange,
}: {
	level: AccessLevel;
	onChange: () => void;
}) {
	if (level.type === "full") {
		return (
			<div className="flex justify-center">
				<button
					type="button"
					onClick={onChange}
					className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-secondary-subtle border border-green-700/40 transition-colors hover:bg-danger-subtle hover:text-danger cursor-pointer"
					title="Click to revoke"
				>
					<Check className="h-3.5 w-3.5 text-secondary" />
				</button>
			</div>
		);
	}

	if (level.type === "none") {
		return (
			<div className="flex justify-center">
				<button
					type="button"
					onClick={onChange}
					className="inline-flex h-6 w-6 items-center justify-center rounded-full transition-colors hover:bg-secondary-subtle cursor-pointer"
					title="Click to grant"
				>
					<Minus className="h-4 w-4 text-border-strong" />
				</button>
			</div>
		);
	}

	return (
		<div className="flex justify-center">
			<button
				type="button"
				onClick={onChange}
				className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-warning-subtle text-warning border border-warning/20 whitespace-nowrap transition-colors hover:bg-danger-subtle hover:text-danger hover:border-danger/20 cursor-pointer"
				title="Click to revoke"
			>
				{level.label}
			</button>
		</div>
	);
}

export function RolePermissionsSection() {
	type MatrixKey = string;
	const [matrix, setMatrix] = useState<Record<MatrixKey, AccessLevel>>(() => {
		const init: Record<MatrixKey, AccessLevel> = {};
		PERMISSION_GROUPS.forEach((group, gi) => {
			group.rows.forEach((row, ri) => {
				ROLE_COLUMNS.forEach((col) => {
					init[`${gi}-${ri}-${col.key}`] = row[col.key as keyof Omit<PermRow, "feature">];
				});
			});
		});
		return init;
	});

	function toggle(gi: number, ri: number, roleKey: string) {
		const key = `${gi}-${ri}-${roleKey}`;
		setMatrix((prev) => {
			const current = prev[key];
			const original = PERMISSION_GROUPS[gi].rows[ri][roleKey as keyof Omit<PermRow, "feature">];
			return { ...prev, [key]: current.type === "none" ? original : NONE };
		});
	}

	return (
		<SectionBlock
			title="Manage Role Permissions"
			description="Define what each role can access and perform across the workspace."
		>
			{/* Legend */}
			<div className="flex items-center gap-3 mb-5 flex-wrap">
				{ROLE_COLUMNS.map((col) => (
					<Badge
						key={col.key}
						variant={col.variant as Parameters<typeof Badge>[0]["variant"]}
						className="font-medium"
					>
						{col.label}
					</Badge>
				))}
				<div className="ml-auto flex items-center gap-4 text-xs text-muted">
					<span className="flex items-center gap-1.5">
						<span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-secondary-subtle border border-green-700/40">
							<Check className="h-3 w-3 text-secondary" />
						</span>
						Full access
					</span>
					<span className="flex items-center gap-1.5">
						<span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-warning-subtle text-warning border border-warning/20">
							Partial
						</span>
						Conditional
					</span>
					<span className="flex items-center gap-1.5">
						<Minus className="h-3.5 w-3.5 text-border-strong" />
						No access
					</span>
				</div>
			</div>

			<div className="overflow-x-auto rounded-lg border border-border">
				<table className="w-full text-sm">
					<thead>
						<tr className="border-b border-border bg-muted-subtle">
							<th className="px-4 py-2.5 text-left text-xs font-medium text-muted w-56 min-w-44">
								Feature
							</th>
							{ROLE_COLUMNS.map((col) => (
								<th
									key={col.key}
									className="px-4 py-2.5 text-center text-xs font-medium text-muted min-w-28"
								>
									<Badge
										variant={col.variant as Parameters<typeof Badge>[0]["variant"]}
										className="font-medium"
									>
										{col.label}
									</Badge>
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{PERMISSION_GROUPS.map((group, gi) => (
							<>
								<tr key={`group-${group.module}`} className="bg-muted-subtle/60 border-b border-border">
									<td
										colSpan={ROLE_COLUMNS.length + 1}
										className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide"
									>
										<span className="flex items-center gap-2">
											<group.icon className="h-3.5 w-3.5 text-primary" />
											{group.module}
										</span>
									</td>
								</tr>
								{group.rows.map((row, ri) => (
									<tr
										key={`${group.module}-${row.feature}`}
										className={cn(
											"border-b border-border last:border-0 transition-colors hover:bg-muted-subtle/60",
											ri % 2 === 1 && "bg-muted-subtle/30",
										)}
									>
										<td className="px-4 py-3 text-sm text-foreground">
											{row.feature}
										</td>
										{ROLE_COLUMNS.map((col) => (
											<td key={col.key} className="px-4 py-3">
												<AccessCell
													level={
														matrix[`${gi}-${ri}-${col.key}`] ??
														row[col.key as keyof Omit<PermRow, "feature">]
													}
													onChange={() => toggle(gi, ri, col.key)}
												/>
											</td>
										))}
									</tr>
								))}
							</>
						))}
					</tbody>
				</table>
			</div>

			<div className="mt-5 flex justify-end">
				<Button size="sm" onClick={() => toast.success("Permissions saved.")}>
					Save Changes
				</Button>
			</div>
		</SectionBlock>
	);
}
