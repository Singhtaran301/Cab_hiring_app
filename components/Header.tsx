"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useSupabaseUser } from "@/lib/supabase/useUser";
import { useAppStore } from "@/store/useAppStore";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const { user, loading, supabase } = useSupabaseUser();
  const hydrate = useAppStore((s) => s.hydrate);
  const localAuth = useAppStore((s) => s.auth);
  const logoutLocal = useAppStore((s) => s.logout);
  const isDemoMode = !supabase;
  const isAuthenticated = isDemoMode ? localAuth.isAuthenticated : !!user;

  useEffect(() => {
    if (isDemoMode) hydrate();
  }, [hydrate, isDemoMode]);

  const navTo = (path: string, requiresAuth: boolean) => {
    if (requiresAuth && !isAuthenticated) {
      router.push(`/auth/login?redirect=${encodeURIComponent(path)}`);
      return;
    }

    router.push(path);
  };

  return (
    <header className="header">
      <div className="headerInner">
        <div className="row" style={{ justifyContent: "flex-start", gap: 12 }}>
          <Link href="/" className="brand">
            Cab Hiring
          </Link>
          <span className="pill muted" style={{ fontSize: 12 }}>
            Web App
          </span>
        </div>

        <nav className="nav" aria-label="Primary">
          <a
            className={`navLink ${pathname === "/wallet" ? "active" : ""}`}
            href={isAuthenticated ? "/wallet" : "#"}
            onClick={(e) => {
              e.preventDefault();
              navTo("/wallet", true);
            }}
          >
            Wallet
          </a>

          <a
            className={`navLink ${pathname === "/promotions" ? "active" : ""}`}
            href={isAuthenticated ? "/promotions" : "#"}
            onClick={(e) => {
              e.preventDefault();
              navTo("/promotions", true);
            }}
          >
            Promotions
          </a>

          <a
            className={`navLink ${pathname === "/profile" ? "active" : ""}`}
            href={isAuthenticated ? "/profile" : "#"}
            onClick={(e) => {
              e.preventDefault();
              navTo("/profile", true);
            }}
          >
            Profile
          </a>

          {!isAuthenticated ? (
            <button className="btn primary" onClick={() => navTo("/auth/login", false)}>
              {isDemoMode ? "Demo Login" : "Login"}
            </button>
          ) : (
            <>
              <span className="pill" style={{ fontSize: 12, fontWeight: 800 }}>
                {isDemoMode ? localAuth.userId ?? "Demo User" : user?.email ?? "User"}
              </span>
              <button
                className="btn"
                disabled={loading}
                onClick={async () => {
                  if (isDemoMode) {
                    logoutLocal();
                    router.push("/");
                    return;
                  }
                  await supabase!.auth.signOut();
                  router.push("/");
                }}
              >
                Logout
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
