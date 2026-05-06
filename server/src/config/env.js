import dotenv from "dotenv";

dotenv.config();

export const env = {
	nodeEnv: process.env.NODE_ENV || "development",
	port: process.env.PORT || 5050,
	appName: process.env.APP_NAME || "TaskHub API",
	apiVersion: process.env.API_VERSION || "v1",

	supabaseUrl: process.env.SUPABASE_URL,
	supabaseSecretKey: process.env.SUPABASE_SECRET_KEY,
};
