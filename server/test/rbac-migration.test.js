import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const migrationPath = path.resolve("supabase/migrations/006_rbac_permissions.sql");

test("RBAC migration defines default roles, permissions, and helper functions", async () => {
	const sql = await readFile(migrationPath, "utf8");

	for (const tableName of ["public.roles", "public.permissions", "public.role_permissions"]) {
		assert.match(sql, new RegExp(`CREATE TABLE IF NOT EXISTS ${tableName.replace(".", "\\.")}`));
	}

	for (const roleKey of ["admin", "manager", "developer", "user", "owner", "viewer"]) {
		assert.match(sql, new RegExp(`'${roleKey}'`));
	}

	for (const permissionKey of ["users.manage", "roles.manage", "members.manage", "tasks.update"]) {
		assert.match(sql, new RegExp(`'${permissionKey.replace(".", "\\.")}'`));
	}

	assert.match(sql, /CREATE OR REPLACE FUNCTION public\.has_global_permission/);
	assert.match(sql, /CREATE OR REPLACE FUNCTION public\.has_project_permission/);
	assert.match(sql, /ALTER TABLE public\.profiles\s+ADD COLUMN IF NOT EXISTS role_id/);
	assert.match(sql, /ALTER TABLE public\.project_members\s+ADD COLUMN IF NOT EXISTS role_id/);
});
