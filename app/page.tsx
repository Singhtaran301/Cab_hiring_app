"use client";

import { useEffect } from "react";

import Header from "@/components/Header";
import { useAppStore } from "@/store/useAppStore";

export default function HomePage() {
  const hydrate = useAppStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <>
      <Header />
      <main className="container">
        <div className="card">
          <h1 className="sectionTitle">Welcome</h1>
          <p className="muted">
            This is the web-only Sprint-1 app. Use the header to open Wallet, Promotions, and Profile.
          </p>
          <p className="muted">
            Login uses real email/password authentication.
          </p>
        </div>
      </main>
    </>
  );
}
