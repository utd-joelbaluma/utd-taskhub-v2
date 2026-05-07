import assert from "node:assert/strict";
import test from "node:test";
import {
	requirePermission,
	requireProjectPermission,
	userHasGlobalPermission,
} from "../src/middlewares/permission.middleware.js";

function makeReq(rpcResult, profile = {}) {
	return {
		profile: {
			id: "user-1",
			role: "user",
			status: "active",
			...profile,
		},
		params: {
			projectId: "project-1",
		},
		supabase: {
			rpc(fnName, args) {
				return Promise.resolve({ data: rpcResult(fnName, args), error: null });
			},
		},
	};
}

test("userHasGlobalPermission returns true when the permission RPC allows it", async () => {
	const req = makeReq((fnName, args) =>
		fnName === "has_global_permission" && args.permission_key === "users.read"
	);

	assert.equal(await userHasGlobalPermission(req, "users.read"), true);
});

test("requirePermission rejects users without a global permission", async () => {
	const req = makeReq(() => false);
	let error;

	await requirePermission("users.manage")(req, {}, (nextError) => {
		error = nextError;
	});

	assert.equal(error.status, 403);
	assert.match(error.message, /users\.manage/);
});

test("requireProjectPermission uses the project permission RPC", async () => {
	const req = makeReq((fnName, args) =>
		fnName === "has_project_permission" &&
		args.project_uuid === "project-1" &&
		args.permission_key === "members.manage"
	);
	let called = false;

	await requireProjectPermission("members.manage")(req, {}, (error) => {
		assert.equal(error, undefined);
		called = true;
	});

	assert.equal(called, true);
});

test("disabled users do not pass permission checks", async () => {
	const req = makeReq(() => true, { status: "disabled" });

	assert.equal(await userHasGlobalPermission(req, "users.read"), false);
});
