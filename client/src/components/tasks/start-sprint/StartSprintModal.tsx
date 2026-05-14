import { useState } from "react";
import { format } from "date-fns";
import { Loader2, Calendar } from "lucide-react";
import { toast } from "sonner";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { updateSprint, type Sprint } from "@/services/sprint.service";

interface Props {
	open: boolean;
	onClose: () => void;
	sprint: Sprint;
	onStarted: (updated: Sprint) => void;
}

function formatSprintRange(start: string, end: string): string {
	const s = new Date(start + "T00:00:00");
	const e = new Date(end + "T00:00:00");
	if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
		return `${format(s, "MMM d")} – ${format(e, "d, yyyy")}`;
	}
	return `${format(s, "MMM d")} – ${format(e, "MMM d, yyyy")}`;
}

export function StartSprintModal({ open, onClose, sprint, onStarted }: Props) {
	const [submitting, setSubmitting] = useState(false);

	async function handleConfirm() {
		setSubmitting(true);
		try {
			const updated = await updateSprint(sprint.id, { status: "active" });
			toast.success("Sprint started", { description: sprint.name });
			onStarted(updated);
			onClose();
		} catch (e) {
			toast.error("Failed to start sprint", {
				description: (e as Error).message || "Please try again.",
			});
			setSubmitting(false);
		}
	}

	function handleOpenChange(next: boolean) {
		if (submitting) return;
		if (!next) onClose();
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>Start Sprint</DialogTitle>
					<p className="text-xs text-muted mt-0.5">
						Today, {format(new Date(), "MMM d, yyyy")}
					</p>
					<DialogDescription>
						Review sprint details before activating.
					</DialogDescription>
				</DialogHeader>

				<div className="rounded-lg border border-border bg-muted-subtle/40 px-4 py-4 space-y-3">
					<div>
						<p className="text-xs text-muted uppercase tracking-wide mb-1">
							Sprint
						</p>
						<p className="text-sm font-semibold text-foreground">
							{sprint.name}
						</p>
					</div>
					<div>
						<p className="text-xs text-muted uppercase tracking-wide mb-1">
							Dates
						</p>
						<div className="flex items-center gap-2 text-sm text-foreground">
							<Calendar className="h-4 w-4 text-muted" />
							{formatSprintRange(sprint.start_date, sprint.end_date)}
						</div>
					</div>
					<div>
						<p className="text-xs text-muted uppercase tracking-wide mb-1">
							Status
						</p>
						<Badge variant="todo">Planned</Badge>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={onClose} disabled={submitting}>
						Cancel
					</Button>
					<Button onClick={handleConfirm} disabled={submitting}>
						{submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
						Start Sprint
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
