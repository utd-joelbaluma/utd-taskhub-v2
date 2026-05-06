export function getHealth(req, res) {
	res.status(200).json({
		success: true,
		message: "TaskHub API is healthy",
		timestamp: new Date().toISOString(),
	});
}
