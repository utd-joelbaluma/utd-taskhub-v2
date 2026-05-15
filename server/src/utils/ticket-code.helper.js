// Generate next sequential ticket_code for a project: {KEY}-{NNN}
// Scans existing codes matching `${KEY}-<digits>` and picks max+1, zero-padded.
export async function generateTicketCode(supabase, projectId) {
	const { data: project, error: projectError } = await supabase
		.from("projects")
		.select("key")
		.eq("id", projectId)
		.maybeSingle();

	if (projectError) throw projectError;
	if (!project?.key) {
		throw new Error("Project key is missing; cannot generate ticket code.");
	}

	const prefix = project.key;

	const { data: rows, error: rowsError } = await supabase
		.from("tickets")
		.select("ticket_code")
		.eq("project_id", projectId)
		.like("ticket_code", `${prefix}-%`);

	if (rowsError) throw rowsError;

	let max = 0;
	for (const row of rows ?? []) {
		const tail = row.ticket_code?.slice(prefix.length + 1);
		if (tail && /^\d+$/.test(tail)) {
			const n = parseInt(tail, 10);
			if (n > max) max = n;
		}
	}

	const next = max + 1;
	const padded = String(next).padStart(3, "0");
	return `${prefix}-${padded}`;
}

// Slugify project name into a candidate key. Caller picks unique suffix.
export function slugifyProjectKey(name) {
	const base = (name || "")
		.toUpperCase()
		.replace(/[^A-Z0-9]/g, "")
		.slice(0, 4);
	return base.length >= 2 ? base : "PRJ";
}

export async function generateUniqueProjectKey(supabase, name) {
	const base = slugifyProjectKey(name);
	let candidate = base;
	let suffix = 1;

	while (true) {
		const { data, error } = await supabase
			.from("projects")
			.select("id")
			.eq("key", candidate)
			.maybeSingle();
		if (error) throw error;
		if (!data) return candidate;
		const trimmed = base.slice(0, 3);
		candidate = `${trimmed}${suffix}`;
		suffix += 1;
		if (suffix > 9999) throw new Error("Could not allocate unique project key.");
	}
}
