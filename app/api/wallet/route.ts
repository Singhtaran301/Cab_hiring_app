import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type DbWalletRow = { uber_balance: number | string };
type DbPaymentMethod = {
  id: string;
  type: "savings" | "credit_card";
  label: string;
  details: Record<string, string> | null;
};
type DbLinkedAccount = {
  id: string;
  type: "wallet" | "bank" | "card";
  name: string;
  balance: number | string;
};
type DbTransfer = {
  id: string;
  direction: "to_uber" | "from_uber";
  counterparty: string;
  amount: number | string;
  created_at: string;
};

type WalletResponse = {
  uberBalance: number;
  paymentMethods: Array<{
    id: string;
    type: "savings" | "credit_card";
    label: string;
    details: Record<string, string>;
  }>;
  linkedAccounts: Array<{
    id: string;
    type: "wallet" | "bank" | "card";
    name: string;
    balance: number;
  }>;
  transferHistory: Array<{
    id: string;
    ts: number;
    direction: "to_uber" | "from_uber";
    counterparty: string;
    amount: number;
  }>;
};

type WalletActionBody =
  | { action: "fund_wallet"; amount: number }
  | { action: "add_payment_method"; type: "savings" | "credit_card"; label: string; details?: Record<string, string> }
  | { action: "link_account"; type: "wallet" | "bank" | "card"; name: string; balance: number }
  | { action: "unlink_account"; linkedAccountId: string }
  | { action: "transfer"; direction: "to_uber" | "from_uber"; linkedAccountId: string; amount: number };

function toMoney(value: number | string | null | undefined): number {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

function asWalletRow(data: unknown): DbWalletRow {
  return (data ?? { uber_balance: 0 }) as DbWalletRow;
}

async function ensureWalletRow(supabase: ReturnType<typeof createSupabaseServerClient>, userId: string) {
  const { data, error } = await supabase.from("wallets").select("uber_balance").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  if (data) return;

  const { error: insertError } = await supabase.from("wallets").insert({ user_id: userId, uber_balance: 2500 });
  if (insertError) throw insertError;

  await supabase.from("payment_methods").insert([
    {
      user_id: userId,
      type: "savings",
      label: "Savings Account **** 1122",
      details: { bank: "Demo Bank", last4: "1122" },
    },
    {
      user_id: userId,
      type: "credit_card",
      label: "Credit Card **** 4242",
      details: { network: "VISA", last4: "4242" },
    },
  ]);

  await supabase.from("linked_accounts").insert([
    { user_id: userId, type: "bank", name: "HDFC Savings", balance: 12000 },
    { user_id: userId, type: "wallet", name: "Paytm Wallet", balance: 800 },
  ]);
}

async function getWalletSnapshot(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  userId: string
): Promise<WalletResponse> {
  await ensureWalletRow(supabase, userId);

  const [{ data: walletRow, error: walletError }, { data: methods, error: methodsError }, { data: linked, error: linkedError }, { data: transfers, error: transfersError }] = await Promise.all([
    supabase.from("wallets").select("uber_balance").eq("user_id", userId).single(),
    supabase.from("payment_methods").select("id, type, label, details").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("linked_accounts").select("id, type, name, balance").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase
      .from("transfers")
      .select("id, direction, counterparty, amount, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  if (walletError) throw walletError;
  if (methodsError) throw methodsError;
  if (linkedError) throw linkedError;
  if (transfersError) throw transfersError;

  return {
    uberBalance: toMoney(asWalletRow(walletRow).uber_balance),
    paymentMethods: ((methods ?? []) as DbPaymentMethod[]).map((m) => ({
      id: m.id,
      type: m.type,
      label: m.label,
      details: m.details ?? {},
    })),
    linkedAccounts: ((linked ?? []) as DbLinkedAccount[]).map((a) => ({
      id: a.id,
      type: a.type,
      name: a.name,
      balance: toMoney(a.balance),
    })),
    transferHistory: ((transfers ?? []) as DbTransfer[]).map((t) => ({
      id: t.id,
      ts: Date.parse(t.created_at),
      direction: t.direction,
      counterparty: t.counterparty,
      amount: toMoney(t.amount),
    })),
  };
}

function isPositiveAmount(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

export async function GET() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const wallet = await getWalletSnapshot(supabase, user.id);
    return NextResponse.json({ wallet });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load wallet";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as WalletActionBody | null;
  if (!body?.action) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

  try {
    await ensureWalletRow(supabase, user.id);

    if (body.action === "fund_wallet") {
      if (!isPositiveAmount(body.amount)) {
        return NextResponse.json({ error: "Enter a valid amount" }, { status: 400 });
      }

      const { data: walletRow, error: walletError } = await supabase
        .from("wallets")
        .select("uber_balance")
        .eq("user_id", user.id)
        .single();
      if (walletError) throw walletError;

      const updatedBalance = toMoney(asWalletRow(walletRow).uber_balance) + body.amount;
      const { error: updateError } = await supabase
        .from("wallets")
        .update({ uber_balance: updatedBalance })
        .eq("user_id", user.id);
      if (updateError) throw updateError;
    }

    if (body.action === "add_payment_method") {
      const label = body.label?.trim();
      if (!label) return NextResponse.json({ error: "Enter label" }, { status: 400 });

      const { error } = await supabase.from("payment_methods").insert({
        user_id: user.id,
        type: body.type,
        label,
        details: body.details ?? {},
      });
      if (error) throw error;
    }

    if (body.action === "link_account") {
      const name = body.name?.trim();
      if (!name) return NextResponse.json({ error: "Enter account name" }, { status: 400 });
      if (!Number.isFinite(body.balance) || body.balance < 0) {
        return NextResponse.json({ error: "Enter valid balance" }, { status: 400 });
      }

      const { error } = await supabase
        .from("linked_accounts")
        .insert({ user_id: user.id, type: body.type, name, balance: body.balance });
      if (error) throw error;
    }

    if (body.action === "unlink_account") {
      if (!body.linkedAccountId) return NextResponse.json({ error: "Missing linked account id" }, { status: 400 });
      const { error } = await supabase
        .from("linked_accounts")
        .delete()
        .eq("id", body.linkedAccountId)
        .eq("user_id", user.id);
      if (error) throw error;
    }

    if (body.action === "transfer") {
      if (!body.linkedAccountId) return NextResponse.json({ error: "Select linked account" }, { status: 400 });
      if (!isPositiveAmount(body.amount)) return NextResponse.json({ error: "Enter valid amount" }, { status: 400 });

      const [{ data: walletRow, error: walletError }, { data: linkedAccount, error: linkedError }] = await Promise.all([
        supabase.from("wallets").select("uber_balance").eq("user_id", user.id).single(),
        supabase
          .from("linked_accounts")
          .select("id, name, balance")
          .eq("id", body.linkedAccountId)
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);

      if (walletError) throw walletError;
      if (linkedError) throw linkedError;
      if (!linkedAccount) return NextResponse.json({ error: "Linked account not found" }, { status: 404 });

      const typedLinkedAccount = linkedAccount as { id: string; name: string; balance: number | string };
      const uberBalance = toMoney(asWalletRow(walletRow).uber_balance);
      const accountBalance = toMoney(typedLinkedAccount.balance);

      let nextUberBalance = uberBalance;
      let nextAccountBalance = accountBalance;

      if (body.direction === "to_uber") {
        if (accountBalance < body.amount) {
          return NextResponse.json({ error: "Insufficient linked account balance" }, { status: 400 });
        }
        nextUberBalance = uberBalance + body.amount;
        nextAccountBalance = accountBalance - body.amount;
      } else {
        if (uberBalance < body.amount) {
          return NextResponse.json({ error: "Insufficient UBER wallet balance" }, { status: 400 });
        }
        nextUberBalance = uberBalance - body.amount;
        nextAccountBalance = accountBalance + body.amount;
      }

      const [{ error: walletUpdateError }, { error: accountUpdateError }, { error: transferError }] = await Promise.all([
        supabase.from("wallets").update({ uber_balance: nextUberBalance }).eq("user_id", user.id),
        supabase.from("linked_accounts").update({ balance: nextAccountBalance }).eq("id", body.linkedAccountId).eq("user_id", user.id),
        supabase.from("transfers").insert({
          user_id: user.id,
          direction: body.direction,
          counterparty: typedLinkedAccount.name,
          amount: body.amount,
        }),
      ]);

      if (walletUpdateError) throw walletUpdateError;
      if (accountUpdateError) throw accountUpdateError;
      if (transferError) throw transferError;
    }

    const wallet = await getWalletSnapshot(supabase, user.id);
    return NextResponse.json({ wallet });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Wallet action failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
