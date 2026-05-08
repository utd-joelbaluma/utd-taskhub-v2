import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import {
	differenceInCalendarDays,
	format,
	parseISO,
} from "date-fns";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatDate(paramsDate?: string | null): string {
	if (!paramsDate) return "No due date";

	const date = parseISO(paramsDate);
	const today = new Date();

	const diffDays = differenceInCalendarDays(date, today);

	if (diffDays === 0) return "Today";
	if (diffDays === 1) return "Tomorrow";
	if (diffDays === -1) return "Yesterday";

	if (diffDays > 1 && diffDays <= 14) {
		return `In ${diffDays} days`;
	}

	if (diffDays < -1 && diffDays >= -14) {
		return `${Math.abs(diffDays)} days ago`;
	}

	return format(date, "MMM d, yyyy");
}
