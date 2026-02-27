"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import Header from "@/components/Header";
import { useSupabaseUser } from "@/lib/supabase/useUser";

export default function LoginPage() {
  const router = useRouter();

  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");

  const { user, loading, supabase } = useSupabaseUser();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const targetPath = useMemo(() => redirect || "/wallet", [redirect]);

  useEffect(() => {
    if (!loading && user) {
      router.replace(targetPath);
    }
  }, [loading, router, targetPath, user]);

  return (
    <>
      <Header />
      <main className="container">
        <div className="card" style={{ maxWidth: 520, margin: "0 auto" }}>
          <h1 className="sectionTitle">Login</h1>
          <p className="muted">
            Sign in with email and password. New users can create an account for free.
          </p>

          <div className="row" style={{ justifyContent: "flex-start", marginTop: 12 }}>
            <button className={`btn ${mode === "signin" ? "primary" : ""}`} onClick={() => setMode("signin")}>
              Sign in
            </button>
            <button className={`btn ${mode === "signup" ? "primary" : ""}`} onClick={() => setMode("signup")}>
              Sign up
            </button>
          </div>

          <div style={{ marginTop: 14 }}>
            <div className="label">Email</div>
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>

          <div style={{ marginTop: 14 }}>
            <div className="label">Password</div>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>

          {error ? <p style={{ color: "var(--danger)", marginTop: 12, fontWeight: 800 }}>{error}</p> : null}
          {info ? <p style={{ color: "var(--success)", marginTop: 12, fontWeight: 800 }}>{info}</p> : null}

          <div className="row" style={{ marginTop: 16, justifyContent: "flex-start" }}>
            <button
              className="btn primary"
              disabled={busy || loading}
              onClick={async () => {
                setError(null);
                setInfo(null);

                if (!email.trim() || !password.trim()) {
                  setError("Enter email and password");
                  return;
                }

                setBusy(true);
                try {
                  if (mode === "signin") {
                    const { error } = await supabase.auth.signInWithPassword({
                      email: email.trim(),
                      password,
                    });
                    if (error) {
                      setError(error.message);
                      return;
                    }
                    router.replace(targetPath);
                    return;
                  }

                  const { error } = await supabase.auth.signUp({
                    email: email.trim(),
                    password,
                  });
                  if (error) {
                    setError(error.message);
                    return;
                  }
                  setInfo("Account created. If email confirmations are enabled, check your inbox.");
                } finally {
                  setBusy(false);
                }
              }}
            >
              {mode === "signin" ? "Sign in" : "Create account"}
            </button>

            <button
              className="btn"
              onClick={async () => {
                if (!email.trim()) {
                  alert("Enter your email first");
                  return;
                }
                const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
                  redirectTo: `${window.location.origin}/auth/login`,
                });
                if (error) alert(error.message);
                else alert("Password reset email sent (if the account exists)");
              }}
            >
              Forgot Password
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
