import { NavLink, Outlet } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

const navLinks = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/projects', label: 'Projects' },
  { to: '/tasks', label: 'Tasks' },
  { to: '/kanban', label: 'Kanban Board' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/settings', label: 'Settings' },
]

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-[#f9f9ff]">
      <header className="sticky top-0 z-40 border-b border-[#e1e2ec] bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1280px] items-center gap-6 px-6 h-14">
          <div className="flex items-center gap-2 mr-4">
            <div className="h-7 w-7 rounded-md bg-[#0058be] flex items-center justify-center">
              <span className="text-white text-xs font-bold">TH</span>
            </div>
            <div>
              <div className="text-xs font-semibold text-[#191b23] leading-none">TaskHub</div>
              <div className="text-[10px] text-[#727785] leading-none mt-0.5">DEV MANAGEMENT</div>
            </div>
          </div>

          <nav className="flex items-center gap-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  cn(
                    'px-3 py-1.5 text-sm rounded-md transition-colors',
                    isActive
                      ? 'text-[#0058be] font-medium border-b-2 border-[#0058be] rounded-none'
                      : 'text-[#424754] hover:text-[#191b23] hover:bg-[#f2f3fd]'
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <button className="relative p-2 rounded-md text-[#424754] hover:bg-[#f2f3fd] transition-colors cursor-pointer">
              <Bell className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-[10px]">AR</AvatarFallback>
              </Avatar>
              <div className="leading-none">
                <div className="text-xs font-medium text-[#191b23]">Alex Rivera</div>
                <div className="text-[10px] text-[#727785]">Admin</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  )
}
