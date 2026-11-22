This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Supabase accounts and saves

1. Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SECRET_KEY` to `.env.local`. The secret key is server-only and must never use a `NEXT_PUBLIC_` prefix.
2. Run `supabase/schema.sql` in the Supabase SQL Editor. Registered accounts are listed in Supabase Auth and mirrored into the `public.profiles` table; the SQL also backfills existing users.
3. Use `/register` and `/login` for player accounts. To sign in immediately after registration without email verification, open your Supabase project's Auth settings and turn off **Confirm email** for the Email provider. This setting is controlled by Supabase, not by the app.
4. To grant admin access, insert the user's auth ID into `public.user_roles` with role `admin` using the example SQL at the end of `supabase/schema.sql`.
5. Signed-in users can open `/admin` to view account status and enable or disable non-admin accounts.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
