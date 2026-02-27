"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useSupabaseUser } from "@/lib/supabase/useUser";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const { user, loading, supabase } = useSupabaseUser();
  const isAuthenticated = !!user;

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
              Login
            </button>
          ) : (
            <>
              <span className="pill" style={{ fontSize: 12, fontWeight: 800 }}>
                {user?.email ?? "User"}
              </span>
              <button
                className="btn"
                disabled={loading}
                onClick={async () => {
                  await supabase.auth.signOut();
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
