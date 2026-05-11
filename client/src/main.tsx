import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "react-day-picker/style.css";
import App from "./App.tsx";
import "@mantine/core/styles.css";
import { AuthProvider } from "@/context/AuthContext";
import { MantineProvider } from "@mantine/core";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<AuthProvider>
			<MantineProvider>
				<App />
			</MantineProvider>
		</AuthProvider>
	</StrictMode>,
);
