"use client";

import { create } from "zustand";

import { loadFromStorage, saveToStorage } from "@/lib/storage";
import type { AuthState, Profile, Promotion, WalletState } from "@/lib/types";

const STORAGE_KEY = "cab_hiring_web_v1";

type AppSnapshot = {
  auth: AuthState;
  wallet: WalletState;
  promotions: Promotion[];
  profile: Profile;
};

function defaultSnapshot(): AppSnapshot {
  return {
    auth: {
      isAuthenticated: false,
      userId: null,
      redirectPath: null,
      loginStep: "credentials",
      pendingUserId: null,
    },
    wallet: {
      uberBalance: 2500,
      paymentMethods: [
        {
          id: "pm_1",
          type: "savings",
          label: "Savings Account •••• 1122",
          details: { bank: "Demo Bank", last4: "1122" },
        },
        {
          id: "pm_2",
          type: "credit_card",
          label: "Credit Card •••• 4242",
          details: { network: "VISA", last4: "4242" },
        },
      ],
      linkedAccounts: [
        { id: "la_1", type: "bank", name: "HDFC Savings", balance: 12000 },
        { id: "la_2", type: "wallet", name: "Paytm Wallet", balance: 800 },
      ],
      transferHistory: [],
    },
    promotions: [
      {
        id: "promo_1",
        code: "WELCOME50",
        title: "Welcome Offer",
        description: "50% off on your first ride up to ₹100.",
        discountText: "50% up to ₹100",
        enrolledAt: Date.now(),
      },
    ],
    profile: {
      firstName: "Utkarsh",
      lastName: "User",
      email: "user@example.com",
      dob: "1999-01-01",
      address: "221B Baker Street",
      preferences: { marketingEmails: true },
      kyc: {
        nameStatus: "approved",
        dobStatus: "approved",
        addressStatus: "approved",
      },
    },
  };
}

function loadSnapshot(): AppSnapshot {
  return loadFromStorage<AppSnapshot>(STORAGE_KEY, defaultSnapshot());
}

function persist(snapshot: AppSnapshot) {
  saveToStorage(STORAGE_KEY, snapshot);
}

type Actions = {
  hydrate: () => void;

  setRedirectPath: (path: string | null) => void;

  startLogin: (userId: string) => void;
  submitOtp: (otp: string) => { ok: boolean; message?: string };
  logout: () => void;

  fundUberWallet: (amount: number) => void;
  addPaymentMethod: (label: string, type: "savings" | "credit_card", details: Record<string, string>) => void;
  linkAccount: (name: string, type: "wallet" | "bank" | "card", balance: number) => void;
  unlinkAccount: (id: string) => void;
  transfer: (direction: "to_uber" | "from_uber", linkedAccountId: string, amount: number) => { ok: boolean; message?: string };

  addPromotion: (code: string) => { ok: boolean; message?: string };
  deletePromotion: (id: string) => void;

  updateProfile: (partial: Partial<Profile>, kycAffectedFields?: Array<"firstName" | "lastName" | "dob" | "address">) => void;
};

export const useAppStore = create<AppSnapshot & Actions>((set, get) => ({
  ...defaultSnapshot(),

  hydrate: () => {
    const snap = loadSnapshot();
    set(snap);
  },

  setRedirectPath: (path) => {
    set((s) => {
      const auth = { ...s.auth, redirectPath: path };
      persist({ ...pickSnapshot(s), auth });
      return { auth };
    });
  },

  startLogin: (userId) => {
    set((s) => {
      const auth = {
        ...s.auth,
        loginStep: "otp" as const,
        pendingUserId: userId,
      };
      persist({ ...pickSnapshot(s), auth });
      return { auth };
    });
  },

  submitOtp: (otp) => {
    if (!otp.trim()) return { ok: false, message: "Please enter OTP" };
    if (otp.trim() !== "123456") return { ok: false, message: "Invalid OTP. Try 123456." };

    const state = get();
    const userId = state.auth.pendingUserId ?? "user";

    set((s) => {
      const auth = {
        ...s.auth,
        isAuthenticated: true,
        userId,
        loginStep: "credentials" as const,
        pendingUserId: null,
      };
      persist({ ...pickSnapshot(s), auth });
      return { auth };
    });

    return { ok: true };
  },

  logout: () => {
    set((s) => {
      const auth = {
        ...s.auth,
        isAuthenticated: false,
        userId: null,
        loginStep: "credentials" as const,
        pendingUserId: null,
      };
      persist({ ...pickSnapshot(s), auth });
      return { auth };
    });
  },

  fundUberWallet: (amount) => {
    if (!Number.isFinite(amount) || amount <= 0) return;

    set((s) => {
      const wallet = {
        ...s.wallet,
        uberBalance: s.wallet.uberBalance + amount,
      };
      persist({ ...pickSnapshot(s), wallet });
      return { wallet };
    });
  },

  addPaymentMethod: (label, type, details) => {
    set((s) => {
      const wallet = {
        ...s.wallet,
        paymentMethods: [
          ...s.wallet.paymentMethods,
          {
            id: `pm_${Date.now()}`,
            type,
            label,
            details,
          },
        ],
      };
      persist({ ...pickSnapshot(s), wallet });
      return { wallet };
    });
  },

  linkAccount: (name, type, balance) => {
    set((s) => {
      const wallet = {
        ...s.wallet,
        linkedAccounts: [
          ...s.wallet.linkedAccounts,
          { id: `la_${Date.now()}`, name, type, balance },
        ],
      };
      persist({ ...pickSnapshot(s), wallet });
      return { wallet };
    });
  },

  unlinkAccount: (id) => {
    set((s) => {
      const wallet = {
        ...s.wallet,
        linkedAccounts: s.wallet.linkedAccounts.filter((a) => a.id !== id),
      };
      persist({ ...pickSnapshot(s), wallet });
      return { wallet };
    });
  },

  transfer: (direction, linkedAccountId, amount) => {
    if (!Number.isFinite(amount) || amount <= 0) {
      return { ok: false, message: "Enter a valid amount" };
    }

    const state = get();
    const account = state.wallet.linkedAccounts.find((a) => a.id === linkedAccountId);
    if (!account) return { ok: false, message: "Select a linked account" };

    if (direction === "to_uber") {
      if (account.balance < amount) return { ok: false, message: "Insufficient linked account balance" };

      set((s) => {
        const wallet = {
          ...s.wallet,
          uberBalance: s.wallet.uberBalance + amount,
          linkedAccounts: s.wallet.linkedAccounts.map((a) =>
            a.id === linkedAccountId ? { ...a, balance: a.balance - amount } : a
          ),
          transferHistory: [
            {
              id: `tx_${Date.now()}`,
              ts: Date.now(),
              direction,
              counterparty: account.name,
              amount,
            },
            ...s.wallet.transferHistory,
          ],
        };
        persist({ ...pickSnapshot(s), wallet });
        return { wallet };
      });

      return { ok: true };
    }

    if (state.wallet.uberBalance < amount) return { ok: false, message: "Insufficient UBER wallet balance" };

    set((s) => {
      const wallet = {
        ...s.wallet,
        uberBalance: s.wallet.uberBalance - amount,
        linkedAccounts: s.wallet.linkedAccounts.map((a) =>
          a.id === linkedAccountId ? { ...a, balance: a.balance + amount } : a
        ),
        transferHistory: [
          {
            id: `tx_${Date.now()}`,
            ts: Date.now(),
            direction,
            counterparty: account.name,
            amount,
          },
          ...s.wallet.transferHistory,
        ],
      };
      persist({ ...pickSnapshot(s), wallet });
      return { wallet };
    });

    return { ok: true };
  },

  addPromotion: (code) => {
    const cleaned = code.trim().toUpperCase();
    if (!cleaned) return { ok: false, message: "Enter a promo code" };

    const isValid = /^[A-Z0-9]{5,12}$/.test(cleaned);
    if (!isValid) return { ok: false, message: "Invalid format (use 5-12 alphanumerics)" };

    const exists = get().promotions.some((p) => p.code === cleaned);
    if (exists) return { ok: false, message: "Code already added" };

    const promo = {
      id: `promo_${Date.now()}`,
      code: cleaned,
      title: `Promo ${cleaned}`,
      description: "Validated promotion code.",
      discountText: "Applied at checkout",
      enrolledAt: Date.now(),
    };

    set((s) => {
      const promotions = [promo, ...s.promotions];
      persist({ ...pickSnapshot(s), promotions });
      return { promotions };
    });

    return { ok: true };
  },

  deletePromotion: (id) => {
    set((s) => {
      const promotions = s.promotions.filter((p) => p.id !== id);
      persist({ ...pickSnapshot(s), promotions });
      return { promotions };
    });
  },

  updateProfile: (partial, kycAffectedFields = []) => {
    set((s) => {
      const kyc = { ...s.profile.kyc };

      if (kycAffectedFields.includes("firstName") || kycAffectedFields.includes("lastName")) {
        kyc.nameStatus = "pending";
      }
      if (kycAffectedFields.includes("dob")) {
        kyc.dobStatus = "pending";
      }
      if (kycAffectedFields.includes("address")) {
        kyc.addressStatus = "pending";
      }

      const profile = {
        ...s.profile,
        ...partial,
        kyc,
      };
      persist({ ...pickSnapshot(s), profile });
      return { profile };
    });
  },
}));

function pickSnapshot(state: AppSnapshot & Actions): AppSnapshot {
  return {
    auth: state.auth,
    wallet: state.wallet,
    promotions: state.promotions,
    profile: state.profile,
  };
}
