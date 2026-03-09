# Cab Hiring App (Sprint-1 Web)

Next.js app with Supabase auth + backend APIs for:
- Login management
- Wallet management (multiple linked accounts + transfers with UBER wallet)
- Promotion codes management
- Profile management with KYC pending statuses

## 1. Local setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` from `.env.example` and set:
```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

3. In Supabase SQL Editor, run:
```sql
-- file: supabase/schema.sql
```

4. Start app:
```bash
npm run dev
```

Open `http://localhost:3000`.

## 2. What is backend-driven now

- `/api/promotions`: list/add/delete promo codes (scoped by logged-in user)
- `/api/wallet`: load wallet, add funds, add payment source, link/unlink account, transfer
- `/api/profile`: load/update profile + KYC pending updates + optional password update

## 3. Deploy (Vercel)

1. Push this repo to GitHub.
2. Import project in Vercel.
3. Add environment variables in Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy.
5. Ensure `supabase/schema.sql` is applied in your Supabase project used by production.

## 4. Pre-deploy verification

Run these commands locally on your machine (with Node.js installed):
```bash
npm install
npm run lint
npm run build
```

Then manually verify:
- Login redirect flow (`/wallet`, `/promotions`, `/profile` while logged out)
- Wallet: add fund source, link account, transfer both directions
- Promotions: add and delete code
- Profile: edit with KYC proof requirement and optional password change

## 5. Notes

- KYC proof upload is currently a mandatory UI/API flag check for sensitive edits; files are not stored in object storage yet.
- This is a functional Sprint-1 implementation, not a payments-grade system.
