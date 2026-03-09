"use client";

import Header from "@/components/Header";

export default function HomePage() {
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
            Login uses real email/password authentication, and wallet/profile/promotions now persist in backend tables.
          </p>
        </div>
      </main>
    </>
  );
}
