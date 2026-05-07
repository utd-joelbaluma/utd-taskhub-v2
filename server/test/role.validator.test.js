import assert from "node:assert/strict";
import test from "node:test";
import {
	validateCreateRole,
	validateSetRolePermissions,
	validateUpdateRole,
} from "../src/utils/role.validator.js";

test("validateCreateRole accepts a custom project role with permission keys", () => {
	const errors = validateCreateRole({
		scope: "project",
		key: "qa_lead",
		name: "QA Lead",
		permission_keys: ["tasks.read", "tasks.update"],
	});

	assert.deepEqual(errors, []);
});

test("validateCreateRole rejects invalid role shape", () => {
	const errors = validateCreateRole({
		scope: "workspace",
		key: "QA Lead",
		name: "Q",
		permission_keys: ["Tasks Read"],
	});

	assert.equal(errors.length, 4);
});

test("validateUpdateRole blocks immutable fields", () => {
	const errors = validateUpdateRole({
		scope: "global",
		key: "admin",
		is_system: false,
	});

	assert.deepEqual(errors, ["scope, key, and is_system cannot be updated."]);
});

test("validateSetRolePermissions requires permission_keys", () => {
	const errors = validateSetRolePermissions({});

	assert.deepEqual(errors, ["permission_keys is required."]);
});
