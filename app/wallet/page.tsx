"use client";

import { useEffect, useMemo, useState } from "react";

import Header from "@/components/Header";
import RequireAuth from "@/components/RequireAuth";
import { useAppStore } from "@/store/useAppStore";

export default function WalletPage() {
  const hydrate = useAppStore((s) => s.hydrate);
  const wallet = useAppStore((s) => s.wallet);
  const fundUberWallet = useAppStore((s) => s.fundUberWallet);
  const addPaymentMethod = useAppStore((s) => s.addPaymentMethod);
  const linkAccount = useAppStore((s) => s.linkAccount);
  const unlinkAccount = useAppStore((s) => s.unlinkAccount);
  const transfer = useAppStore((s) => s.transfer);

  const [fundAmount, setFundAmount] = useState("500");
  const [newPmLabel, setNewPmLabel] = useState("");
  const [newPmType, setNewPmType] = useState<"savings" | "credit_card">("savings");
  const [newAccountName, setNewAccountName] = useState("");
  const [newAccountType, setNewAccountType] = useState<"wallet" | "bank" | "card">("bank");
  const [newAccountBalance, setNewAccountBalance] = useState("1000");
  const [transferDirection, setTransferDirection] = useState<"to_uber" | "from_uber">("to_uber");
  const [selectedLinkedAccount, setSelectedLinkedAccount] = useState<string>("");
  const [transferAmount, setTransferAmount] = useState("100");

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const linkedOptions = useMemo(() => wallet.linkedAccounts, [wallet.linkedAccounts]);

  return (
    <>
      <Header />
      <RequireAuth>
        <main className="container">
          <div className="grid cols-2">
            <section className="card">
              <h2 className="sectionTitle">Primary Wallet (UBER)</h2>
              <div className="row">
                <div>
                  <div className="muted">Available balance</div>
                  <div style={{ fontSize: 28, fontWeight: 900 }}>₹ {wallet.uberBalance.toFixed(2)}</div>
                </div>
                <div style={{ minWidth: 260 }}>
                  <div className="label">Fund Amount</div>
                  <input className="input" value={fundAmount} onChange={(e) => setFundAmount(e.target.value)} />
                  <button
                    className="btn primary"
                    style={{ marginTop: 10, width: "100%" }}
                    onClick={() => {
                      const amt = Number(fundAmount);
                      if (!Number.isFinite(amt) || amt <= 0) {
                        alert("Enter valid amount");
                        return;
                      }
                      fundUberWallet(amt);
                    }}
                  >
                    Add Funds
                  </button>
                </div>
              </div>
            </section>

            <section className="card">
              <h2 className="sectionTitle">Saved Sources of Funds</h2>
              <div className="muted">Use these sources to fund (demo: no actual payment processing).</div>
              <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                {wallet.paymentMethods.map((pm) => (
                  <div key={pm.id} className="card" style={{ background: "white" }}>
                    <div className="row">
                      <div>
                        <div style={{ fontWeight: 800 }}>{pm.label}</div>
                        <div className="muted" style={{ fontSize: 12 }}>
                          Type: {pm.type}
                        </div>
                      </div>
                      <button
                        className="btn"
                        onClick={() => {
                          const amt = Number(fundAmount);
                          if (!Number.isFinite(amt) || amt <= 0) {
                            alert("Enter valid amount");
                            return;
                          }
                          fundUberWallet(amt);
                        }}
                      >
                        Fund from this
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 16 }}>
                <h3 className="sectionTitle" style={{ fontSize: 16 }}>
                  Add New Source
                </h3>

                <div className="grid">
                  <div>
                    <div className="label">Type</div>
                    <select className="input" value={newPmType} onChange={(e) => setNewPmType(e.target.value as any)}>
                      <option value="savings">Savings Account</option>
                      <option value="credit_card">Credit Card</option>
                    </select>
                  </div>
                  <div>
                    <div className="label">Label</div>
                    <input className="input" value={newPmLabel} onChange={(e) => setNewPmLabel(e.target.value)} placeholder="e.g. SBI Savings •••• 7788" />
                  </div>

                  <button
                    className="btn"
                    onClick={() => {
                      if (!newPmLabel.trim()) {
                        alert("Enter label");
                        return;
                      }
                      addPaymentMethod(newPmLabel.trim(), newPmType, { note: "Saved from web" });
                      setNewPmLabel("");
                    }}
                  >
                    Save Source
                  </button>
                </div>
              </div>
            </section>

            <section className="card">
              <h2 className="sectionTitle">Linked Accounts</h2>
              <div className="muted">Link multiple accounts and transfer funds between them and UBER wallet.</div>

              <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                {wallet.linkedAccounts.map((a) => (
                  <div key={a.id} className="card" style={{ background: "white" }}>
                    <div className="row">
                      <div>
                        <div style={{ fontWeight: 900 }}>{a.name}</div>
                        <div className="muted" style={{ fontSize: 12 }}>
                          {a.type} • Balance ₹ {a.balance.toFixed(2)}
                        </div>
                      </div>
                      <button
                        className="btn danger"
                        onClick={() => {
                          if (confirm("Unlink this account?")) unlinkAccount(a.id);
                        }}
                      >
                        Unlink
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 16 }}>
                <h3 className="sectionTitle" style={{ fontSize: 16 }}>
                  Link New Account
                </h3>

                <div className="grid">
                  <div>
                    <div className="label">Type</div>
                    <select className="input" value={newAccountType} onChange={(e) => setNewAccountType(e.target.value as any)}>
                      <option value="bank">Bank</option>
                      <option value="wallet">Wallet</option>
                      <option value="card">Card</option>
                    </select>
                  </div>
                  <div>
                    <div className="label">Name</div>
                    <input className="input" value={newAccountName} onChange={(e) => setNewAccountName(e.target.value)} placeholder="e.g. ICICI Savings" />
                  </div>
                  <div>
                    <div className="label">Initial Balance</div>
                    <input className="input" value={newAccountBalance} onChange={(e) => setNewAccountBalance(e.target.value)} />
                  </div>

                  <button
                    className="btn"
                    onClick={() => {
                      const bal = Number(newAccountBalance);
                      if (!newAccountName.trim()) return alert("Enter name");
                      if (!Number.isFinite(bal) || bal < 0) return alert("Enter valid balance");
                      linkAccount(newAccountName.trim(), newAccountType, bal);
                      setNewAccountName("");
                    }}
                  >
                    Link Account
                  </button>
                </div>
              </div>
            </section>

            <section className="card">
              <h2 className="sectionTitle">Fund Transfer</h2>

              <div className="grid">
                <div>
                  <div className="label">Direction</div>
                  <select className="input" value={transferDirection} onChange={(e) => setTransferDirection(e.target.value as any)}>
                    <option value="to_uber">To UBER wallet (from linked)</option>
                    <option value="from_uber">From UBER wallet (to linked)</option>
                  </select>
                </div>

                <div>
                  <div className="label">Linked account</div>
                  <select className="input" value={selectedLinkedAccount} onChange={(e) => setSelectedLinkedAccount(e.target.value)}>
                    <option value="">Select</option>
                    {linkedOptions.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} (₹ {a.balance.toFixed(0)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="label">Amount</div>
                  <input className="input" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} />
                </div>

                <button
                  className="btn primary"
                  onClick={() => {
                    const amt = Number(transferAmount);
                    const res = transfer(transferDirection, selectedLinkedAccount, amt);
                    if (!res.ok) alert(res.message || "Transfer failed");
                    else alert("Transfer successful");
                  }}
                >
                  Transfer
                </button>

                <div className="card" style={{ background: "white" }}>
                  <div style={{ fontWeight: 900, marginBottom: 8 }}>Transfer History</div>
                  {wallet.transferHistory.length === 0 ? (
                    <div className="muted">No transfers yet.</div>
                  ) : (
                    <div style={{ display: "grid", gap: 8 }}>
                      {wallet.transferHistory.slice(0, 5).map((tx) => (
                        <div key={tx.id} className="row" style={{ alignItems: "flex-start" }}>
                          <div>
                            <div style={{ fontWeight: 800 }}>
                              {tx.direction === "to_uber" ? "Linked → UBER" : "UBER → Linked"}
                            </div>
                            <div className="muted" style={{ fontSize: 12 }}>
                              {new Date(tx.ts).toLocaleString()} • {tx.counterparty}
                            </div>
                          </div>
                          <div style={{ fontWeight: 900 }}>₹ {tx.amount.toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        </main>
      </RequireAuth>
    </>
  );
}
