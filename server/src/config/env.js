import dotenv from "dotenv";

dotenv.config();

export const env = {
	nodeEnv: process.env.NODE_ENV || "development",
	port: process.env.PORT || 5050,
	appName: process.env.APP_NAME || "TaskHub API",
	apiVersion: process.env.API_VERSION || "v1",

	appUrl: process.env.APP_URL || "http://localhost:5173",

	supabaseUrl: process.env.SUPABASE_URL,
	supabaseSecretKey: process.env.SUPABASE_SECRET_KEY,
	supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
	supabaseAvatarBucket: process.env.SUPABASE_AVATAR_BUCKET || "avatars",
};
