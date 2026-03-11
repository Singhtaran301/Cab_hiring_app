"use client";

import { useEffect, useMemo, useState } from "react";

import Header from "@/components/Header";
import RequireAuth from "@/components/RequireAuth";
import { useAppStore } from "@/store/useAppStore";

type DbPromotion = {
  id: string;
  code: string;
  title: string;
  description: string;
  discount_text: string;
  enrolled_at: string;
};

export default function PromotionsPage() {
  const hydrate = useAppStore((s) => s.hydrate);
  const demoPromotions = useAppStore((s) => s.promotions);
  const addPromotion = useAppStore((s) => s.addPromotion);
  const deletePromotion = useAppStore((s) => s.deletePromotion);
  const isDemoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL;

  const [promotions, setPromotions] = useState<DbPromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (isDemoMode) {
      hydrate();
      return;
    }

    let mounted = true;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/promotions", { cache: "no-store" });
        const json = (await res.json().catch(() => null)) as any;

        if (!res.ok) {
          throw new Error(json?.error || "Failed to load promotions");
        }

        if (!mounted) return;
        setPromotions((json?.promotions ?? []) as DbPromotion[]);
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : "Failed to load promotions");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [hydrate, isDemoMode]);

  useEffect(() => {
    if (!isDemoMode) return;
    setPromotions(
      demoPromotions.map((p) => ({
        id: p.id,
        code: p.code,
        title: p.title,
        description: p.description,
        discount_text: p.discountText,
        enrolled_at: new Date(p.enrolledAt).toISOString(),
      }))
    );
    setLoading(false);
  }, [demoPromotions, isDemoMode]);

  const selected = useMemo(
    () => promotions.find((p) => p.id === selectedId) || null,
    [promotions, selectedId]
  );

  return (
    <>
      <Header />
      <RequireAuth>
        <main className="container">
          <div className="grid cols-2">
            <section className="card">
              <h2 className="sectionTitle">Promotion Codes</h2>
              <p className="muted">Manage enrolled promotions: view info, delete, or add and validate.</p>

              {loading ? <p className="muted">Loading...</p> : null}
              {error ? <p style={{ color: "var(--danger)", fontWeight: 800 }}>{error}</p> : null}

              <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                {promotions.map((p) => (
                  <div key={p.id} className="card" style={{ background: "white" }}>
                    <div className="row">
                      <div>
                        <div style={{ fontWeight: 900 }}>{p.code}</div>
                        <div className="muted" style={{ fontSize: 12 }}>
                          {p.discount_text}
                        </div>
                      </div>
                      <div className="row" style={{ justifyContent: "flex-end" }}>
                        <button className="btn" onClick={() => setSelectedId(p.id)}>
                          Details
                        </button>
                        <button
                          className="btn danger"
                          onClick={() => {
                            if (!confirm(`Delete ${p.code}?`)) return;

                            (async () => {
                              if (isDemoMode) {
                                deletePromotion(p.id);
                                setSelectedId((current) => (current === p.id ? null : current));
                                return;
                              }

                              setBusy(true);
                              try {
                                const res = await fetch(`/api/promotions?id=${encodeURIComponent(p.id)}`, {
                                  method: "DELETE",
                                });
                                const json = (await res.json().catch(() => null)) as any;
                                if (!res.ok) throw new Error(json?.error || "Delete failed");

                                setPromotions((prev) => prev.filter((x) => x.id !== p.id));
                                if (selectedId === p.id) setSelectedId(null);
                              } catch (e) {
                                alert(e instanceof Error ? e.message : "Delete failed");
                              } finally {
                                setBusy(false);
                              }
                            })();
                          }}
                          disabled={busy}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="card">
              <h2 className="sectionTitle">Add New Code</h2>

              <div style={{ marginTop: 12 }}>
                <div className="label">Promo Code</div>
                <input className="input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. SAVE10" />
              </div>

              <button
                className="btn primary"
                style={{ marginTop: 12, width: "100%" }}
                onClick={() => {
                  (async () => {
                    if (isDemoMode) {
                      const result = addPromotion(code);
                      if (!result.ok) {
                        alert(result.message || "Add failed");
                        return;
                      }
                      setCode("");
                      alert("Code added");
                      return;
                    }

                    setBusy(true);
                    try {
                      const res = await fetch("/api/promotions", {
                        method: "POST",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify({ code }),
                      });
                      const json = (await res.json().catch(() => null)) as any;
                      if (!res.ok) throw new Error(json?.error || "Invalid code");

                      setPromotions((prev) => [json.promotion as DbPromotion, ...prev]);
                      setCode("");
                      alert("Code added");
                    } catch (e) {
                      alert(e instanceof Error ? e.message : "Add failed");
                    } finally {
                      setBusy(false);
                    }
                  })();
                }}
                disabled={busy}
              >
                Validate & Add
              </button>

              <div className="card" style={{ background: "white", marginTop: 16 }}>
                <div style={{ fontWeight: 900, marginBottom: 8 }}>Selected Promotion</div>
                {!selected ? (
                  <div className="muted">Select a promotion to see details.</div>
                ) : (
                  <div style={{ display: "grid", gap: 6 }}>
                    <div>
                      <span className="muted">Code:</span> <b>{selected.code}</b>
                    </div>
                    <div>
                      <span className="muted">Title:</span> <b>{selected.title}</b>
                    </div>
                    <div>
                      <span className="muted">Description:</span> {selected.description}
                    </div>
                    <div>
                      <span className="muted">Enrolled:</span> {new Date(selected.enrolled_at).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        </main>
      </RequireAuth>
    </>
  );
}
