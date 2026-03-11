"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useSupabaseUser } from "@/lib/supabase/useUser";
import { useAppStore } from "@/store/useAppStore";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useSupabaseUser();
  const hydrate = useAppStore((s) => s.hydrate);
  const isAuthenticated = useAppStore((s) => s.auth.isAuthenticated);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL && !isAuthenticated) {
      const path = window.location.pathname + window.location.search;
      router.replace(`/auth/login?redirect=${encodeURIComponent(path)}`);
      return;
    }

    if (!loading && process.env.NEXT_PUBLIC_SUPABASE_URL && !user) {
      const path = window.location.pathname + window.location.search;
      router.replace(`/auth/login?redirect=${encodeURIComponent(path)}`);
    }
  }, [isAuthenticated, loading, router, user]);

  if (loading) return null;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL && !isAuthenticated) return null;
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && !user) return null;

  return <>{children}</>;
}
