import { supabase } from "../config/supabase.js";
import {
	validateCreateRole,
	validateSetRolePermissions,
	validateUpdateRole,
} from "../utils/role.validator.js";

const ROLE_SELECT = `
	id,
	scope,
	key,
	name,
	description,
	is_system,
	created_at,
	updated_at,
	permissions:role_permissions (
		permission:permissions (
			id,
			scope,
			key,
			description
		)
	)
`;

function flattenRole(role) {
	if (!role) return role;

	return {
		...role,
		permissions: (role.permissions || [])
			.map((item) => item.permission)
			.filter(Boolean)
			.sort((a, b) => a.key.localeCompare(b.key)),
	};
}

async function getRoleById(roleId) {
	const { data, error } = await supabase
		.from("roles")
		.select(ROLE_SELECT)
		.eq("id", roleId)
		.maybeSingle();

	if (error) throw error;
	return flattenRole(data);
}

async function resolvePermissionIds(scope, permissionKeys) {
	if (!permissionKeys || permissionKeys.length === 0) {
		return [];
	}

	const uniqueKeys = [...new Set(permissionKeys)];
	const { data, error } = await supabase
		.from("permissions")
		.select("id, key")
		.eq("scope", scope)
		.in("key", uniqueKeys);

	if (error) throw error;

	if (data.length !== uniqueKeys.length) {
		const found = new Set(data.map((permission) => permission.key));
		const missing = uniqueKeys.filter((key) => !found.has(key));
		const error = new Error(`Unknown permission key(s): ${missing.join(", ")}.`);
		error.status = 400;
		throw error;
	}

	return data.map((permission) => permission.id);
}

async function replaceRolePermissions(role, permissionKeys) {
	const permissionIds = await resolvePermissionIds(role.scope, permissionKeys);

	const { error: deleteError } = await supabase
		.from("role_permissions")
		.delete()
		.eq("role_id", role.id);

	if (deleteError) throw deleteError;

	if (permissionIds.length === 0) {
		return;
	}

	const { error: insertError } = await supabase
		.from("role_permissions")
		.insert(permissionIds.map((permissionId) => ({
			role_id: role.id,
			permission_id: permissionId,
		})));

	if (insertError) throw insertError;
}

export async function listRoles(req, res, next) {
	try {
		const { scope } = req.query;

		let query = supabase
			.from("roles")
			.select(ROLE_SELECT)
			.order("scope", { ascending: true })
			.order("name", { ascending: true });

		if (scope) {
			query = query.eq("scope", scope);
		}

		const { data, error } = await query;
		if (error) throw error;

		res.status(200).json({
			success: true,
			count: data.length,
			data: data.map(flattenRole),
		});
	} catch (error) {
		next(error);
	}
}

export async function getRole(req, res, next) {
	try {
		const role = await getRoleById(req.params.id);

		if (!role) {
			return res.status(404).json({
				success: false,
				message: "Role not found.",
			});
		}

		res.status(200).json({
			success: true,
			data: { role },
		});
	} catch (error) {
		next(error);
	}
}

export async function createRole(req, res, next) {
	try {
		const errors = validateCreateRole(req.body);
		if (errors.length > 0) {
			return res.status(400).json({
				success: false,
				message: "Validation failed.",
				errors,
			});
		}

		const { scope, key, name, description, permission_keys = [] } = req.body;

		const { data: role, error } = await supabase
			.from("roles")
			.insert({
				scope,
				key,
				name: name.trim(),
				description: description?.trim() || null,
				is_system: false,
			})
			.select("id, scope")
			.single();

		if (error) {
			if (error.code === "23505") {
				return res.status(409).json({
					success: false,
					message: "A role with this scope and key already exists.",
				});
			}
			throw error;
		}

		await replaceRolePermissions(role, permission_keys);
		const createdRole = await getRoleById(role.id);

		res.status(201).json({
			success: true,
			message: "Role created successfully.",
			data: { role: createdRole },
		});
	} catch (error) {
		next(error);
	}
}

export async function updateRole(req, res, next) {
	try {
		const errors = validateUpdateRole(req.body);
		if (errors.length > 0) {
			return res.status(400).json({
				success: false,
				message: "Validation failed.",
				errors,
			});
		}

		const updateData = {};
		if (req.body.name !== undefined) updateData.name = req.body.name.trim();
		if (req.body.description !== undefined) {
			updateData.description = req.body.description?.trim() || null;
		}

		if (Object.keys(updateData).length === 0) {
			return res.status(400).json({
				success: false,
				message: "No valid fields provided for update.",
			});
		}

		const { data, error } = await supabase
			.from("roles")
			.update(updateData)
			.eq("id", req.params.id)
			.select("id")
			.maybeSingle();

		if (error) throw error;

		if (!data) {
			return res.status(404).json({
				success: false,
				message: "Role not found.",
			});
		}

		const role = await getRoleById(data.id);

		res.status(200).json({
			success: true,
			message: "Role updated successfully.",
			data: { role },
		});
	} catch (error) {
		next(error);
	}
}

export async function deleteRole(req, res, next) {
	try {
		const { data: role, error: findError } = await supabase
			.from("roles")
			.select("id, is_system")
			.eq("id", req.params.id)
			.maybeSingle();

		if (findError) throw findError;

		if (!role) {
			return res.status(404).json({
				success: false,
				message: "Role not found.",
			});
		}

		if (role.is_system) {
			return res.status(400).json({
				success: false,
				message: "System roles cannot be deleted.",
			});
		}

		const { error } = await supabase.from("roles").delete().eq("id", role.id);
		if (error) throw error;

		res.status(200).json({
			success: true,
			message: "Role deleted successfully.",
		});
	} catch (error) {
		next(error);
	}
}

export async function setRolePermissions(req, res, next) {
	try {
		const errors = validateSetRolePermissions(req.body);
		if (errors.length > 0) {
			return res.status(400).json({
				success: false,
				message: "Validation failed.",
				errors,
			});
		}

		const { data: role, error: findError } = await supabase
			.from("roles")
			.select("id, scope")
			.eq("id", req.params.id)
			.maybeSingle();

		if (findError) throw findError;

		if (!role) {
			return res.status(404).json({
				success: false,
				message: "Role not found.",
			});
		}

		await replaceRolePermissions(role, req.body.permission_keys);
		const updatedRole = await getRoleById(role.id);

		res.status(200).json({
			success: true,
			message: "Role permissions updated successfully.",
			data: { role: updatedRole },
		});
	} catch (error) {
		next(error);
	}
}
