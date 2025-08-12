
# chefondemand-platform
Piattaforma full-stack per Chef On Demand.

🎯 **Obiettivo (MVP)**  
Raccolta richieste/booking, invio proposte, chat cliente-chef.

Aree riservate: Cliente e Chef.

Admin interno: pipeline richieste, calendario, statistiche.

Tracking (GTM/GA4/Clarity/Meta Pixel) conforme GDPR.

---

🏗️ **Architettura**  
Monorepo con Turborepo:

```
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
```

**Stack Tecnologico**
- **Frontend:** Next.js 15 (App Router, RSC), React 18, TypeScript, TailwindCSS, shadcn/ui, TanStack Query, i18next, zod  
- **Backend:** Express.js + TypeScript, zod, Prisma ORM  
- **Database:** PostgreSQL (Neon/Supabase/Render — TBD)  
- **Email:** Resend/Postmark (TBD)  
- **Payments:** Stripe (TBD)  
- **Maps/Geocoding:** Google Maps + Places / HERE (TBD)  
- **Messaging:** WhatsApp Business API (TBD)  
- **Deploy:** Vercel (web) + Render/Fly/Hetzner (api) + DB managed  

---

📦 **Moduli Funzionali**
- **Sito pubblico:** landing, funnel, form prenotazione multi-step, thank-you  
- **Area Cliente:** richieste, proposte, chat, storico  
- **Area Chef:** profilo, raggio servizio, menù e piatti, calendario, messaggi  
- **Proposte Chef:** creazione (auto/manuale), stati (in_progress/accepted/rejected), chat  
- **Admin:** coda richieste, assegnazioni, overview eventi, export  
- **Notifiche:** email/WhatsApp, template personalizzabili  
- **Tracking:** GTM+GA4+Clarity; Meta Pixel via GTM (consenso)  

---

🗃️ **Modello Dati (Prisma – bozza)**  
*(Estratto indicativo da `db/prisma/schema.prisma`)*  
[... schema invariato come nel tuo file originale ...]

---

🧩 **UX & UI**
- Tema dark elegante, responsive, animazioni soft  
- Form multi-step con validazione zod  
- Mappe interattive, upload immagini drag&drop (chef)  
- Accessibilità e i18n (it/ro/…)  

---

🔐 **Sicurezza & GDPR**
- Helmet, rate limiting, validazione server (zod)  
- CSP, sanitizzazione input, sessione sicura  
- Consent Management per tracking (banner cookie)  

---

⚙️ **Setup locale**

**Requisiti**  
- Node.js 18+  
- pnpm (`npm i -g pnpm`)  
- Postgres locale o DB managed (Neon/Supabase)  
- Chiavi API (TBD)  

1️⃣ **Installazione**
```bash
pnpm i
```

2️⃣ **File Env**
Crea `.env` alla radice per Prisma/DB e file specifici per app.

`/.env` (root)
```env
DATABASE_URL=postgresql://user:password@localhost:5432/chefondemand
APP_URL=http://localhost:3000
```

`/apps/web/.env.local`
```env
NEXT_PUBLIC_APP_NAME=Chef On Demand
NEXT_PUBLIC_GA4_ID=G-XXXXXXX
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
NEXT_PUBLIC_CLARITY_ID=XXXXXXXX
```

`/apps/api/.env`
```env
PORT=4000
CORS_ORIGIN=http://localhost:3000
# Email / WhatsApp / Maps keys (TBD)
```

3️⃣ **DB & Prisma**
```bash
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:seed
```

4️⃣ **Avvio Dev**
```bash
pnpm dev
```
- web: http://localhost:3000  
- api: http://localhost:4000  

---

## 📦 Backend – Pacchetti Installati

**Dipendenze runtime**
```bash
npm install express cors helmet compression express-rate-limit dotenv
npm install nodemailer bcrypt
```
- **express** – server HTTP principale  
- **cors** – gestione CORS per richieste cross-origin  
- **helmet** – settaggio header HTTP per maggiore sicurezza  
- **compression** – compressione gzip delle risposte  
- **express-rate-limit** – limitazione richieste per IP (anti-abuso)  
- **dotenv** – caricamento variabili d'ambiente da `.env`  
- **nodemailer** – invio email transazionali (es. credenziali chef, conferme richieste)  
- **bcrypt** – hashing sicuro delle password prima del salvataggio in DB  

**Dipendenze di sviluppo**
```bash
npm install --save-dev typescript ts-node-dev @types/node @types/express
npm install --save-dev @types/cors @types/helmet @types/compression @types/nodemailer @types/bcrypt
```
- **typescript** – tipizzazione forte per il codice backend  
- **ts-node-dev** – esecuzione veloce TS con autorestart in dev  
- **@types/...** – definizioni di tipo per TypeScript  

**Script npm**
```json
"scripts": {
  "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
  "build": "tsc",
  "start": "node dist/index.js"
}
```
- `npm run dev` – avvia API in modalità sviluppo con reload automatico  
- `npm run build` – transpila TypeScript in JavaScript (cartella `dist/`)  
- `npm start` – avvia API in modalità produzione dal codice compilato  

**Struttura attuale backend**
```
src/
  app.ts                # Setup applicazione (middleware, routes, sicurezza)
  index.ts              # Entry point server (app.listen)
  lib/
    env.ts              # Caricamento e validazione variabili ambiente
  middleware/
    errorHandler.ts     # Gestione centralizzata errori
    notFound.ts         # Gestione 404
  routes/
    health.ts           # Endpoint di health check
    inquiries.ts        # API richieste (inquiries)
```

---

🧪 **Qualità & CI**
- TypeScript strict, ESLint + Prettier, Husky + lint-staged  
- Test: Vitest/Playwright (TBD)  
- GitHub Actions: lint/test/build su PR  

---

🧭 **Routing chiave (web)**
- `/reservation` – form prenotazione multi-step  
- `/inquiry-received` – thank-you + tracking evento Lead via GTM  
- `/client/*` – area cliente  
- `/chef/*` – area chef  
- `/admin/*` – pannello interno (TBD)  

---

🔌 **API (api)**
- `POST /api/inquiries` – crea richiesta  
- `GET /api/inquiries/:id`  
- `POST /api/proposals`  
- `POST /api/messages`  
- `GET /api/chefs/:id` …  
*(Schema validato con zod; risposte tipizzate condivise in packages/types)*  

---

🧱 **Tracking (GTM)**
- GTM script su web (consenso → marketing)  
- Meta Pixel via GTM: Base su Initialization; Lead su `/inquiry-received` con Tag Sequencing  
- GA4, Clarity conformi a consensi  

---

🚀 **Deploy**
- web (Next.js): Vercel (environment vars da `.env`)  
- api (Express): Render/Fly/Hetzner (Docker o Node build)  
- DB: Neon/Supabase (managed)  
- DNS/SSL: gestito dai provider (HTTPS obbligatorio)  

---

🗺️ **Roadmap (prime sprint)**
- Scaffold monorepo + tooling (pnpm, turbo, eslint, ts)  
- DB schema (Prisma) + migrazioni + seed  
- apps/api: endpoint inquiries + validazioni  
- apps/web: form multi-step + i18n + thank-you  
- Aree Cliente & Chef (shell + auth)  
- Proposals + chat  
- Tracking & consent  
- Email + template base  
- Admin minimale (elenco richieste)  
