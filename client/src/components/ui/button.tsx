import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 cursor-pointer",
	{
		variants: {
			variant: {
				default:
					"bg-primary text-primary-foreground hover:bg-primary-hover",
				secondary:
					"bg-secondary text-secondary-foreground hover:bg-secondary-hover",
				accent: "bg-accent text-accent-foreground hover:bg-accent-hover",
				outline:
					"border border-border-strong bg-surface text-foreground hover:bg-muted-subtle",
				primary_outline:
					"border border-primary bg-surface text-primary hover:bg-primary-subtle",
				ghost: "text-primary hover:bg-primary-subtle",
				muted: "bg-muted-subtle text-muted-foreground hover:bg-border",
				destructive:
					"bg-danger text-danger-foreground hover:bg-danger-hover",
				warning:
					"bg-warning text-warning-foreground hover:bg-warning-hover",
			},
			size: {
				xs: "h-5 px-2 text-xs",
				default: "h-9 px-4 py-2",
				sm: "h-7 px-3 text-xs",
				lg: "h-11 px-6",
				icon: "h-9 w-9",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

export interface ButtonProps
	extends
		React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {
	asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant, size, asChild = false, ...props }, ref) => {
		const Comp = asChild ? Slot : "button";
		return (
			<Comp
				className={cn(buttonVariants({ variant, size, className }))}
				ref={ref}
				{...props}
			/>
		);
	},
);
Button.displayName = "Button";

export { Button, buttonVariants };
