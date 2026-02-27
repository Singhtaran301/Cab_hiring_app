export type LoginStep = "credentials" | "otp";

export type PaymentMethodType = "savings" | "credit_card";

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  label: string;
  details: Record<string, string>;
}

export interface LinkedAccount {
  id: string;
  type: "wallet" | "bank" | "card";
  name: string;
  balance: number;
}

export interface WalletState {
  uberBalance: number;
  paymentMethods: PaymentMethod[];
  linkedAccounts: LinkedAccount[];
  transferHistory: Array<{
    id: string;
    ts: number;
    direction: "to_uber" | "from_uber";
    counterparty: string;
    amount: number;
  }>;
}

export interface Promotion {
  id: string;
  code: string;
  title: string;
  description: string;
  discountText: string;
  enrolledAt: number;
}

export interface Profile {
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
}

export interface AuthState {
  isAuthenticated: boolean;
  userId: string | null;
  redirectPath: string | null;
  loginStep: LoginStep;
  pendingUserId: string | null;
}
