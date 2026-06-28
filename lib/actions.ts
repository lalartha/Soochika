"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type UserRole = "admin" | "ward_member" | "asha_worker" | "anganwadi_worker";

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readOptionalString(formData: FormData, key: string) {
  const value = readString(formData, key);
  return value.length > 0 ? value : null;
}

function readStringArray(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
}

function readNumber(formData: FormData, key: string) {
  const value = Number(readString(formData, key));
  return Number.isFinite(value) ? value : null;
}

async function requireCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("users")
    .select("id, role, ward_number, full_name")
    .eq("id", user.id)
    .single();

  if (!profile) throw new Error("User profile not found");

  return { supabase, user, profile: profile as { id: string; role: UserRole; ward_number: number | null; full_name: string } };
}

function splitCsv(value: string | null) {
  return value
    ? value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
}

export async function createBeneficiary(formData: FormData) {
  const { supabase, user, profile } = await requireCurrentUser();
  const requestedWard = readNumber(formData, "ward_number");
  const wardNumber = profile.role === "admin" ? requestedWard : profile.ward_number;

  if (!wardNumber) throw new Error("Ward number is required.");
  if (!["admin", "ward_member", "asha_worker"].includes(profile.role)) {
    throw new Error("You do not have permission to register beneficiaries.");
  }

  const { data: beneficiary, error } = await supabase
    .from("beneficiaries")
    .insert({
      full_name: readString(formData, "full_name"),
      date_of_birth: readString(formData, "date_of_birth"),
      phone: readOptionalString(formData, "phone"),
      emergency_contact: readOptionalString(formData, "emergency_contact"),
      address: readString(formData, "address"),
      ward_number: wardNumber,
      type: readString(formData, "type"),
      gender: readString(formData, "gender"),
      is_verified: formData.get("is_verified") === "on",
      registered_by: user.id,
      data_collected_at: readOptionalString(formData, "data_collected_at"),
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  if (["elderly", "both"].includes(readString(formData, "type"))) {
    await supabase.from("health_details").insert({
      beneficiary_id: beneficiary.id,
      lives_alone: formData.get("lives_alone") === "on",
      is_bedridden: formData.get("is_bedridden") === "on",
      chronic_diseases: readStringArray(formData, "chronic_diseases"),
      pension_status: readOptionalString(formData, "pension_status"),
      last_health_check: readOptionalString(formData, "last_health_check"),
      notes: readOptionalString(formData, "other_diseases"),
    });
  }

  if (["pwd", "both"].includes(readString(formData, "type"))) {
    await supabase.from("disability_details").insert({
      beneficiary_id: beneficiary.id,
      disability_type: readOptionalString(formData, "disability_type") ?? "other",
      disability_percentage: readNumber(formData, "disability_percentage") ?? 0,
      certificate_number: readOptionalString(formData, "certificate_number"),
      assistive_devices: splitCsv(readOptionalString(formData, "assistive_devices")),
      has_caregiver: formData.get("has_caregiver") === "on",
      caregiver_name: readOptionalString(formData, "caregiver_name"),
      caregiver_phone: readOptionalString(formData, "caregiver_phone"),
    });
  }

  revalidatePath("/beneficiaries");
  redirect(`/beneficiaries/${beneficiary.id}`);
}

export async function updateBeneficiary(formData: FormData) {
  const { supabase, profile } = await requireCurrentUser();
  if (!["admin", "ward_member", "asha_worker"].includes(profile.role)) throw new Error("Forbidden");

  const id = readString(formData, "id");
  const wardNumber = profile.role === "admin" ? readNumber(formData, "ward_number") : profile.ward_number;

  const { error } = await supabase
    .from("beneficiaries")
    .update({
      full_name: readString(formData, "full_name"),
      phone: readOptionalString(formData, "phone"),
      emergency_contact: readOptionalString(formData, "emergency_contact"),
      address: readString(formData, "address"),
      ward_number: wardNumber,
      is_verified: formData.get("is_verified") === "on",
      data_collected_at: readOptionalString(formData, "data_collected_at"),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath(`/beneficiaries/${id}`);
  redirect(`/beneficiaries/${id}`);
}

export async function createRequest(formData: FormData) {
  const { supabase, user, profile } = await requireCurrentUser();
  if (profile.role === "anganwadi_worker") throw new Error("Forbidden");

  const beneficiaryId = readString(formData, "beneficiary_id");
  const requestType = readString(formData, "request_type");
  const notes = readOptionalString(formData, "notes");

  const { error } = await supabase.from("requests").insert({
    beneficiary_id: beneficiaryId,
    request_type: requestType,
    other_details: requestType === "other" ? readOptionalString(formData, "other_details") : null,
    notes,
    raised_by: user.id,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/beneficiaries/${beneficiaryId}`);
  revalidatePath("/requests");
}

export async function reportDeath(formData: FormData) {
  const { supabase, user, profile } = await requireCurrentUser();
  if (!["admin", "ward_member", "asha_worker"].includes(profile.role)) throw new Error("Forbidden");

  const beneficiaryId = readString(formData, "beneficiary_id");
  const deathDate = readString(formData, "death_date");
  const notes = readOptionalString(formData, "notes");

  const { error } = await supabase.from("requests").insert({
    beneficiary_id: beneficiaryId,
    request_type: "death_report",
    other_details: deathDate,
    notes: notes ? `Death reported for ${deathDate}. ${notes}` : `Death reported for ${deathDate}.`,
    raised_by: user.id,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/beneficiaries/${beneficiaryId}`);
  revalidatePath("/requests");
}

export async function updateRequest(formData: FormData) {
  const { supabase, profile } = await requireCurrentUser();
  if (profile.role === "anganwadi_worker") throw new Error("Forbidden");

  const id = readString(formData, "id");
  const status = readString(formData, "status");
  const notes = readOptionalString(formData, "notes");

  const { error } = await supabase.from("requests").update({ status, notes }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath(`/requests/${id}`);
  revalidatePath("/requests");
}

export async function approveDeathReport(formData: FormData) {
  const { supabase, user, profile } = await requireCurrentUser();
  if (profile.role !== "admin") throw new Error("Only admins can approve death reports.");

  const requestId = readString(formData, "request_id");
  const beneficiaryId = readString(formData, "beneficiary_id");
  const deathDate = readOptionalString(formData, "death_date");

  const { error: beneficiaryError } = await supabase
    .from("beneficiaries")
    .update({
      is_deceased: true,
      death_date: deathDate,
      death_approved_by: user.id,
      death_approved_at: new Date().toISOString(),
    })
    .eq("id", beneficiaryId);

  if (beneficiaryError) throw new Error(beneficiaryError.message);

  const { error: requestError } = await supabase
    .from("requests")
    .update({ status: "completed" })
    .eq("id", requestId);

  if (requestError) throw new Error(requestError.message);

  revalidatePath(`/beneficiaries/${beneficiaryId}`);
  revalidatePath(`/requests/${requestId}`);
  revalidatePath("/requests");
}

export async function createEvent(formData: FormData) {
  const { supabase, profile } = await requireCurrentUser();
  if (profile.role !== "admin") throw new Error("Only admins can create events.");

  const eligibilityWards = formData.getAll("eligibility_wards").map((value) => Number(value)).filter(Boolean);
  const priorityFilter = formData.getAll("priority_filter").map(String);

  const { data, error } = await supabase
    .from("events")
    .insert({
      title: readString(formData, "title"),
      description: readOptionalString(formData, "description"),
      event_date: readString(formData, "event_date"),
      location: readOptionalString(formData, "location"),
      eligibility_wards: eligibilityWards.length ? eligibilityWards : null,
      min_age: readNumber(formData, "min_age"),
      min_disability_pct: readNumber(formData, "min_disability_pct"),
      priority_filter: priorityFilter.length ? priorityFilter : null,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/events");
  redirect(`/events/${data.id}`);
}

export async function createUser(formData: FormData) {
  const { profile } = await requireCurrentUser();
  if (profile.role !== "admin") throw new Error("Only admins can create users.");

  const admin = createAdminClient();
  const role = readString(formData, "role");
  const ward = readNumber(formData, "ward_number");
  const fullName = readString(formData, "full_name");
  const phone = readOptionalString(formData, "phone");
  const email = readString(formData, "email");
  const password = readString(formData, "password") || "Password@123";

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role,
      ward_number: role === "admin" ? null : ward,
    },
  });

  if (error) throw new Error(error.message);

  const { error: profileError } = await admin.from("users").upsert({
    id: data.user.id,
    full_name: fullName,
    role,
    ward_number: role === "admin" ? null : ward,
    phone,
    is_active: true,
  });

  if (profileError) throw new Error(profileError.message);
  revalidatePath("/settings");
  redirect("/settings");
}

export async function updateUserWard(formData: FormData) {
  const { profile } = await requireCurrentUser();
  if (profile.role !== "admin") throw new Error("Only admins can assign wards.");

  const admin = createAdminClient();
  const userId = readString(formData, "user_id");
  const role = readString(formData, "role");
  const ward = readNumber(formData, "ward_number");
  const isActive = formData.get("is_active") === "on";

  const { error } = await admin
    .from("users")
    .update({
      role,
      ward_number: role === "admin" ? null : ward,
      is_active: isActive,
    })
    .eq("id", userId);

  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}
