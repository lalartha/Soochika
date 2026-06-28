export type Priority = "high" | "medium" | "low";
export type BeneficiaryType = "elderly" | "pwd" | "both";
export type RequestStatus = "pending" | "in_progress" | "completed";

export type Beneficiary = {
  id: string;
  type: BeneficiaryType;
  full_name: string;
  age: number;
  gender: "male" | "female" | "other";
  address: string;
  ward_number: number;
  phone: string;
  emergency_contact: string;
  is_verified: boolean;
  data_collected_at: string;
  is_deceased?: boolean;
  death_date?: string | null;
  priority: Priority;
  health?: {
    lives_alone: boolean;
    is_bedridden: boolean;
    chronic_diseases: string[];
    pension_status: string;
    last_health_check: string;
  };
  disability?: {
    disability_type: string;
    disability_percentage: number;
    assistive_devices: string[];
    has_caregiver: boolean;
    caregiver_name?: string;
  };
};

export type ServiceRequest = {
  id: string;
  beneficiary_id: string;
  beneficiary_name: string;
  request_type: string;
  status: RequestStatus;
  ward_number: number;
  notes: string;
  created_at: string;
  assigned_to: string;
};

export type WelfareEvent = {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location: string;
  eligibility_wards: number[];
  min_age?: number;
  min_disability_pct?: number;
  priority_filter: Priority[];
};

export const beneficiaries: Beneficiary[] = [
  {
    id: "b-001",
    type: "both",
    full_name: "Lakshmi Amma",
    age: 82,
    gender: "female",
    address: "Thanal House, Ward 1",
    ward_number: 1,
    phone: "9876543210",
    emergency_contact: "Ravi Kumar - 9876543201",
    is_verified: true,
    data_collected_at: "2026-06-01",
    is_deceased: false,
    priority: "high",
    health: {
      lives_alone: true,
      is_bedridden: false,
      chronic_diseases: ["Diabetes", "Hypertension"],
      pension_status: "receiving",
      last_health_check: "2026-06-12",
    },
    disability: {
      disability_type: "locomotor",
      disability_percentage: 75,
      assistive_devices: ["Walking stick"],
      has_caregiver: false,
    },
  },
  {
    id: "b-002",
    type: "elderly",
    full_name: "Madhavan Nair",
    age: 76,
    gender: "male",
    address: "Puthenpurackal, Ward 1",
    ward_number: 1,
    phone: "9876543211",
    emergency_contact: "Mini M - 9876543202",
    is_verified: true,
    data_collected_at: "2026-06-03",
    is_deceased: false,
    priority: "high",
    health: {
      lives_alone: false,
      is_bedridden: true,
      chronic_diseases: ["Cardiac"],
      pension_status: "applied",
      last_health_check: "2026-06-18",
    },
  },
  {
    id: "b-003",
    type: "pwd",
    full_name: "Afsal Rahman",
    age: 34,
    gender: "male",
    address: "Rahmath Manzil, Ward 2",
    ward_number: 2,
    phone: "9876543212",
    emergency_contact: "Naseema - 9876543203",
    is_verified: false,
    data_collected_at: "2026-06-08",
    is_deceased: false,
    priority: "medium",
    disability: {
      disability_type: "hearing",
      disability_percentage: 55,
      assistive_devices: ["Hearing aid"],
      has_caregiver: true,
      caregiver_name: "Naseema",
    },
  },
  {
    id: "b-004",
    type: "elderly",
    full_name: "Marykutty Joseph",
    age: 68,
    gender: "female",
    address: "St. Mary Villa, Ward 2",
    ward_number: 2,
    phone: "9876543213",
    emergency_contact: "Joseph P - 9876543204",
    is_verified: true,
    data_collected_at: "2026-06-11",
    is_deceased: false,
    priority: "medium",
    health: {
      lives_alone: false,
      is_bedridden: false,
      chronic_diseases: ["Arthritis"],
      pension_status: "receiving",
      last_health_check: "2026-05-28",
    },
  },
  {
    id: "b-005",
    type: "both",
    full_name: "Saraswathi K",
    age: 79,
    gender: "female",
    address: "Kizhakkedath, Ward 1",
    ward_number: 1,
    phone: "9876543214",
    emergency_contact: "Suma K - 9876543205",
    is_verified: false,
    data_collected_at: "2026-06-14",
    is_deceased: false,
    priority: "high",
    health: {
      lives_alone: true,
      is_bedridden: false,
      chronic_diseases: ["COPD"],
      pension_status: "not_applied",
      last_health_check: "2026-06-04",
    },
    disability: {
      disability_type: "visual",
      disability_percentage: 45,
      assistive_devices: ["Spectacles"],
      has_caregiver: true,
      caregiver_name: "Suma K",
    },
  },
  {
    id: "b-006",
    type: "pwd",
    full_name: "Biju Varghese",
    age: 44,
    gender: "male",
    address: "Grace Cottage, Ward 2",
    ward_number: 2,
    phone: "9876543215",
    emergency_contact: "Ancy B - 9876543206",
    is_verified: true,
    data_collected_at: "2026-06-16",
    is_deceased: false,
    priority: "high",
    disability: {
      disability_type: "multiple",
      disability_percentage: 82,
      assistive_devices: ["Wheelchair"],
      has_caregiver: true,
      caregiver_name: "Ancy B",
    },
  },
];

export const requests: ServiceRequest[] = [
  {
    id: "r-001",
    beneficiary_id: "b-001",
    beneficiary_name: "Lakshmi Amma",
    request_type: "wheelchair",
    status: "pending",
    ward_number: 1,
    notes: "Needs wheelchair before next hospital visit.",
    created_at: "2026-06-22",
    assigned_to: "Ward Member - Ward 1",
  },
  {
    id: "r-002",
    beneficiary_id: "b-002",
    beneficiary_name: "Madhavan Nair",
    request_type: "home_visit",
    status: "in_progress",
    ward_number: 1,
    notes: "ASHA visit scheduled for vitals and medication review.",
    created_at: "2026-06-20",
    assigned_to: "ASHA Worker - Ward 1",
  },
  {
    id: "r-003",
    beneficiary_id: "b-003",
    beneficiary_name: "Afsal Rahman",
    request_type: "pension_support",
    status: "pending",
    ward_number: 2,
    notes: "Certificate verification pending.",
    created_at: "2026-06-19",
    assigned_to: "Ward Member - Ward 2",
  },
  {
    id: "r-004",
    beneficiary_id: "b-006",
    beneficiary_name: "Biju Varghese",
    request_type: "ramp",
    status: "completed",
    ward_number: 2,
    notes: "Ramp installation completed and verified.",
    created_at: "2026-06-10",
    assigned_to: "Admin",
  },
  {
    id: "r-005",
    beneficiary_id: "b-005",
    beneficiary_name: "Saraswathi K",
    request_type: "death_report",
    status: "pending",
    ward_number: 1,
    notes: "Death reported for 2026-06-25. Awaiting admin approval.",
    created_at: "2026-06-26",
    assigned_to: "Admin",
  },
];

export const events: WelfareEvent[] = [
  {
    id: "e-001",
    title: "Ward 1 Priority Health Camp",
    description: "Doctor visit and medicine review for high-priority elderly citizens.",
    event_date: "2026-07-05",
    location: "Ward 1 Anganwadi Hall",
    eligibility_wards: [1],
    min_age: 60,
    priority_filter: ["high"],
  },
  {
    id: "e-002",
    title: "Assistive Device Distribution",
    description: "Distribution and fitting support for wheelchairs, hearing aids and walking sticks.",
    event_date: "2026-07-12",
    location: "Panchayat Community Hall",
    eligibility_wards: [1, 2],
    min_disability_pct: 40,
    priority_filter: ["high", "medium"],
  },
  {
    id: "e-003",
    title: "Pension Support Desk",
    description: "Application and document correction help for elderly and PwD pension cases.",
    event_date: "2026-07-18",
    location: "Panchayat Office",
    eligibility_wards: [1, 2],
    min_age: 60,
    priority_filter: ["high", "medium", "low"],
  },
];

export const users = [
  { id: "u-001", full_name: "Panchayat Admin", role: "admin", ward_number: null, phone: "9876500001", is_active: true },
  { id: "u-002", full_name: "Ward Member One", role: "ward_member", ward_number: 1, phone: "9876500002", is_active: true },
  { id: "u-003", full_name: "ASHA Worker One", role: "asha_worker", ward_number: 1, phone: "9876500003", is_active: true },
  { id: "u-004", full_name: "Ward Member Two", role: "ward_member", ward_number: 2, phone: "9876500004", is_active: true },
  { id: "u-005", full_name: "Anganwadi Worker Two", role: "anganwadi_worker", ward_number: 2, phone: "9876500005", is_active: true },
];

export function beneficiariesForEvent(eventId: string) {
  const event = events.find((item) => item.id === eventId);
  if (!event) return [];

  return beneficiaries.filter((beneficiary) => {
    const disabilityPct = beneficiary.disability?.disability_percentage ?? 0;
    return (
      event.eligibility_wards.includes(beneficiary.ward_number) &&
      (!event.min_age || beneficiary.age >= event.min_age) &&
      (!event.min_disability_pct || disabilityPct >= event.min_disability_pct) &&
      event.priority_filter.includes(beneficiary.priority)
    );
  });
}

export function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
