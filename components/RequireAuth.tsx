"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useSupabaseUser } from "@/lib/supabase/useUser";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useSupabaseUser();

  useEffect(() => {
    if (!loading && !user) {
      const path = window.location.pathname + window.location.search;
      router.replace(`/auth/login?redirect=${encodeURIComponent(path)}`);
    }
  }, [loading, router, user]);

  if (loading) return null;
  if (!user) return null;

  return <>{children}</>;
}
