import * as React from "react";
import type { SVGProps } from "react";
import { useCallback, useMemo, useRef, useState } from "react";
import { Check, Search } from "lucide-react";
import {
	DynamicIcon,
	dynamicIconImports,
	type IconName as LucideIconName,
} from "lucide-react/dynamic.js";
import { useVirtualizer } from "@tanstack/react-virtual";
import Fuse from "fuse.js";
import { useDebounceValue } from "usehooks-ts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type IconItem = {
	name: IconName;
	search: string;
};

type IconName = string;

const ICON_ITEMS = Object.keys(dynamicIconImports)
	.sort((a, b) => a.localeCompare(b))
	.map((name) => ({
		name: name as IconName,
		search: name.replace(/-/g, " "),
	}));

type IconPickerProps = Omit<
	React.ComponentPropsWithoutRef<typeof PopoverTrigger>,
	"onSelect" | "onOpenChange"
> & {
	value?: IconName;
	defaultValue?: IconName;
	onValueChange?: (value: IconName) => void;
	open?: boolean;
	defaultOpen?: boolean;
	onOpenChange?: (open: boolean) => void;
	searchable?: boolean;
	searchPlaceholder?: string;
	triggerPlaceholder?: string;
	iconsList?: IconItem[];
	modal?: boolean;
};

function IconPickerSkeleton() {
	return (
		<div className="grid grid-cols-5 gap-2">
			{Array.from({ length: 25 }).map((_, index) => (
				<Skeleton key={index} className="h-10 w-10" />
			))}
		</div>
	);
}

const IconPreview = React.memo(function IconPreview({
	name,
	className,
}: {
	name: IconName;
	className?: string;
}) {
	return <DynamicIcon name={name as LucideIconName} className={cn("h-4 w-4", className)} />;
});

const IconPicker = React.forwardRef<
	React.ComponentRef<typeof PopoverTrigger>,
	IconPickerProps
>(
	(
		{
			value,
			defaultValue,
			onValueChange,
			open,
			defaultOpen = false,
			onOpenChange,
			children,
			searchable = true,
			searchPlaceholder = "Search for an icon...",
			triggerPlaceholder = "Select an icon",
			iconsList,
			modal = false,
			...props
		},
		ref,
	) => {
		const [selectedIcon, setSelectedIcon] = useState<IconName | undefined>(defaultValue);
		const [internalOpen, setInternalOpen] = useState(defaultOpen);
		const [search, setSearch] = useDebounceValue("", 100);
		const [isReady, setIsReady] = useState(false);
		const parentRef = useRef<HTMLDivElement>(null);
		const currentValue = value ?? selectedIcon;
		const iconsToUse = iconsList ?? ICON_ITEMS;

		const fuse = useMemo(
			() =>
				new Fuse(iconsToUse, {
					keys: ["name", "search"],
					threshold: 0.3,
					ignoreLocation: true,
				}),
			[iconsToUse],
		);

		const filteredIcons = useMemo(() => {
			const query = search.trim();
			if (!query) return iconsToUse;
			return fuse.search(query).map((result) => result.item);
		}, [fuse, iconsToUse, search]);

		// TanStack Virtual returns imperative helpers by design; this picker keeps them local.
		// eslint-disable-next-line react-hooks/incompatible-library
		const rowVirtualizer = useVirtualizer({
			count: Math.ceil(filteredIcons.length / 5),
			getScrollElement: () => parentRef.current,
			estimateSize: () => 48,
			overscan: 5,
		});

		const handleOpenChange = useCallback(
			(nextOpen: boolean) => {
				setSearch("");
				if (open === undefined) setInternalOpen(nextOpen);
				onOpenChange?.(nextOpen);
				if (nextOpen) {
					setIsReady(false);
					window.setTimeout(() => {
						setIsReady(true);
						rowVirtualizer.measure();
					}, 1);
				}
			},
			[onOpenChange, open, rowVirtualizer, setSearch],
		);

		const handleValueChange = useCallback(
			(icon: IconName) => {
				if (value === undefined) setSelectedIcon(icon);
				onValueChange?.(icon);
				handleOpenChange(false);
			},
			[handleOpenChange, onValueChange, value],
		);

		const handleSearchChange = useCallback(
			(event: React.ChangeEvent<HTMLInputElement>) => {
				setSearch(event.target.value);
				if (parentRef.current) parentRef.current.scrollTop = 0;
				rowVirtualizer.scrollToOffset(0);
			},
			[rowVirtualizer, setSearch],
		);

		return (
			<Popover open={open ?? internalOpen} onOpenChange={handleOpenChange} modal={modal}>
				<PopoverTrigger ref={ref} asChild {...props}>
					{children ?? (
						<Button type="button" variant="outline" className="justify-start gap-2">
							{currentValue ? (
								<>
									<IconPreview name={currentValue} />
									<span className="truncate">{currentValue}</span>
								</>
							) : (
								triggerPlaceholder
							)}
						</Button>
					)}
				</PopoverTrigger>
				<PopoverContent className="w-72 p-2" align="start">
					{searchable && (
						<div className="relative mb-2">
							<Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
							<Input
								placeholder={searchPlaceholder}
								onChange={handleSearchChange}
								className="h-9 pl-8"
							/>
						</div>
					)}

					<div ref={parentRef} className="h-60 overflow-auto pr-1" style={{ scrollbarWidth: "thin" }}>
						{!isReady ? (
							<IconPickerSkeleton />
						) : filteredIcons.length === 0 ? (
							<div className="py-10 text-center text-sm text-muted">No icon found</div>
						) : (
							<div
								className="relative w-full"
								style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
							>
								{rowVirtualizer.getVirtualItems().map((virtualRow) => {
									const start = virtualRow.index * 5;
									const rowIcons = filteredIcons.slice(start, start + 5);

									return (
										<div
											key={virtualRow.key}
											className="absolute left-0 top-0 grid w-full grid-cols-5 gap-2"
											style={{ transform: `translateY(${virtualRow.start}px)` }}
										>
											{rowIcons.map((icon) => {
												const selected = currentValue === icon.name;
												return (
													<TooltipProvider key={icon.name}>
														<Tooltip>
															<TooltipTrigger asChild>
																<button
																	type="button"
																	aria-label={icon.name}
																	onClick={() => handleValueChange(icon.name)}
																	className={cn(
																		"relative flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground transition-colors hover:border-border-strong hover:bg-muted-subtle hover:text-foreground",
																		selected && "border-primary bg-primary-subtle text-primary",
																	)}
																>
																	<IconPreview name={icon.name} />
																	{selected && (
																		<Check className="absolute right-0.5 top-0.5 h-3 w-3 text-primary" />
																	)}
																</button>
															</TooltipTrigger>
															<TooltipContent>
																<p>{icon.name}</p>
															</TooltipContent>
														</Tooltip>
													</TooltipProvider>
												);
											})}
										</div>
									);
								})}
							</div>
						)}
					</div>
				</PopoverContent>
			</Popover>
		);
	},
);
IconPicker.displayName = "IconPicker";

type IconProps = Omit<SVGProps<SVGSVGElement>, "name" | "ref"> & {
	name: IconName;
	size?: string | number;
	absoluteStrokeWidth?: boolean;
};

const Icon = React.forwardRef<SVGSVGElement, IconProps>(({ name, ...props }, ref) => (
	<DynamicIcon name={name as LucideIconName} ref={ref} {...props} />
));
Icon.displayName = "Icon";

export { IconPicker, Icon, type IconName };
