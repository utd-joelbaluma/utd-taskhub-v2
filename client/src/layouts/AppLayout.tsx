import { NavLink, Outlet } from "react-router-dom";
import { Bell } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const navLinks = [
	{ to: "/", label: "Dashboard", end: true },
	{ to: "/projects", label: "Projects" },
	{ to: "/tasks", label: "Tasks" },
	{ to: "/settings", label: "Settings" },
];

export default function AppLayout() {
	return (
		<div className="min-h-screen bg-background">
			<header className="sticky top-0 z-40 border-b border-border bg-surface/80 backdrop-blur-sm">
				<div className="mx-auto flex max-w-[1280px] items-center gap-6 px-6 h-14">
					<div className="flex items-center gap-2 mr-4">
						<img
							src="/logo.svg"
							alt="TaskHub"
							className="h-8 w-auto"
						/>
					</div>

					<nav className="flex items-center gap-1">
						{navLinks.map((link) => (
							<NavLink
								key={link.to}
								to={link.to}
								end={link.end}
								className={({ isActive }) =>
									cn(
										"px-3 py-1.5 text-sm rounded-md transition-colors",
										isActive
											? "text-primary font-medium border-b-2 border-primary rounded-none"
											: "text-muted-foreground hover:text-foreground hover:bg-muted-subtle",
									)
								}
							>
								{link.label}
							</NavLink>
						))}
					</nav>

					<div className="ml-auto flex items-center gap-3">
						<button className="relative p-2 rounded-md text-muted-foreground hover:bg-muted-subtle transition-colors cursor-pointer">
							<Bell className="h-4 w-4" />
						</button>
						<div className="flex items-center gap-2">
							<Avatar className="h-7 w-7">
								<AvatarFallback className="text-[10px]">
									AR
								</AvatarFallback>
							</Avatar>
							<div className="leading-none">
								<div className="text-xs font-medium text-foreground">
									Alex Rivera
								</div>
								<div className="text-[10px] text-muted">
									Admin
								</div>
							</div>
						</div>
					</div>
				</div>
			</header>

			<main>
				<Outlet />
			</main>
		</div>
	);
}
