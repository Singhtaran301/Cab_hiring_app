"use client";

import { useEffect, useMemo, useState } from "react";

import Header from "@/components/Header";
import RequireAuth from "@/components/RequireAuth";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useAppStore } from "@/store/useAppStore";

type ProfileData = {
  firstName: string;
  lastName: string;
  email: string;
  dob: string;
  address: string;
  preferences: {
    marketingEmails: boolean;
  };
  kyc: {
    nameStatus: "approved" | "pending";
    dobStatus: "approved" | "pending";
    addressStatus: "approved" | "pending";
  };
};

async function parseJson<T>(response: Response): Promise<T | null> {
  return (await response.json().catch(() => null)) as T | null;
}

export default function ProfilePage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const hydrate = useAppStore((s) => s.hydrate);
  const demoProfile = useAppStore((s) => s.profile);
  const updateProfile = useAppStore((s) => s.updateProfile);
  const isDemoMode = !supabase;

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [address, setAddress] = useState("");
  const [marketingEmails, setMarketingEmails] = useState(true);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [idProof, setIdProof] = useState<File | null>(null);
  const [addressProof, setAddressProof] = useState<File | null>(null);

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
        const response = await fetch("/api/profile", { cache: "no-store" });
        const json = await parseJson<{ profile?: ProfileData; error?: string }>(response);
        if (!response.ok) throw new Error(json?.error || "Failed to load profile");
        if (!mounted || !json?.profile) return;
        setProfile(json.profile);
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : "Failed to load profile");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [hydrate, isDemoMode]);

  useEffect(() => {
    if (!isDemoMode) return;
    setProfile(demoProfile as ProfileData);
    setLoading(false);
  }, [demoProfile, isDemoMode]);

  useEffect(() => {
    if (!profile) return;
    setFirstName(profile.firstName);
    setLastName(profile.lastName);
    setDob(profile.dob);
    setAddress(profile.address);
    setMarketingEmails(profile.preferences.marketingEmails);
  }, [profile]);

  const kycSummary = useMemo(() => {
    if (!profile) return [];
    return [
      { label: "Name", status: profile.kyc.nameStatus },
      { label: "DoB", status: profile.kyc.dobStatus },
      { label: "Address", status: profile.kyc.addressStatus },
    ];
  }, [profile]);

  const kycRequired = useMemo(() => {
    const base = profile ?? {
      firstName: "",
      lastName: "",
      dob: "",
      address: "",
    };
    const nameChanged = firstName !== base.firstName || lastName !== base.lastName;
    const dobChanged = dob !== base.dob;
    const addressChanged = address !== base.address;

    return {
      nameChanged,
      dobChanged,
      addressChanged,
      needsIdProof: nameChanged || dobChanged,
      needsAddressProof: addressChanged,
    };
  }, [address, dob, firstName, lastName, profile]);

  const badge = (status: "approved" | "pending") => {
    const bg = status === "approved" ? "#dcfce7" : "#ffedd5";
    const fg = status === "approved" ? "#166534" : "#9a3412";
    return (
      <span style={{ background: bg, color: fg, padding: "4px 8px", borderRadius: 999, fontWeight: 900, fontSize: 12 }}>
        {status.toUpperCase()}
      </span>
    );
  };

  return (
    <>
      <Header />
      <RequireAuth>
        <main className="container">
          {loading ? <p className="muted">Loading profile...</p> : null}
          {error ? <p style={{ color: "var(--danger)", fontWeight: 800 }}>{error}</p> : null}
          {!profile ? null : (
            <div className="grid cols-2">
              <section className="card">
                <h2 className="sectionTitle">Profile</h2>
                <p className="muted">Edit your personal information. Sensitive changes require proof uploads.</p>

                <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                  <div>
                    <div className="label">First name</div>
                    <input className="input" disabled={!editing} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                  </div>
                  <div>
                    <div className="label">Last name</div>
                    <input className="input" disabled={!editing} value={lastName} onChange={(e) => setLastName(e.target.value)} />
                  </div>
                  <div>
                    <div className="label">Email</div>
                    <input className="input" value={profile.email} disabled />
                  </div>
                  <div>
                    <div className="label">DoB</div>
                    <input className="input" disabled={!editing} value={dob} onChange={(e) => setDob(e.target.value)} placeholder="YYYY-MM-DD" />
                  </div>
                  <div>
                    <div className="label">Address</div>
                    <input className="input" disabled={!editing} value={address} onChange={(e) => setAddress(e.target.value)} />
                  </div>

                  {editing ? (
                    <>
                      <div>
                        <div className="label">Current Password</div>
                        <input
                          className="input"
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter current password (optional)"
                        />
                      </div>
                      <div>
                        <div className="label">New Password</div>
                        <input
                          className="input"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password (optional)"
                        />
                      </div>
                    </>
                  ) : null}

                  <div className="row" style={{ justifyContent: "flex-start" }}>
                    <input
                      type="checkbox"
                      checked={marketingEmails}
                      disabled={!editing}
                      onChange={(e) => setMarketingEmails(e.target.checked)}
                    />
                    <span style={{ fontWeight: 800 }}>Receive marketing emails</span>
                  </div>

                  {editing && (kycRequired.needsIdProof || kycRequired.needsAddressProof) ? (
                    <div className="card" style={{ background: "white" }}>
                      <div style={{ fontWeight: 900, marginBottom: 6 }}>KYC Proof Uploads</div>
                      {kycRequired.needsIdProof ? (
                        <div style={{ marginTop: 10 }}>
                          <div className="label">ID Proof (required for Name/DoB)</div>
                          <input type="file" onChange={(e) => setIdProof(e.target.files?.[0] ?? null)} />
                          <div className="muted" style={{ fontSize: 12 }}>
                            {idProof ? `Selected: ${idProof.name}` : "No file selected"}
                          </div>
                        </div>
                      ) : null}

                      {kycRequired.needsAddressProof ? (
                        <div style={{ marginTop: 10 }}>
                          <div className="label">Address Proof (required for Address)</div>
                          <input type="file" onChange={(e) => setAddressProof(e.target.files?.[0] ?? null)} />
                          <div className="muted" style={{ fontSize: 12 }}>
                            {addressProof ? `Selected: ${addressProof.name}` : "No file selected"}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="row" style={{ marginTop: 8, justifyContent: "flex-start" }}>
                    {!editing ? (
                      <button className="btn primary" onClick={() => setEditing(true)}>
                        Edit
                      </button>
                    ) : (
                      <>
                        <button
                          className="btn primary"
                          disabled={busy}
                          onClick={async () => {
                            if (kycRequired.needsIdProof && !idProof) return alert("Upload ID proof for Name/DoB changes");
                            if (kycRequired.needsAddressProof && !addressProof) return alert("Upload address proof for Address changes");
                            if ((currentPassword && !newPassword) || (!currentPassword && newPassword)) {
                              return alert("Enter both current and new password");
                            }
                            if (newPassword && newPassword.length < 8) {
                              return alert("New password must be at least 8 characters");
                            }

                            setBusy(true);
                            setError(null);
                            try {
                              if (isDemoMode) {
                                const affected: Array<"firstName" | "lastName" | "dob" | "address"> = [];
                                if (kycRequired.nameChanged) {
                                  affected.push("firstName", "lastName");
                                }
                                if (kycRequired.dobChanged) affected.push("dob");
                                if (kycRequired.addressChanged) affected.push("address");

                                updateProfile(
                                  {
                                    firstName,
                                    lastName,
                                    dob,
                                    address,
                                    preferences: { marketingEmails },
                                  },
                                  affected
                                );
                                setEditing(false);
                                setIdProof(null);
                                setAddressProof(null);
                                setCurrentPassword("");
                                setNewPassword("");
                                alert("Saved. Fields requiring KYC are now pending.");
                                return;
                              }

                              if (currentPassword && newPassword) {
                                const { error: verifyError } = await supabase!.auth.signInWithPassword({
                                  email: profile.email,
                                  password: currentPassword,
                                });
                                if (verifyError) throw new Error("Current password is incorrect");
                              }

                              const response = await fetch("/api/profile", {
                                method: "PUT",
                                headers: { "content-type": "application/json" },
                                body: JSON.stringify({
                                  firstName,
                                  lastName,
                                  dob,
                                  address,
                                  preferences: { marketingEmails },
                                  idProofUploaded: Boolean(idProof),
                                  addressProofUploaded: Boolean(addressProof),
                                  currentPassword,
                                  newPassword,
                                }),
                              });
                              const json = await parseJson<{ profile?: ProfileData; error?: string }>(response);
                              if (!response.ok) throw new Error(json?.error || "Save failed");
                              if (!json?.profile) throw new Error("Invalid response");

                              setProfile(json.profile);
                              setEditing(false);
                              setIdProof(null);
                              setAddressProof(null);
                              setCurrentPassword("");
                              setNewPassword("");
                              alert("Saved. Fields requiring KYC are now pending.");
                            } catch (e) {
                              const message = e instanceof Error ? e.message : "Save failed";
                              setError(message);
                              alert(message);
                            } finally {
                              setBusy(false);
                            }
                          }}
                        >
                          Save
                        </button>
                        <button
                          className="btn"
                          disabled={busy}
                          onClick={() => {
                            setEditing(false);
                            setFirstName(profile.firstName);
                            setLastName(profile.lastName);
                            setDob(profile.dob);
                            setAddress(profile.address);
                            setMarketingEmails(profile.preferences.marketingEmails);
                            setIdProof(null);
                            setAddressProof(null);
                            setCurrentPassword("");
                            setNewPassword("");
                          }}
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </section>

              <section className="card">
                <h2 className="sectionTitle">KYC Status</h2>
                <p className="muted">If a field is changed, it becomes pending approval.</p>

                <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                  {kycSummary.map((item) => (
                    <div key={item.label} className="row" style={{ justifyContent: "space-between" }}>
                      <div style={{ fontWeight: 900 }}>{item.label}</div>
                      {badge(item.status)}
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </main>
      </RequireAuth>
    </>
  );
}
