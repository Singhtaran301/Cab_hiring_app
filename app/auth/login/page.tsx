"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import Header from "@/components/Header";
import { useSupabaseUser } from "@/lib/supabase/useUser";
import { useAppStore } from "@/store/useAppStore";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/wallet";

  const { user, loading, supabase } = useSupabaseUser();
  const hydrate = useAppStore((s) => s.hydrate);
  const auth = useAppStore((s) => s.auth);
  const startLogin = useAppStore((s) => s.startLogin);
  const submitOtp = useAppStore((s) => s.submitOtp);

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("123456");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const isDemoMode = !supabase;

  useEffect(() => {
    if (isDemoMode) hydrate();
  }, [hydrate, isDemoMode]);

  useEffect(() => {
    if (!loading && !isDemoMode && user) {
      router.replace(redirect);
    }
    if (isDemoMode && auth.isAuthenticated) {
      router.replace(redirect);
    }
  }, [auth.isAuthenticated, isDemoMode, loading, redirect, router, user]);

  return (
    <>
      <Header />
      <main className="container">
        <div className="card" style={{ maxWidth: 520, margin: "0 auto" }}>
          <h1 className="sectionTitle">{isDemoMode ? "Demo Login" : "Login"}</h1>
          <p className="muted">
            {isDemoMode
              ? "Supabase is not configured. Use the local demo login flow."
              : "Sign in with email and password. New users can create an account for free."}
          </p>

          {!isDemoMode ? (
            <div className="row" style={{ justifyContent: "flex-start", marginTop: 12 }}>
              <button className={`btn ${mode === "signin" ? "primary" : ""}`} onClick={() => setMode("signin")}>
                Sign in
              </button>
              <button className={`btn ${mode === "signup" ? "primary" : ""}`} onClick={() => setMode("signup")}>
                Sign up
              </button>
            </div>
          ) : null}

          <div style={{ marginTop: 14 }}>
            <div className="label">{isDemoMode ? "User ID" : "Email"}</div>
            <input
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={isDemoMode ? "demo-user" : "you@example.com"}
            />
          </div>

          <div style={{ marginTop: 14 }}>
            <div className="label">Password</div>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="********" />
          </div>

          {isDemoMode && auth.loginStep === "otp" ? (
            <div style={{ marginTop: 14 }}>
              <div className="label">OTP</div>
              <input className="input" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="123456" />
              <p className="muted" style={{ marginTop: 8 }}>
                Demo OTP is `123456`
              </p>
            </div>
          ) : null}

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
                  setError(isDemoMode ? "Enter user ID and password" : "Enter email and password");
                  return;
                }

                setBusy(true);
                try {
                  if (isDemoMode) {
                    if (auth.loginStep === "credentials") {
                      startLogin(email.trim());
                      setInfo("OTP sent. Use 123456.");
                      return;
                    }

                    const result = submitOtp(otp);
                    if (!result.ok) {
                      setError(result.message || "Login failed");
                      return;
                    }
                    router.replace(redirect);
                    return;
                  }

                  if (mode === "signin") {
                    const { error } = await supabase!.auth.signInWithPassword({
                      email: email.trim(),
                      password,
                    });
                    if (error) {
                      setError(error.message);
                      return;
                    }
                    router.replace(redirect);
                    return;
                  }

                  const { error } = await supabase!.auth.signUp({
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
              {isDemoMode ? (auth.loginStep === "credentials" ? "Send OTP" : "Verify OTP") : mode === "signin" ? "Sign in" : "Create account"}
            </button>

            {!isDemoMode ? (
              <button
                className="btn"
                onClick={async () => {
                  if (!email.trim()) {
                    alert("Enter your email first");
                    return;
                  }
                  const { error } = await supabase!.auth.resetPasswordForEmail(email.trim(), {
                    redirectTo: `${window.location.origin}/auth/login`,
                  });
                  if (error) alert(error.message);
                  else alert("Password reset email sent (if the account exists)");
                }}
              >
                Forgot Password
              </button>
            ) : null}
          </div>
        </div>
      </main>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}

