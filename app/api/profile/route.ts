import { NextResponse } from "next/server";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type DbProfile = {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  dob: string;
  address: string;
  marketing_emails: boolean;
  kyc_name_status: "approved" | "pending";
  kyc_dob_status: "approved" | "pending";
  kyc_address_status: "approved" | "pending";
};

type ProfileResponse = {
  firstName: string;
  lastName: string;
  email: string;
  dob: string;
  address: string;
  preferences: {
    marketingEmails: boolean;
  };
  kyc: {
    nameStatus: "approved" | "pending";
    dobStatus: "approved" | "pending";
    addressStatus: "approved" | "pending";
  };
};

type UpdateBody = {
  firstName: string;
  lastName: string;
  dob: string;
  address: string;
  preferences: { marketingEmails: boolean };
  idProofUploaded?: boolean;
  addressProofUploaded?: boolean;
  currentPassword?: string;
  newPassword?: string;
};

function mapProfile(row: DbProfile): ProfileResponse {
  return {
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    dob: row.dob,
    address: row.address,
    preferences: {
      marketingEmails: row.marketing_emails,
    },
    kyc: {
      nameStatus: row.kyc_name_status,
      dobStatus: row.kyc_dob_status,
      addressStatus: row.kyc_address_status,
    },
  };
}

function toDbProfile(data: unknown): DbProfile {
  return data as DbProfile;
}

async function getOrCreateProfile(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  userId: string,
  email: string
): Promise<DbProfile> {
  const { data, error } = await supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  if (data) return toDbProfile(data);

  const payload = {
    user_id: userId,
    first_name: "Utkarsh",
    last_name: "User",
    email,
    dob: "1999-01-01",
    address: "221B Baker Street",
    marketing_emails: true,
    kyc_name_status: "approved",
    kyc_dob_status: "approved",
    kyc_address_status: "approved",
  };

  const { data: inserted, error: insertError } = await supabase.from("profiles").insert(payload).select("*").single();
  if (insertError) throw insertError;
  return toDbProfile(inserted);
}

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const profile = await getOrCreateProfile(supabase, user.id, user.email ?? "user@example.com");
    return NextResponse.json({ profile: mapProfile(profile) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as UpdateBody | null;
  if (!body) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

  try {
    const current = await getOrCreateProfile(supabase, user.id, user.email ?? "user@example.com");

    const firstName = body.firstName?.trim();
    const lastName = body.lastName?.trim();
    const dob = body.dob?.trim();
    const address = body.address?.trim();
    if (!firstName || !lastName || !dob || !address) {
      return NextResponse.json({ error: "Missing required profile fields" }, { status: 400 });
    }

    const nameChanged = firstName !== current.first_name || lastName !== current.last_name;
    const dobChanged = dob !== current.dob;
    const addressChanged = address !== current.address;

    if ((nameChanged || dobChanged) && !body.idProofUploaded) {
      return NextResponse.json({ error: "Upload ID proof for Name/DoB changes" }, { status: 400 });
    }
    if (addressChanged && !body.addressProofUploaded) {
      return NextResponse.json({ error: "Upload address proof for Address changes" }, { status: 400 });
    }

    const currentPassword = body.currentPassword?.trim() ?? "";
    const newPassword = body.newPassword?.trim() ?? "";

    if (currentPassword || newPassword) {
      if (!currentPassword || !newPassword) {
        return NextResponse.json({ error: "Enter both current and new password" }, { status: 400 });
      }
      if (newPassword.length < 8) {
        return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });
      }

      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email ?? "",
        password: currentPassword,
      });
      if (verifyError) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
      }

      const { error: updatePasswordError } = await supabase.auth.updateUser({ password: newPassword });
      if (updatePasswordError) {
        return NextResponse.json({ error: updatePasswordError.message }, { status: 400 });
      }
    }

    const payload = {
      first_name: firstName,
      last_name: lastName,
      dob,
      address,
      marketing_emails: Boolean(body.preferences?.marketingEmails),
      kyc_name_status: nameChanged ? "pending" : current.kyc_name_status,
      kyc_dob_status: dobChanged ? "pending" : current.kyc_dob_status,
      kyc_address_status: addressChanged ? "pending" : current.kyc_address_status,
    };

    const { data, error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("user_id", user.id)
      .select("*")
      .single();
    if (error) throw error;

    return NextResponse.json({ profile: mapProfile(toDbProfile(data)) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
