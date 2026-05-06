import axios from "axios";

export const httpClient = axios.create({
	timeout: 10000,
	headers: {
		Accept: "application/json",
		"Content-Type": "application/json",
	},
});

httpClient.interceptors.request.use(
	(config) => {
		// Add auth token or custom headers later here
		return config;
	},
	(error) => {
		return Promise.reject(error);
	},
);

httpClient.interceptors.response.use(
	(response) => response,
	(error) => {
		const message =
			error.response?.data?.message ||
			error.message ||
			"External request failed";

		return Promise.reject({
			status: error.response?.status || 500,
			message,
			data: error.response?.data || null,
		});
	},
);
