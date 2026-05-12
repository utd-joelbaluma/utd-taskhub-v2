import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = {
	id: string;
	value: string;
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	autoComplete: "new-password" | "current-password";
	placeholder?: string;
	hasError?: boolean;
};

export function PasswordInput({
	id,
	value,
	onChange,
	autoComplete,
	placeholder = "••••••••",
	hasError = false,
}: Props) {
	const [show, setShow] = useState(false);
	return (
		<div className="relative">
			<Input
				id={id}
				type={show ? "text" : "password"}
				placeholder={placeholder}
				value={value}
				onChange={onChange}
				autoComplete={autoComplete}
				className={cn(
					"pr-10",
					hasError && "border-danger focus-visible:ring-danger",
				)}
			/>
			<button
				type="button"
				onClick={() => setShow((v) => !v)}
				className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-muted-foreground transition-colors focus:outline-none"
				aria-label={show ? "Hide password" : "Show password"}
			>
				{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
			</button>
		</div>
	);
}
