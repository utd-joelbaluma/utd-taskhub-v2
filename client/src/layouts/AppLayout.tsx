import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Bell, User, Settings, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const navLinks = [
	{ to: "/", label: "Dashboard", end: true },
	{ to: "/projects", label: "Projects" },
	{ to: "/tasks", label: "Tasks" },
	{ to: "/settings", label: "Settings" },
];

const SAMPLE_NOTIFICATIONS = [
	{
		id: 1,
		title: "New task assigned",
		description: "You've been assigned to \"Fix login bug\"",
		time: "2m ago",
		unread: true,
	},
	{
		id: 2,
		title: "Project deadline approaching",
		description: "TaskHub v2 is due in 3 days",
		time: "1h ago",
		unread: true,
	},
	{
		id: 3,
		title: "Comment on your task",
		description: "Alex left a comment on \"API integration\"",
		time: "3h ago",
		unread: true,
	},
	{
		id: 4,
		title: "Task completed",
		description: "\"Setup CI pipeline\" was marked complete",
		time: "Yesterday",
		unread: false,
	},
	{
		id: 5,
		title: "New team member",
		description: "Jordan Kim joined the project",
		time: "2d ago",
		unread: false,
	},
];

const unreadCount = SAMPLE_NOTIFICATIONS.filter((n) => n.unread).length;

export default function AppLayout() {
	const { user, logout } = useAuth();
	const navigate = useNavigate();

	const initials = user?.full_name
		? user.full_name
				.split(" ")
				.map((p) => p[0])
				.join("")
				.toUpperCase()
				.slice(0, 2)
		: "AR";

	const displayName = user?.full_name ?? "Alex Rivera";
	const role = user?.role ?? "Admin";

	async function handleLogout() {
		await logout();
		navigate("/login");
	}

	return (
		<div className="min-h-screen bg-background">
			<header className="sticky top-0 z-40 border-b border-border bg-surface/80 backdrop-blur-sm">
				<div className="mx-auto flex max-w-[1280px] items-center gap-6 px-6 h-14">
					<div className="flex items-center gap-2 mr-4">
						<img src="/logo.svg" alt="TaskHub" className="h-8 w-auto" />
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
						{/* Notifications */}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<button className="relative p-2 rounded-md text-muted-foreground hover:bg-muted-subtle transition-colors cursor-pointer outline-none">
									<Bell className="h-4 w-4" />
									{unreadCount > 0 && (
										<span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground leading-none">
											{unreadCount}
										</span>
									)}
								</button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-80">
								<DropdownMenuLabel className="flex items-center justify-between px-3 py-2">
									<span className="text-sm font-semibold text-foreground">Notifications</span>
									{unreadCount > 0 && (
										<span className="text-xs text-muted-foreground">{unreadCount} unread</span>
									)}
								</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<div className="max-h-72 overflow-y-auto">
									{SAMPLE_NOTIFICATIONS.map((notif) => (
										<DropdownMenuItem
											key={notif.id}
											className="flex flex-col items-start gap-0.5 px-3 py-2.5 cursor-pointer"
										>
											<div className="flex w-full items-start gap-2">
												{notif.unread && (
													<span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
												)}
												<div className={cn("flex-1", !notif.unread && "pl-3.5")}>
													<p className="text-xs font-medium text-foreground leading-snug">
														{notif.title}
													</p>
													<p className="text-xs text-muted-foreground leading-snug mt-0.5">
														{notif.description}
													</p>
												</div>
												<span className="shrink-0 text-[10px] text-muted-foreground">
													{notif.time}
												</span>
											</div>
										</DropdownMenuItem>
									))}
								</div>
								<DropdownMenuSeparator />
								<DropdownMenuItem className="justify-center text-xs text-primary font-medium py-2">
									View all notifications
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>

						{/* Account */}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<button className="flex items-center gap-2 rounded-md px-1 py-1 hover:bg-muted-subtle transition-colors cursor-pointer outline-none">
									<Avatar className="h-7 w-7">
										<AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
									</Avatar>
									<div className="leading-none text-left">
										<div className="text-xs font-medium text-foreground">{displayName}</div>
										<div className="text-[10px] text-muted">{role}</div>
									</div>
								</button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-48">
								<DropdownMenuLabel className="px-3 py-2">
									<p className="text-sm font-medium text-foreground">{displayName}</p>
									<p className="text-xs text-muted-foreground truncate">{user?.email ?? "alex@taskhub.io"}</p>
								</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									className="gap-2 px-3"
									onSelect={() => navigate("/profile")}
								>
									<User className="h-4 w-4 text-muted-foreground" />
									Profile
								</DropdownMenuItem>
								<DropdownMenuItem
									className="gap-2 px-3"
									onSelect={() => navigate("/settings")}
								>
									<Settings className="h-4 w-4 text-muted-foreground" />
									Settings
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									className="gap-2 px-3 text-danger focus:text-danger focus:bg-danger/10"
									onSelect={handleLogout}
								>
									<LogOut className="h-4 w-4" />
									Logout
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>
			</header>

			<main>
				<Outlet />
			</main>
		</div>
	);
}
