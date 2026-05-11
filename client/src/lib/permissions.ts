import {
	PERMISSION_GROUPS,
	ROLE_COLUMNS,
	type RoleKey,
} from "@/components/workspace-settings/rolePermissionsData";

// Build flat map at module init: feature label → Set of role keys with access
const PERMISSION_MAP: Record<string, Set<string>> = {};

PERMISSION_GROUPS.forEach((group) => {
	group.rows.forEach((row) => {
		ROLE_COLUMNS.forEach((col) => {
			if (row[col.key as RoleKey].type !== "none") {
				if (!PERMISSION_MAP[row.feature]) {
					PERMISSION_MAP[row.feature] = new Set();
				}
				PERMISSION_MAP[row.feature].add(col.key);
			}
		});
	});
});

export function canAccess(
	roleKey: string | undefined | null,
	feature: string,
): boolean {
	if (!roleKey) return false;
	return PERMISSION_MAP[feature]?.has(roleKey) ?? false;
}
