import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // Verify auth session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Retrieve user metadata/role from the public.users table
  const { data: profile } = await supabase
    .from('users')
    .select('full_name, role, ward_number')
    .eq('id', user.id)
    .single()

  const userName = profile?.full_name || user.email?.split('@')[0] || 'Staff User'
  const userRole = profile?.role || 'asha_worker'
  const wardNumber = profile?.ward_number ?? null

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-zinc-950 font-sans">
      <Sidebar role={userRole} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar userName={userName} userEmail={user.email} wardNumber={wardNumber} />
        <main className="flex-1 overflow-y-auto bg-slate-50 p-6 dark:bg-zinc-950">
          {children}
        </main>
      </div>
    </div>
  )
}
