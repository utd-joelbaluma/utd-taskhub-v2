import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function SectionBlock({
	title,
	description,
	children,
}: {
	title: string;
	description?: string;
	children: React.ReactNode;
}) {
	return (
		<Card className="p-6">
			<div className="mb-5">
				<h2 className="text-base font-semibold text-foreground">{title}</h2>
				{description && (
					<p className="text-xs text-muted mt-0.5">{description}</p>
				)}
			</div>
			{children}
		</Card>
	);
}

export function Toggle({
	checked,
	onChange,
}: {
	checked: boolean;
	onChange: () => void;
}) {
	return (
		<button
			role="switch"
			aria-checked={checked}
			onClick={onChange}
			className={cn(
				"relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
				checked ? "bg-primary" : "bg-border-strong",
			)}
		>
			<span
				className={cn(
					"pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform",
					checked ? "translate-x-6" : "translate-x-1",
				)}
			/>
		</button>
	);
}
