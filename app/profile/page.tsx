"use client";

import { useEffect, useMemo, useState } from "react";

import Header from "@/components/Header";
import RequireAuth from "@/components/RequireAuth";
import { useAppStore } from "@/store/useAppStore";

export default function ProfilePage() {
  const hydrate = useAppStore((s) => s.hydrate);
  const profile = useAppStore((s) => s.profile);
  const updateProfile = useAppStore((s) => s.updateProfile);

  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName);
  const [dob, setDob] = useState(profile.dob);
  const [address, setAddress] = useState(profile.address);
  const [marketingEmails, setMarketingEmails] = useState(profile.preferences.marketingEmails);

  const [idProof, setIdProof] = useState<File | null>(null);
  const [addressProof, setAddressProof] = useState<File | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    setFirstName(profile.firstName);
    setLastName(profile.lastName);
    setDob(profile.dob);
    setAddress(profile.address);
    setMarketingEmails(profile.preferences.marketingEmails);
  }, [profile]);

  const kycSummary = useMemo(() => {
    const entries = [
      { label: "Name", status: profile.kyc.nameStatus },
      { label: "DoB", status: profile.kyc.dobStatus },
      { label: "Address", status: profile.kyc.addressStatus },
    ];

    return entries;
  }, [profile.kyc]);

  const kycRequired = useMemo(() => {
    const nameChanged = firstName !== profile.firstName || lastName !== profile.lastName;
    const dobChanged = dob !== profile.dob;
    const addressChanged = address !== profile.address;

    return {
      nameChanged,
      dobChanged,
      addressChanged,
      needsIdProof: nameChanged || dobChanged,
      needsAddressProof: addressChanged,
    };
  }, [address, dob, firstName, lastName, profile.address, profile.dob, profile.firstName, profile.lastName]);

  const badge = (status: string) => {
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
                  <div className="label">DoB</div>
                  <input className="input" disabled={!editing} value={dob} onChange={(e) => setDob(e.target.value)} placeholder="YYYY-MM-DD" />
                </div>
                <div>
                  <div className="label">Address</div>
                  <input className="input" disabled={!editing} value={address} onChange={(e) => setAddress(e.target.value)} />
                </div>

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
                        onClick={() => {
                          if (kycRequired.needsIdProof && !idProof) {
                            alert("Upload ID proof for Name/DoB changes");
                            return;
                          }
                          if (kycRequired.needsAddressProof && !addressProof) {
                            alert("Upload address proof for Address changes");
                            return;
                          }

                          const affected: Array<"firstName" | "lastName" | "dob" | "address"> = [];
                          if (kycRequired.nameChanged) {
                            affected.push("firstName");
                            affected.push("lastName");
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
                          alert("Saved. Fields requiring KYC are now pending.");
                        }}
                      >
                        Save
                      </button>
                      <button
                        className="btn"
                        onClick={() => {
                          setEditing(false);
                          setFirstName(profile.firstName);
                          setLastName(profile.lastName);
                          setDob(profile.dob);
                          setAddress(profile.address);
                          setMarketingEmails(profile.preferences.marketingEmails);
                          setIdProof(null);
                          setAddressProof(null);
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
                {kycSummary.map((s) => (
                  <div key={s.label} className="row" style={{ justifyContent: "space-between" }}>
                    <div style={{ fontWeight: 900 }}>{s.label}</div>
                    {badge(s.status)}
                  </div>
                ))}
              </div>

              <div className="card" style={{ background: "white", marginTop: 16 }}>
                <div style={{ fontWeight: 900, marginBottom: 8 }}>Password</div>
                <div className="muted">Password change is a placeholder in this web demo.</div>
                <button className="btn" style={{ marginTop: 10 }} onClick={() => alert("Change password placeholder")}
                >
                  Change Password
                </button>
              </div>
            </section>
          </div>
        </main>
      </RequireAuth>
    </>
  );
}
