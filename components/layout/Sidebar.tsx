'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Users, 
  FileQuestion, 
  Calendar, 
  BarChart3, 
  FileText, 
  Settings, 
  Menu,
  ShieldAlert
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  role?: string
  className?: string
}

export default function Sidebar({ role = 'asha_worker', className }: SidebarProps) {
  const pathname = usePathname()

  const links = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'ward_member', 'asha_worker', 'anganwadi_worker'] },
    { href: '/beneficiaries', label: 'Beneficiaries', icon: Users, roles: ['admin', 'ward_member', 'asha_worker', 'anganwadi_worker'] },
    { href: '/requests', label: 'Requests', icon: FileQuestion, roles: ['admin', 'ward_member', 'asha_worker'] },
    { href: '/events', label: 'Welfare Events', icon: Calendar, roles: ['admin', 'ward_member', 'asha_worker', 'anganwadi_worker'] },
    { href: '/analytics', label: 'Analytics', icon: BarChart3, roles: ['admin', 'ward_member'] },
    { href: '/reports', label: 'Reports', icon: FileText, roles: ['admin'] },
    { href: '/settings', label: 'Settings', icon: Settings, roles: ['admin'] },
  ]

  const filteredLinks = links.filter(link => link.roles.includes(role))

  return (
    <aside className={cn("flex flex-col w-64 bg-slate-900 border-r border-slate-800 text-slate-300 min-h-screen", className)}>
      <div className="flex items-center gap-2.5 px-6 py-5 border-b border-slate-800">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div>
          <span className="text-lg font-bold text-white tracking-tight">Soochika</span>
          <span className="block text-[10px] text-teal-400 font-semibold uppercase tracking-wider">PBMS Portal</span>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {filteredLinks.map((link) => {
          const isActive = pathname === link.href || (link.href !== '/' && pathname?.startsWith(link.href))
          const Icon = link.icon

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3.5 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-150 group",
                isActive 
                  ? "bg-teal-600 text-white shadow-md shadow-teal-900/10" 
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
              )}
            >
              <Icon className={cn(
                "h-5 w-5 shrink-0 transition-transform duration-150 group-hover:scale-105",
                isActive ? "text-white" : "text-slate-400 group-hover:text-white"
              )} />
              {link.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 bg-slate-950/20">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-bold uppercase text-sm">
            {role.substring(0, 2)}
          </div>
          <div className="flex-1 overflow-hidden">
            <span className="block text-xs font-semibold text-white capitalize truncate">{role.replace('_', ' ')}</span>
            <span className="block text-[10px] text-slate-400 truncate">Panchayat Staff</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
