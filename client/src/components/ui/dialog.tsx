import * as React from "react";
import {
	Description as HeadlessDescription,
	Dialog as HeadlessDialog,
	DialogBackdrop,
	DialogPanel,
	DialogTitle as HeadlessDialogTitle,
} from "@headlessui/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type DialogContextValue = {
	open: boolean;
	setOpen: (open: boolean) => void;
};

type SlottableProps<T extends HTMLElement> =
	React.HTMLAttributes<T> & {
		asChild?: boolean;
		children?: React.ReactNode;
	};

const DialogContext = React.createContext<DialogContextValue | null>(null);

function useDialogContext(componentName: string) {
	const context = React.useContext(DialogContext);
	if (!context) {
		throw new Error(`${componentName} must be used within Dialog.`);
	}
	return context;
}

function mergeRefs<T>(
	...refs: Array<React.Ref<T> | undefined>
): React.RefCallback<T> {
	return (node) => {
		for (const ref of refs) {
			if (typeof ref === "function") ref(node);
			else if (ref) ref.current = node;
		}
	};
}

function SlotElement<T extends HTMLElement>({
	asChild,
	children,
	ref,
	...props
}: SlottableProps<T> & { ref?: React.Ref<T> }) {
	if (!asChild) return null;
	if (!React.isValidElement(children)) return null;

	const child = children as React.ReactElement<
		React.HTMLAttributes<T> & { ref?: React.Ref<T> }
	>;
	const childProps = child.props;

	return React.cloneElement(child, {
		...props,
		...childProps,
		ref: mergeRefs(ref, childProps.ref),
		className: cn(props.className, childProps.className),
		onClick: (event: React.MouseEvent<T>) => {
			props.onClick?.(event);
			childProps.onClick?.(event);
		},
	});
}

function Dialog({
	open: openProp,
	defaultOpen = false,
	onOpenChange,
	children,
}: {
	open?: boolean;
	defaultOpen?: boolean;
	onOpenChange?: (open: boolean) => void;
	children: React.ReactNode;
}) {
	const [uncontrolledOpen, setUncontrolledOpen] =
		React.useState(defaultOpen);
	const isControlled = openProp !== undefined;
	const open = isControlled ? openProp : uncontrolledOpen;

	const setOpen = React.useCallback(
		(nextOpen: boolean) => {
			if (!isControlled) setUncontrolledOpen(nextOpen);
			onOpenChange?.(nextOpen);
		},
		[isControlled, onOpenChange],
	);

	const value = React.useMemo(
		() => ({ open, setOpen }),
		[open, setOpen],
	);

	return (
		<DialogContext.Provider value={value}>{children}</DialogContext.Provider>
	);
}
Dialog.displayName = "Dialog";

const DialogTrigger = React.forwardRef<
	HTMLButtonElement,
	SlottableProps<HTMLButtonElement>
>(({ asChild, children, onClick, ...props }, ref) => {
	const { setOpen } = useDialogContext("DialogTrigger");

	const triggerProps = {
		...props,
		onClick: (event: React.MouseEvent<HTMLButtonElement>) => {
			onClick?.(event);
			if (!event.defaultPrevented) setOpen(true);
		},
	};

	if (asChild) {
		return (
			<SlotElement {...triggerProps} asChild ref={ref}>
				{children}
			</SlotElement>
		);
	}

	return (
		<button type="button" ref={ref} {...triggerProps}>
			{children}
		</button>
	);
});
DialogTrigger.displayName = "DialogTrigger";

const DialogClose = React.forwardRef<
	HTMLButtonElement,
	SlottableProps<HTMLButtonElement>
>(({ asChild, children, onClick, ...props }, ref) => {
	const { setOpen } = useDialogContext("DialogClose");

	const closeProps = {
		...props,
		onClick: (event: React.MouseEvent<HTMLButtonElement>) => {
			onClick?.(event);
			if (!event.defaultPrevented) setOpen(false);
		},
	};

	if (asChild) {
		return (
			<SlotElement {...closeProps} asChild ref={ref}>
				{children}
			</SlotElement>
		);
	}

	return (
		<button type="button" ref={ref} {...closeProps}>
			{children}
		</button>
	);
});
DialogClose.displayName = "DialogClose";

const DialogPortal = ({
	className,
	children,
}: {
	className?: string;
	children?: React.ReactNode;
}) => <div className={cn("relative z-50", className)}>{children}</div>;
DialogPortal.displayName = "DialogPortal";

const DialogOverlay = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<DialogBackdrop
		ref={ref}
		className={cn(
			"fixed inset-0 z-50 bg-black/80 backdrop-blur-sm",
			className,
		)}
		{...props}
	/>
));
DialogOverlay.displayName = "DialogOverlay";

const DialogContent = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
	const { open, setOpen } = useDialogContext("DialogContent");

	return (
		<HeadlessDialog
			open={open}
			onClose={setOpen}
			className="relative z-50"
		>
			<DialogOverlay />
			<div className="fixed inset-0 z-50 w-screen overflow-y-auto p-4">
				<div className="flex min-h-full items-center justify-center">
					<DialogPanel
						ref={ref}
						className={cn(
							"relative w-full max-w-lg rounded-xl border border-border bg-surface p-6 shadow-[0px_8px_24px_rgba(0,0,0,0.08)] focus:outline-none",
							className,
						)}
						{...props}
					>
						{children}
						<DialogClose className="absolute right-4 top-4 rounded-md p-1 text-muted opacity-70 transition-opacity hover:opacity-100 hover:bg-muted-subtle focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:pointer-events-none">
							<X className="h-4 w-4" />
							<span className="sr-only">Close</span>
						</DialogClose>
					</DialogPanel>
				</div>
			</div>
		</HeadlessDialog>
	);
});
DialogContent.displayName = "DialogContent";

const DialogHeader = ({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) => (
	<div
		className={cn("mb-4 flex flex-col space-y-0 pb-2", className)}
		{...props}
	/>
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) => (
	<div className={cn("mt-6 flex justify-end gap-3", className)} {...props} />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
	HTMLHeadingElement,
	React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
	<HeadlessDialogTitle
		ref={ref}
		className={cn("text-base font-bold text-primary", className)}
		{...props}
	/>
));
DialogTitle.displayName = "DialogTitle";

const DialogDescription = React.forwardRef<
	HTMLParagraphElement,
	React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
	<HeadlessDescription
		ref={ref}
		className={cn("text-xs text-muted", className)}
		{...props}
	/>
));
DialogDescription.displayName = "DialogDescription";

export {
	Dialog,
	DialogPortal,
	DialogOverlay,
	DialogTrigger,
	DialogClose,
	DialogContent,
	DialogHeader,
	DialogFooter,
	DialogTitle,
	DialogDescription,
};
