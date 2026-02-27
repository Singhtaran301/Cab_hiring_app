import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

function isValidCode(code: string) {
  return /^[A-Z0-9]{5,12}$/.test(code);
}

export async function GET() {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 401 });
  }
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("promotions")
    .select("id, code, title, description, discount_text, enrolled_at")
    .order("enrolled_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ promotions: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as null | { code?: string };
  const cleaned = (body?.code ?? "").trim().toUpperCase();

  if (!cleaned) {
    return NextResponse.json({ error: "Enter a promo code" }, { status: 400 });
  }
  if (!isValidCode(cleaned)) {
    return NextResponse.json({ error: "Invalid format (use 5-12 alphanumerics)" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("promotions")
    .select("id")
    .eq("code", cleaned)
    .maybeSingle();

  if (existing?.id) {
    return NextResponse.json({ error: "Code already added" }, { status: 409 });
  }

  const payload = {
    user_id: user.id,
    code: cleaned,
    title: `Promo ${cleaned}`,
    description: "Validated promotion code.",
    discount_text: "Applied at checkout",
    enrolled_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("promotions")
    .insert(payload)
    .select("id, code, title, description, discount_text, enrolled_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ promotion: data }, { status: 201 });
}

export async function DELETE(request: Request) {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const { error } = await supabase.from("promotions").delete().eq("id", id).eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
