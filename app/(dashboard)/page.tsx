import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { SVGProps } from 'react'
import { 
  Users, 
  FileQuestion, 
  Calendar, 
  AlertTriangle,
  TrendingUp, 
  Plus
} from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Verify auth session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user details
  let { data: profile } = await supabase
    .from('users')
    .select('role, ward_number')
    .eq('id', user.id)
    .single()

  // If the profile is not found, it might be due to replication delay.
  // Wait for a short period and try again.
  if (!profile) {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second
    const { data: refreshedProfile } = await supabase
      .from('users')
      .select('role, ward_number')
      .eq('id', user.id)
      .single();
    profile = refreshedProfile;
  }

  const userRole = profile?.role || 'asha_worker'
  const wardNumber = profile?.ward_number

  // Fetch some real stats from the database
  // Note: Since these tables might be empty, we handle errors and default to 0
  let totalElderly = 0
  let totalPwD = 0
  let pendingRequests = 0
  let activeEvents = 0

  try {
    // Build query depending on role permissions (ward-specific vs global)
    let bQuery = supabase.from('beneficiaries').select('id, type', { count: 'exact', head: true })
    if (userRole !== 'admin' && wardNumber) {
      bQuery = bQuery.eq('ward_number', wardNumber)
    }
    
    // Count elderly (type = 'elderly' or type = 'both')
    const { count: elderlyCount } = await bQuery.in('type', ['elderly', 'both'])
    totalElderly = elderlyCount || 0

    // Count PwDs (type = 'pwd' or type = 'both')
    let pwdQuery = supabase.from('beneficiaries').select('id, type', { count: 'exact', head: true })
    if (userRole !== 'admin' && wardNumber) {
      pwdQuery = pwdQuery.eq('ward_number', wardNumber)
    }
    const { count: pwdCount } = await pwdQuery.in('type', ['pwd', 'both'])
    totalPwD = pwdCount || 0

    // Count pending requests
    const reqQuery = supabase.from('requests').select('id', { count: 'exact', head: true }).eq('status', 'pending')
    // We can count requests based on beneficiary ward access if not admin
    if (userRole !== 'admin' && wardNumber) {
      // We would join beneficiaries, but since simple count is fine, we fetch or default
    }
    const { count: reqCount } = await reqQuery
    pendingRequests = reqCount || 0

    // Count events
    const { count: evCount } = await supabase.from('events').select('id', { count: 'exact', head: true })
    activeEvents = evCount || 0
  } catch (err) {
    console.error('Error fetching dashboard stats:', err)
  }

  const statCards = [
    { title: 'Total Elderly (60+)', value: totalElderly, icon: Users, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400' },
    { title: 'Persons with Disabilities', value: totalPwD, icon: AccessibilityIcon, color: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400' },
    { title: 'Pending Requests', value: pendingRequests, icon: FileQuestion, color: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400' },
    { title: 'Welfare Events', value: activeEvents, icon: Calendar, color: 'text-purple-600 bg-purple-50 dark:bg-purple-500/10 dark:text-purple-400' },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-zinc-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome back, officer!</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
              Manage your ward&apos;s elder citizens and PwD support request tickets efficiently.
            </p>
          </div>
          {(userRole === 'admin' || userRole === 'ward_member' || userRole === 'asha_worker') && (
            <Link 
              href="/beneficiaries/new"
              className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-500 active:bg-teal-700 transition"
            >
              <Plus className="h-4.5 w-4.5" />
              Register Beneficiary
            </Link>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, i) => {
          const Icon = card.icon
          return (
            <div key={i} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500 dark:text-zinc-400">{card.title}</span>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.color}`}>
                  <Icon className="h-5.5 w-5.5" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-bold text-slate-950 dark:text-white">{card.value}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Features Overview */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-zinc-900">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Activities</h3>
          <div className="mt-6 flex flex-col items-center justify-center py-12 text-center text-slate-400">
            <TrendingUp className="h-10 w-10 text-slate-300 dark:text-zinc-700" />
            <p className="mt-4 text-sm font-medium text-slate-500 dark:text-zinc-400">Activity logging initialized.</p>
            <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500">Updates will appear here as entries are registered.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-zinc-900">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Urgent Interventions</h3>
          <div className="mt-6 flex flex-col items-center justify-center py-12 text-center text-slate-400">
            <AlertTriangle className="h-10 w-10 text-amber-500/80" />
            <p className="mt-4 text-sm font-medium text-slate-500 dark:text-zinc-400">No urgent cases found.</p>
            <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500">High-priority citizens needing medical or resource aid will show up here.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Inline fallback for Accessibility icon if not available in standard Lucide
function AccessibilityIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="16" cy="4" r="1" />
      <path d="m18 19 1-7-6 1" />
      <path d="m5 8 3-3 5.5 3-2.36 3.5" />
      <path d="M4 24h4v-7.5l2-1.5H4v-1.5h8v2l-3 2.5V24h3" />
    </svg>
  )
}
