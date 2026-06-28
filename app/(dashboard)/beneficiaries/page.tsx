import Link from 'next/link'
import { DataTable } from '@/components/shared/data-table'
import { PageShell, Panel } from '@/components/shared/page-shell'
import { PriorityBadge } from '@/components/shared/status'
import { createClient } from '@/lib/supabase/server'
import { beneficiaries as fallbackBeneficiaries, titleCase } from '@/lib/seed-data'

export default async function BeneficiariesPage() {
  const supabase = await createClient()
  const { data: sessionData } = await supabase.auth.getSession()
  const session = sessionData.session as { user: { id: string } } | null
  const user = session?.user

  const { data: profile } = await supabase
    .from('users')
    .select('role, ward_number')
    .eq('id', user?.id)
    .single()

  const userRole = profile?.role || 'asha_worker'
  const wardNumber = profile?.ward_number

  let query = supabase
    .from('beneficiaries')
    .select('id, full_name, type, ward_number, age, phone, is_verified, priority, data_collected_at, is_deceased')
    .order('created_at', { ascending: false })

  if (userRole !== 'admin' && wardNumber) {
    query = query.eq('ward_number', wardNumber)
  }

  const { data: beneficiaries, error } = await query
  const beneficiaryRows = error || !beneficiaries?.length ? fallbackBeneficiaries : beneficiaries

  if (error) {
    console.error('Error fetching beneficiaries:', error.message)
  }

  return (
    <PageShell
      title="Beneficiaries"
      description="Search, review and prioritize elderly citizens and persons with disabilities across the pilot wards."
      action={{ href: '/beneficiaries/new', label: 'Register Beneficiary' }}
    >
      <Panel>
        <div className="grid gap-3 border-b border-slate-200 p-4 dark:border-slate-800 md:grid-cols-4">
          <input className="rounded-md border border-slate-200 px-3 py-2 text-base" placeholder="Search by name or phone" />
          <select className="rounded-md border border-slate-200 px-3 py-2 text-base" defaultValue="">
            <option value="">All wards</option>
            <option>Ward 1</option>
            <option>Ward 2</option>
          </select>
          <select className="rounded-md border border-slate-200 px-3 py-2 text-base" defaultValue="">
            <option value="">All types</option>
            <option>Elderly</option>
            <option>PwD</option>
            <option>Both</option>
          </select>
          <select className="rounded-md border border-slate-200 px-3 py-2 text-base" defaultValue="">
            <option value="">All priorities</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
        </div>
        <DataTable
          headers={["Name", "Type", "Ward", "Age", "Collection", "Priority", "Status", "Action"]}
          rows={beneficiaryRows.map((beneficiary) => [
            <div key="name">
              <div className="font-semibold">{beneficiary.full_name}</div>
              <div className="text-sm text-slate-500">{beneficiary.phone}</div>
            </div>,
            titleCase(beneficiary.type),
            `Ward ${beneficiary.ward_number}`,
            beneficiary.age,
            beneficiary.data_collected_at ?? "Not recorded",
            <PriorityBadge key="priority" priority={beneficiary.priority} />,
            beneficiary.is_deceased ? "Deceased" : beneficiary.is_verified ? 'Verified' : 'Pending',
            <Link key="action" href={`/beneficiaries/${beneficiary.id}`} className="font-semibold text-teal-700 hover:text-teal-600">
              View profile
            </Link>,
          ])}
        />
      </Panel>
    </PageShell>
  )
}
