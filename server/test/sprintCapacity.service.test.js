import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {
	getActiveSprint,
	calculateAssignedHours,
	getCapacitySummary,
} from "../src/services/sprintCapacity.service.js";

// ---------------------------------------------------------------------------
// Migration content tests
// ---------------------------------------------------------------------------

test("020 migration defines user_sprint_capacity table with required structure", async () => {
	const sql = await readFile(
		path.resolve("supabase/migrations/020_user_sprint_capacity.sql"),
		"utf8",
	);
	assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.user_sprint_capacity/);
	assert.match(sql, /uq_user_sprint/);
	assert.match(sql, /UNIQUE \(user_id, sprint_id\)/);
	assert.match(sql, /idx_usc_user_id/);
	assert.match(sql, /idx_usc_sprint_id/);
});

// ---------------------------------------------------------------------------
// Helper to build a fake Supabase client from a simple table map
// ---------------------------------------------------------------------------

function makeClient(tableData = {}) {
	return {
		from(table) {
			const rows = tableData[table] || [];
			const builder = {
				_table: table,
				_filters: [],
				_selectFields: "*",
				_updatePayload: null,
				_upsertPayload: null,
				select(fields) {
					this._selectFields = fields;
					return this;
				},
				eq(col, val) {
					this._filters.push({ col, val, op: "eq" });
					return this;
				},
				neq(col, val) {
					this._filters.push({ col, val, op: "neq" });
					return this;
				},
				update(payload) {
					this._updatePayload = payload;
					return this;
				},
				upsert(_payload, _opts) {
					return Promise.resolve({ data: null, error: null });
				},
				single() {
					return this._resolve(true);
				},
				maybeSingle() {
					return this._resolve(false);
				},
				_resolve(required) {
					let result = rows.filter((row) => {
						for (const f of this._filters) {
							if (f.op === "eq" && row[f.col] !== f.val) return false;
							if (f.op === "neq" && row[f.col] === f.val) return false;
						}
						return true;
					});
					const data = result.length > 0 ? result[0] : null;
					if (required && !data) {
						return Promise.resolve({ data: null, error: { message: "No rows" } });
					}
					return Promise.resolve({ data, error: null });
				},
			};
			return builder;
		},
	};
}

// ---------------------------------------------------------------------------
// getActiveSprint
// ---------------------------------------------------------------------------

test("getActiveSprint returns the active sprint row", async () => {
	const sprint = { id: "sprint-1", name: "Sprint 1", start_date: "2026-05-04", end_date: "2026-05-10", status: "active" };
	const client = makeClient({ sprints: [sprint] });
	const result = await getActiveSprint(client);
	assert.deepEqual(result, sprint);
});

test("getActiveSprint returns null when no active sprint exists", async () => {
	const client = makeClient({ sprints: [{ id: "sprint-1", status: "planned" }] });
	const result = await getActiveSprint(client);
	assert.equal(result, null);
});

// ---------------------------------------------------------------------------
// calculateAssignedHours
// ---------------------------------------------------------------------------

test("calculateAssignedHours sums estimated_time for non-cancelled tasks", async () => {
	const tasks = [
		{ id: "t1", assigned_to: "user-1", sprint_id: "sprint-1", estimated_time: 5, status: "in_progress" },
		{ id: "t2", assigned_to: "user-1", sprint_id: "sprint-1", estimated_time: 7, status: "todo" },
		{ id: "t3", assigned_to: "user-1", sprint_id: "sprint-1", estimated_time: 3, status: "cancelled" },
		{ id: "t4", assigned_to: "user-2", sprint_id: "sprint-1", estimated_time: 10, status: "todo" },
	];

	// Build a client that returns filtered tasks properly
	const client = {
		from(table) {
			if (table !== "tasks") return makeClient().from(table);
			return {
				select() { return this; },
				eq(col, val) {
					this._eqFilters = this._eqFilters || {};
					this._eqFilters[col] = val;
					return this;
				},
				neq(col, val) {
					this._neqFilters = this._neqFilters || {};
					this._neqFilters[col] = val;
					return this;
				},
				then(resolve) {
					const filtered = tasks.filter((t) => {
						for (const [col, val] of Object.entries(this._eqFilters || {})) {
							if (t[col] !== val) return false;
						}
						for (const [col, val] of Object.entries(this._neqFilters || {})) {
							if (t[col] === val) return false;
						}
						return true;
					});
					return Promise.resolve({ data: filtered, error: null }).then(resolve);
				},
			};
		},
	};

	const hours = await calculateAssignedHours(client, "user-1", "sprint-1");
	assert.equal(hours, 12); // 5 + 7 only (t3 cancelled, t4 different user)
});

test("calculateAssignedHours returns 0 when no matching tasks", async () => {
	const client = {
		from() {
			return {
				select() { return this; },
				eq() { return this; },
				neq() { return this; },
				then(resolve) {
					return Promise.resolve({ data: [], error: null }).then(resolve);
				},
			};
		},
	};
	const hours = await calculateAssignedHours(client, "user-x", "sprint-x");
	assert.equal(hours, 0);
});

// ---------------------------------------------------------------------------
// getCapacitySummary
// ---------------------------------------------------------------------------

test("getCapacitySummary returns null when no active sprint", async () => {
	const client = makeClient({ sprints: [] });
	const result = await getCapacitySummary(client, "user-1");
	assert.equal(result, null);
});

test("getCapacitySummary computes remainingHours and isOverbooked correctly", async () => {
	const sprint = { id: "sprint-1", name: "Sprint 1", start_date: "2026-05-04", end_date: "2026-05-10", status: "active" };
	const capacityRecord = {
		id: "cap-1", user_id: "user-1", sprint_id: "sprint-1", capacity_hours: 40, assigned_hours: 0,
	};

	// Client with sprints and capacity table; tasks return 50h assigned
	const client = {
		from(table) {
			if (table === "sprints") {
				return makeClient({ sprints: [sprint] }).from("sprints");
			}
			if (table === "user_sprint_capacity") {
				return {
					select() { return this; },
					eq() { return this; },
					upsert() { return Promise.resolve({ data: null, error: null }); },
					update(p) { this._p = p; return this; },
					single() { return Promise.resolve({ data: capacityRecord, error: null }); },
					maybeSingle() { return Promise.resolve({ data: capacityRecord, error: null }); },
				};
			}
			if (table === "tasks") {
				return {
					select() { return this; },
					eq() { return this; },
					neq() { return this; },
					then(resolve) {
						return Promise.resolve({
							data: [
								{ estimated_time: 30, status: "todo" },
								{ estimated_time: 20, status: "in_progress" },
							],
							error: null,
						}).then(resolve);
					},
				};
			}
			return makeClient().from(table);
		},
	};

	const summary = await getCapacitySummary(client, "user-1");
	assert.equal(summary.capacityHours, 40);
	assert.equal(summary.assignedHours, 50);
	assert.equal(summary.remainingHours, -10);
	assert.equal(summary.isOverbooked, true);
});
