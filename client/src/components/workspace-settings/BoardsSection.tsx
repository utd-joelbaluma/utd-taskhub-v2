import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { SectionBlock } from "./SectionBlock";

const DEFAULT_STATUSES = ["Backlog", "In Progress", "Done"];

export function BoardsSection() {
	const [viewMode, setViewMode] = useState<"board" | "list">("board");
	const [statuses, setStatuses] = useState(DEFAULT_STATUSES);
	const [newStatus, setNewStatus] = useState("");
	const [addingStatus, setAddingStatus] = useState(false);

	function removeStatus(label: string) {
		setStatuses((prev) => prev.filter((s) => s !== label));
	}

	function addStatus() {
		const trimmed = newStatus.trim();
		if (trimmed && !statuses.includes(trimmed)) {
			setStatuses((prev) => [...prev, trimmed]);
		}
		setNewStatus("");
		setAddingStatus(false);
	}

	return (
		<SectionBlock
			title="Boards & Workflow"
			description="Configure how your tasks are visualized and tracked."
		>
			<div className="space-y-5">
				<div className="flex items-center justify-between">
					<div>
						<p className="text-sm font-medium text-foreground">Default View Mode</p>
						<p className="text-xs text-muted mt-0.5">
							Choose between Kanban board or List layout.
						</p>
					</div>
					<div className="flex items-center rounded-lg border border-border overflow-hidden">
						<button
							onClick={() => setViewMode("board")}
							className={cn(
								"px-4 py-1.5 text-sm transition-colors",
								viewMode === "board"
									? "bg-primary text-primary-foreground font-medium"
									: "text-muted-foreground hover:bg-muted-subtle",
							)}
						>
							Board
						</button>
						<button
							onClick={() => setViewMode("list")}
							className={cn(
								"px-4 py-1.5 text-sm transition-colors",
								viewMode === "list"
									? "bg-primary text-primary-foreground font-medium"
									: "text-muted-foreground hover:bg-muted-subtle",
							)}
						>
							List
						</button>
					</div>
				</div>

				<Separator />

				<div>
					<p className="text-sm font-medium text-foreground mb-3">
						Custom Status Labels
					</p>
					<div className="flex flex-wrap gap-2">
						{statuses.map((label) => (
							<span
								key={label}
								className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm border border-border bg-surface text-foreground"
							>
								<span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
								{label}
								<button
									onClick={() => removeStatus(label)}
									className="text-muted hover:text-foreground transition-colors ml-0.5"
								>
									<X className="h-3 w-3" />
								</button>
							</span>
						))}

						{addingStatus ? (
							<div className="flex items-center gap-1.5">
								<Input
									autoFocus
									value={newStatus}
									onChange={(e) => setNewStatus(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === "Enter") addStatus();
										if (e.key === "Escape") {
											setAddingStatus(false);
											setNewStatus("");
										}
									}}
									placeholder="Status name"
									className="h-8 w-32 text-sm"
								/>
								<Button size="sm" onClick={addStatus}>Add</Button>
								<Button
									size="sm"
									variant="outline"
									onClick={() => { setAddingStatus(false); setNewStatus(""); }}
								>
									Cancel
								</Button>
							</div>
						) : (
							<button
								onClick={() => setAddingStatus(true)}
								className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm border border-dashed border-border-strong text-muted-foreground hover:border-primary hover:text-primary transition-colors"
							>
								<Plus className="h-3 w-3" />
								Add Status
							</button>
						)}
					</div>
				</div>
			</div>
		</SectionBlock>
	);
}
