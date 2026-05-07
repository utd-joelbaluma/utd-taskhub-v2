function permissionError(message) {
	const error = new Error(message);
	error.status = 403;
	return error;
}

async function callPermissionRpc(req, fnName, args) {
	const client = req.supabase;
	if (!client?.rpc) {
		return false;
	}

	const { data, error } = await client.rpc(fnName, args);
	if (error) throw error;
	return data === true;
}

export async function userHasGlobalPermission(req, permissionKey) {
	if (!req?.profile || req.profile.status === "disabled") {
		return false;
	}

	if (req.profile.global_role?.key === "admin" || req.profile.role === "admin") {
		return true;
	}

	return callPermissionRpc(req, "has_global_permission", {
		permission_key: permissionKey,
	});
}

export async function userHasProjectPermission(req, projectId, permissionKey) {
	if (!req?.profile || req.profile.status === "disabled") {
		return false;
	}

	if (req.membership?.is_global_bypass) {
		return true;
	}

	if (req.profile.global_role?.key === "admin" || req.profile.role === "admin") {
		return true;
	}

	return callPermissionRpc(req, "has_project_permission", {
		project_uuid: projectId,
		permission_key: permissionKey,
	});
}

export function requirePermission(permissionKey) {
	return async (req, res, next) => {
		try {
			const allowed = await userHasGlobalPermission(req, permissionKey);
			if (!allowed) {
				throw permissionError(`Access denied. Required permission: ${permissionKey}.`);
			}
			next();
		} catch (error) {
			next(error);
		}
	};
}

export function requireProjectPermission(permissionKey) {
	return async (req, res, next) => {
		try {
			const projectId = req.params.projectId || req.params.id;
			const allowed = await userHasProjectPermission(req, projectId, permissionKey);
			if (!allowed) {
				throw permissionError(`Access denied. Required permission: ${permissionKey}.`);
			}
			next();
		} catch (error) {
			next(error);
		}
	};
}
