# chefondemand-platform
Piattaforma full-stack per Chef On Demand.

🎯 Obiettivo (MVP)
Raccolta richieste/booking, invio proposte, chat cliente-chef.

Aree riservate: Cliente e Chef.

Admin interno: pipeline richieste, calendario, statistiche.

Tracking (GTM/GA4/Clarity/Meta Pixel) conforme GDPR.

🏗️ Architettura
Monorepo con Turborepo:

bash
Copy
Edit
chefondemand-platform/
  apps/
    web/            # Next.js 15 + TypeScript (App Router)
    api/            # Express.js + TypeScript (REST)
  packages/
    ui/             # libreria componenti (shadcn/ui, Tailwind)
    types/          # tipi condivisi (DTO, zod schemas)
    config/         # eslint, prettier, tsconfig, tailwind share
    utils/          # helpers condivisi
  db/
    prisma/         # schema.prisma, migrations, seed
  .github/workflows # CI (lint/test/build)
  turbo.json
  package.json      # pnpm workspaces
  tsconfig.base.json
  README.md
Stack Tecnologico
Frontend: Next.js 15 (App Router, RSC), React 18, TypeScript, TailwindCSS, shadcn/ui, TanStack Query, i18next, zod.

Backend: Express.js + TypeScript, zod, Prisma ORM.

Database: PostgreSQL (Neon/Supabase/Render — TBD).

Email: Resend/Postmark (TBD).

Payments: Stripe (TBD).

Maps/Geocoding: Google Maps + Places / HERE (TBD).

Messaging: WhatsApp Business API (TBD).

Deploy: Vercel (web) + Render/Fly/Hetzner (api) + DB managed.

📦 Moduli Funzionali
Sito pubblico: landing, funnel, form prenotazione multi-step, thank-you.

Area Cliente: richieste, proposte, chat, storico.

Area Chef: profilo, raggio servizio, menù e piatti, calendario, messaggi.

Proposte Chef: creazione (auto/manuale), stati (in_progress/accepted/rejected), chat.

Admin: coda richieste, assegnazioni, overview eventi, export.

Notifiche: email/WhatsApp, template personalizzabili.

Tracking: GTM+GA4+Clarity; Meta Pixel via GTM (consenso).

🗃️ Modello Dati (Prisma – bozza)
db/prisma/schema.prisma (estratto indicativo):

prisma
Copy
Edit
datasource db { provider = "postgresql"; url = env("DATABASE_URL") }
generator client { provider = "prisma-client-js" }

model User {
  id        String   @id @default(cuid())
  role      Role
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  inquiries Inquiry[]
  messages  Message[]
}

enum Role { CLIENT CHEF ADMIN }

model Chef {
  id           String   @id @default(cuid())
  userId       String   @unique
  user         User     @relation(fields: [userId], references: [id])
  bio          String?
  languages    String[] // es. ["it","en"]
  serviceBase  String?  // indirizzo base
  serviceKm    Int?     // raggio
  dishes       Dish[]
  menus        Menu[]
  proposals    Proposal[]
  createdAt    DateTime @default(now())
}

model Dish {
  id        String   @id @default(cuid())
  chefId    String
  chef      Chef     @relation(fields: [chefId], references: [id])
  name      String
  category  String   // Antipasto, Primo, etc.
  photoUrl  String?
  createdAt DateTime @default(now())
}

model Menu {
  id        String   @id @default(cuid())
  chefId    String
  chef      Chef     @relation(fields: [chefId], references: [id])
  name      String
  price     Decimal  @db.Numeric(10,2)
  items     MenuDish[]
  createdAt DateTime @default(now())
}

model MenuDish {
  menuId String
  dishId String
  menu   Menu @relation(fields: [menuId], references: [id])
  dish   Dish @relation(fields: [dishId], references: [id])
  @@id([menuId, dishId])
}

model Inquiry {
  id          String   @id @default(cuid())
  userId      String?
  user        User?    @relation(fields: [userId], references: [id])
  serviceType String   // single/multi/class
  dateFrom    DateTime
  dateTo      DateTime?
  location    String
  guestsAdult Int
  guestsKid   Int
  cuisine     String[]
  budget      Int?
  notes       String?
  proposals   Proposal[]
  createdAt   DateTime @default(now())
}

model Proposal {
  id         String   @id @default(cuid())
  inquiryId  String
  inquiry    Inquiry  @relation(fields: [inquiryId], references: [id])
  chefId     String
  chef       Chef     @relation(fields: [chefId], references: [id])
  status     String   // in_progress, accepted, rejected
  price      Decimal  @db.Numeric(10,2)
  messages   Message[]
  createdAt  DateTime @default(now())
}

model Message {
  id         String   @id @default(cuid())
  proposalId String
  proposal   Proposal @relation(fields: [proposalId], references: [id])
  authorId   String   // User.id
  text       String
  createdAt  DateTime @default(now())
}
🧩 UX & UI
Tema dark elegante, responsive, animazioni soft.

Form multi-step con validazione zod.

Mappe interattive, upload immagini drag&drop (chef).

Accessibilità e i18n (it/ro/…).

🔐 Sicurezza & GDPR
Helmet, rate limiting, validazione server (zod).

CSP, sanitizzazione input, sessione sicura.

Consent Management per tracking (banner cookie).

⚙️ Setup locale
Requisiti
Node.js 18+

pnpm (npm i -g pnpm)

Postgres locale o DB managed (Neon/Supabase)

Chiavi API (TBD)

1) Install
bash
Copy
Edit
pnpm i
2) Env files
Crea .env alla radice per Prisma/DB e file specifici per app.

/.env (root)

env
Copy
Edit
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/chefondemand

# Common
APP_URL=http://localhost:3000
/apps/web/.env.local

env
Copy
Edit
NEXT_PUBLIC_APP_NAME=Chef On Demand
NEXT_PUBLIC_GA4_ID=G-XXXXXXX
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
NEXT_PUBLIC_CLARITY_ID=XXXXXXXX
/apps/api/.env

env
Copy
Edit
PORT=4000
CORS_ORIGIN=http://localhost:3000
# Email / WhatsApp / Maps keys (TBD)
3) DB & Prisma
bash
Copy
Edit
pnpm prisma:generate     # alias turbo → prisma generate
pnpm prisma:migrate      # prisma migrate dev
pnpm prisma:seed         # seeding opzionale
(Comandi alias definiti nello package.json root.)

4) Dev
bash
Copy
Edit
pnpm dev   # avvia web (3000) + api (4000) in parallelo con Turborepo
web: http://localhost:3000

api: http://localhost:4000

🧪 Qualità & CI
TypeScript strict, ESLint + Prettier, Husky + lint-staged.

Test: Vitest/Playwright (TBD).

GitHub Actions: lint/test/build su PR.

🧭 Routing chiave (web)
/reservation – form prenotazione multi-step

/inquiry-received – thank-you + tracking (evento Lead via GTM)

/client/* – area cliente

/chef/* – area chef

/admin/* – pannello interno (TBD)

🔌 API (api)
POST /api/inquiries – crea richiesta

GET /api/inquiries/:id

POST /api/proposals

POST /api/messages

GET /api/chefs/:id …
(Schema validato con zod; risposte tipizzate condivise in packages/types)

🧱 Tracking (GTM)
GTM script su web (consenso → marketing).

Meta Pixel via GTM: Base su Initialization; Lead su /inquiry-received con Tag Sequencing.

GA4, Clarity conformi a consensi.

🚀 Deploy
web (Next.js): Vercel (environment vars da .env).

api (Express): Render/Fly/Hetzner (Docker o Node build).

DB: Neon/Supabase (managed).

DNS/SSL: gestito dai provider (HTTPS obbligatorio).

🗺️ Roadmap (prime sprint)
Scaffold monorepo + tooling (pnpm, turbo, eslint, ts).

DB schema (Prisma) + migrazioni + seed.

apps/api: endpoint inquiries + validazioni.

apps/web: form multi-step + i18n + thank-you.

Aree Cliente & Chef (shell + auth).

Proposals + chat.

Tracking & consent.

Email + template base.

Admin minimale (elenco richieste).
