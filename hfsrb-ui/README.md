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

## Local Postgres (docker-compose)

If you want a local database for ETL and testing:

1. Start containers (Postgres + Adminer):

```
pnpm dev:db:up
```

2. Point `DATABASE_URL` at local Postgres when running Drizzle:

```
pnpm drizzle:generate:local
pnpm drizzle:push:local
```

3. Adminer (browser SQL UI) at http://localhost:8080. Use server `db`, user `postgres`, password `postgres`.

4. To stop and remove volumes:

```
pnpm dev:db:down
```

To keep using your remote database for the app, leave `.env.local` as-is and only use the `:local` drizzle scripts for schema changes against the local container.
