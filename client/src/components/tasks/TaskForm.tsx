import { formatTime, TIME_INCREMENTS } from "./types";

export function EstimatedTimeField({
	value,
	onChange,
}: {
	value: number;
	onChange: (minutes: number) => void;
}) {
	return (
		<div className="flex flex-col items-center justify-center">
			<label className="text-sm font-medium text-muted-foreground block w-full text-left mb-1.5">
				Estimated time (optional)
			</label>
			<div className="bg-white border border-border rounded-xl px-4 py-1.5 mb-3 w-full text-center">
				<b className="text-primary text-lg">{formatTime(value)}</b>
			</div>
			<div className="flex items-center gap-2">
				{TIME_INCREMENTS.map(({ label, delta }) => (
					<span
						key={label}
						className="text-xs text-secondary cursor-pointer shadow-xs border border-secondary/50 px-1.5 py-1 rounded-md hover:bg-primary hover:text-white transition-all duration-200"
						onClick={() => onChange(value + delta)}
					>
						{label}
					</span>
				))}
				<span
					className="text-xs text-accent cursor-pointer shadow-xs border border-reset px-1.5 py-1 rounded-md hover:bg-primary hover:text-white transition-all duration-200"
					onClick={() => onChange(0)}
				>
					Reset
				</span>
			</div>
		</div>
	);
}
