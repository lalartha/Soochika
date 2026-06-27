'use client'

import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut, User, Bell } from 'lucide-react'

interface TopBarProps {
  userName?: string
  userEmail?: string
  wardNumber?: number | null
}

export default function TopBar({ userName = 'Panchayat User', userEmail = '', wardNumber = null }: TopBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  // Generate a page title based on path
  const getPageTitle = () => {
    if (pathname === '/') return 'Dashboard Overview'
    if (pathname?.startsWith('/beneficiaries')) return 'Beneficiary Directory'
    if (pathname?.startsWith('/requests')) return 'Service Requests'
    if (pathname?.startsWith('/events')) return 'Welfare Events'
    if (pathname?.startsWith('/analytics')) return 'Analytics Reports'
    if (pathname?.startsWith('/reports')) return 'Data Exports'
    if (pathname?.startsWith('/settings')) return 'System Settings'
    return 'Portal'
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm dark:border-slate-800 dark:bg-zinc-950">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-zinc-50">
          {getPageTitle()}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {wardNumber !== null && (
          <span className="inline-flex items-center rounded-md bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-700 ring-1 ring-inset ring-teal-600/20 dark:bg-teal-500/10 dark:text-teal-400 dark:ring-teal-500/30">
            Ward {wardNumber}
          </span>
        )}

        <button className="relative text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
          <Bell className="h-5.5 w-5.5" />
          <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-teal-500" />
        </button>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <span className="block text-xs font-semibold text-slate-700 dark:text-zinc-200">{userName}</span>
            {userEmail && <span className="block text-[10px] text-slate-400 truncate max-w-[150px]">{userEmail}</span>}
          </div>
          <button 
            onClick={handleSignOut}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 border border-slate-200/60 hover:bg-red-50 hover:text-red-600 dark:bg-zinc-900 dark:border-zinc-800 dark:hover:bg-red-950/20 dark:hover:text-red-400 transition-colors"
            title="Log Out"
          >
            <LogOut className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>
    </header>
  )
}
