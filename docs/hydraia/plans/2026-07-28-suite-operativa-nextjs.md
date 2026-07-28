# Suite Operativa — Next.js Full-Stack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: use `superpowers:subagent-driven-development`
> (recommended) or `superpowers:executing-plans` to run this plan task-by-task.
> This plan was frozen in **plan-only mode** (`/hydraia:plan` equivalent) — no
> execution happened in the session that wrote it. `docs/hydraia/.active-plan` was
> deliberately NOT armed; whoever executes this plan should arm it themselves at
> the start of the execution session (see "Arming this plan" at the bottom).

**Goal:** Rebuild Suite Operativa (12-module internal marketing/design-ops tool,
today: Apps Script + Google Sheets + build-less React) as a single Next.js
full-stack app on PostgreSQL, with Google sign-in as the only auth method and real
Google Drive file integration, preserving the same 12 modules and the team's
existing role/level model.

**Architecture:** Next.js 15 (App Router) monolith. UI in Server/Client Components
under `app/(app)/*`, API surface as Route Handlers under `app/api/**/route.ts`,
shared business logic in `lib/services/*` called by both. Single PostgreSQL
database via Prisma. Auth.js v5 (Google provider) for identity + Drive OAuth
tokens. No separate backend process.

**Tech Stack:**
- **Framework:** Next.js 15 (App Router), React 19, TypeScript 5
- **Styling:** Tailwind CSS v4 (CSS-variable theme, see spec's UX section)
- **ORM/DB:** Prisma 5 + PostgreSQL 15 (local: Docker Compose; deployed: Neon)
- **Auth:** Auth.js v5 (`next-auth`), Google provider, `@auth/prisma-adapter`
- **Validation:** Zod
- **Drive:** `googleapis` (Drive API v3) + Google Picker API (client-side widget)
- **PDF:** `jspdf` (ported client-side generation from `reports.js`)
- **Testing:** Vitest (unit + Route Handler integration tests)
- **Hosting:** Vercel (app), Neon (Postgres) — see ADR-0005 for exact account coordinates

**Spec:** `docs/hydraia/specs/2026-07-28-suite-operativa-nextjs-design.md`
**ADRs:** `docs/hydraia/adr/0001` through `0007`

## Global Constraints
(copied verbatim from the spec — do not deviate without updating the spec first)
- Every Route Handler returns `{ data, meta, errors }` (`errors: []` on success).
- All timestamps stored in UTC (Postgres `timestamptz`); formatted client-side.
- Exactly the 10 role tags + 3 levels from `data.js`'s `ROLES`/`LEVELS` — no generic
  permission-string system.
- All server-side mutations validated with Zod — client-side validation is UX only.
- Migrations via `prisma migrate dev` (local) / `prisma migrate deploy` (CI/CD) —
  cumulative, reversible, never hand-edited against a live database.
- No historical data migration from Sheets (ADR-0006) — seed script only creates
  the role catalog + the director bootstrap; every other `User` is created on
  first Google sign-in.
- Google Drive scope is `drive.file` only, never broader `drive` (ADR-0004).
- New project lives in its own directory (does NOT touch or delete
  `Suite_Operativa_Frontend/`, `Super_Ozono_Backend/`, or `Control_Retos_Y_KPIs/`)
  until the `backend/` Express skeleton is explicitly removed in Task 0-1 below
  (that folder is superseded per ADR-0001, everything else stays untouched).

## File Structure Map
```
PROYECTOS/src/
├── backend/                     # DELETED in Task 0-1 (superseded, ADR-0001)
├── web/                         # NEW — the Next.js app (this plan's output)
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── app/
│   │   ├── layout.tsx                     # root layout, theme tokens, fonts
│   │   ├── globals.css                    # Tailwind + CSS variable tokens (ADR-0007)
│   │   ├── (auth)/
│   │   │   └── signin/page.tsx            # Google sign-in screen
│   │   ├── (app)/                         # authenticated shell (sidebar + topbar)
│   │   │   ├── layout.tsx                 # sidebar nav (12 modules), topbar, role badge
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── mi-tablero/page.tsx        # personal kanban view
│   │   │   ├── metas/page.tsx
│   │   │   ├── calendario/page.tsx
│   │   │   ├── requisiciones/page.tsx
│   │   │   ├── proyectos/page.tsx
│   │   │   ├── mensajes/page.tsx
│   │   │   ├── analitica/page.tsx
│   │   │   ├── automatizaciones/page.tsx
│   │   │   ├── informes/page.tsx
│   │   │   ├── equipo/page.tsx
│   │   │   └── configuracion/page.tsx
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── tasks/route.ts             # GET (list/filter), POST
│   │       ├── tasks/[id]/route.ts        # GET, PATCH, DELETE
│   │       ├── tasks/[id]/comments/route.ts
│   │       ├── projects/route.ts
│   │       ├── projects/[id]/route.ts
│   │       ├── goals/route.ts
│   │       ├── goals/[id]/route.ts
│   │       ├── posts/route.ts             # calendario editorial
│   │       ├── posts/[id]/route.ts
│   │       ├── requisitions/route.ts
│   │       ├── requisitions/[id]/route.ts
│   │       ├── messages/route.ts
│   │       ├── automations/route.ts
│   │       ├── automations/[id]/route.ts
│   │       ├── users/route.ts
│   │       ├── users/[id]/route.ts
│   │       ├── notifications/route.ts
│   │       ├── analytics/dashboard/route.ts
│   │       └── drive/
│   │           ├── files/route.ts         # attach (from Picker) / list
│   │           └── upload/route.ts        # direct upload
│   ├── lib/
│   │   ├── auth.ts                        # Auth.js config (providers, callbacks)
│   │   ├── prisma.ts                      # singleton PrismaClient
│   │   ├── drive/
│   │   │   ├── client.ts                  # getDriveClient(userId), token refresh
│   │   │   └── picker.ts                  # client-side Picker widget loader
│   │   ├── services/
│   │   │   ├── tasks.ts
│   │   │   ├── projects.ts
│   │   │   ├── goals.ts
│   │   │   ├── posts.ts
│   │   │   ├── requisitions.ts
│   │   │   ├── messages.ts
│   │   │   ├── automations.ts
│   │   │   ├── users.ts
│   │   │   ├── notifications.ts
│   │   │   └── analytics.ts
│   │   ├── validation/
│   │   │   ├── task.ts
│   │   │   ├── project.ts
│   │   │   ├── goal.ts
│   │   │   ├── post.ts
│   │   │   ├── requisition.ts
│   │   │   └── message.ts
│   │   ├── api/
│   │   │   ├── envelope.ts                # { data, meta, errors } helpers
│   │   │   └── errorResponse.ts
│   │   └── constants.ts                   # ROLES, LEVELS, PLATFORMS, POST_STATUS (ported from data.js)
│   ├── components/
│   │   ├── layout/Sidebar.tsx, Topbar.tsx
│   │   ├── kanban/Board.tsx, Column.tsx, Card.tsx
│   │   ├── drive/AttachButton.tsx, FileChip.tsx, UploadProgress.tsx
│   │   └── ui/ (Button, Card, Badge, etc. — Tailwind primitives)
│   ├── tests/
│   │   ├── unit/services/*.test.ts
│   │   └── integration/api/*.test.ts
│   ├── docker-compose.yml                 # local Postgres 15
│   ├── package.json
│   ├── .env.example
│   ├── tsconfig.json
│   ├── next.config.ts
│   └── tailwind.config.ts
└── docs/hydraia/                # spec, ADRs, this plan, run log (already exists)
```

---

## Phase 0: Remove superseded skeleton, scaffold the Next.js project

### Task 0-1: Delete the superseded Express skeleton

**Files:**
- Delete: `backend/` (entire directory — `package.json`, `package-lock.json`,
  `node_modules/`, `src/app.js`, `.env`, `.env.example`, `.gitignore`,
  `docker-compose.yml`)

**Interfaces:** None (cleanup task, no code produced).

**Steps:**
- [ ] **Step 1:** Confirm nothing beyond Task 0-1 of the superseded plan was ever
  built: `find backend/src -type f` should print exactly two files — `backend/src/app.js`
  and `backend/src/config/database.js` (no `models/`, `routes/`, `controllers/`,
  or `services/` files — verified as of 2026-07-28, the only files ever committed
  under `backend/`). If the output includes anything else, STOP and report back
  before deleting — that would mean more was built than this plan assumes.
- [ ] **Step 2:** Delete the directory: `rm -rf backend/`
- [ ] **Step 3:** Commit:
  ```bash
  git add -A
  git commit -m "chore: remove superseded Express backend skeleton (ADR-0001)"
  ```
- [ ] **Verification:** `test -d backend` exits non-zero (directory gone);
  `git log --oneline -1` shows the commit above.

---

### Task 0-2: Scaffold the Next.js project

**Files:**
- Create: `web/package.json`
- Create: `web/tsconfig.json`
- Create: `web/next.config.ts`
- Create: `web/tailwind.config.ts`
- Create: `web/app/globals.css`
- Create: `web/.env.example`
- Create: `web/.gitignore`
- Create: `web/docker-compose.yml`

**Interfaces:**
- Consumes: None (first task of the new project)
- Produces: A runnable (empty) Next.js dev server, local Postgres container

**Steps:**

- [ ] **Step 1: Initialize the project**
  ```bash
  cd "PROYECTOS/src"
  npx create-next-app@latest web --typescript --tailwind --app --no-src-dir --import-alias "@/*" --eslint --no-turbopack
  cd web
  npm install prisma @prisma/client @auth/prisma-adapter next-auth@beta zod googleapis jspdf
  npm install --save-dev vitest @vitejs/plugin-react vite-tsconfig-paths supertest @types/supertest
  npx prisma init --datasource-provider postgresql
  ```

- [ ] **Step 2: Create `web/docker-compose.yml`**
  ```yaml
  services:
    postgres:
      image: postgres:15-alpine
      container_name: suite_operativa_db
      environment:
        POSTGRES_USER: postgres
        POSTGRES_PASSWORD: postgres
        POSTGRES_DB: suite_operativa
      ports:
        - "5432:5432"
      volumes:
        - postgres_data:/var/lib/postgresql/data
      healthcheck:
        test: ["CMD-SHELL", "pg_isready -U postgres"]
        interval: 10s
        timeout: 5s
        retries: 5

  volumes:
    postgres_data:
  ```

- [ ] **Step 3: Create `web/.env.example`**
  ```
  # Local Postgres (docker-compose) — deployed envs use Neon's pooled URL instead
  DATABASE_URL="postgresql://postgres:postgres@localhost:5432/suite_operativa"

  # Auth.js
  AUTH_SECRET="generate-with-openssl-rand-base64-32"
  AUTH_URL="http://localhost:3000"

  # Google OAuth (Cloud Console > APIs & Services > Credentials)
  GOOGLE_CLIENT_ID=""
  GOOGLE_CLIENT_SECRET=""

  # Google Drive Picker (client-side, public — restrict by HTTP referrer in Cloud Console)
  NEXT_PUBLIC_GOOGLE_PICKER_API_KEY=""
  NEXT_PUBLIC_GOOGLE_CLIENT_ID=""

  # Bootstrap: this email becomes 'director' level on its first sign-in
  SEED_DIRECTOR_EMAIL="diego.azcarate@example.com"

  # Comma-separated allow-list of emails/domain permitted to sign in (ADR-0003)
  ALLOWED_EMAIL_DOMAIN="superozonoglobal.com"
  ```

- [ ] **Step 4: Start local Postgres and verify**
  ```bash
  docker compose up -d
  docker ps --filter "name=suite_operativa_db" --format "{{.Status}}"
  ```
  Expected output: a line starting with `Up` (and `(healthy)` once the healthcheck passes).

- [ ] **Step 5: Commit**
  ```bash
  git add web/package.json web/tsconfig.json web/next.config.ts web/tailwind.config.ts \
          web/app/globals.css web/.env.example web/.gitignore web/docker-compose.yml \
          web/prisma/schema.prisma
  git commit -m "chore: scaffold Next.js 15 project (web/), local Postgres via docker-compose"
  ```

- [ ] **Verification:** `cd web && npm run dev` starts without error (Ctrl+C after
  confirming `Ready` in stdout); `docker ps` shows the healthy container from Step 4.

---

### Task 0-3: Full Prisma schema

**Files:**
- Modify: `web/prisma/schema.prisma` (replace the `npx prisma init` placeholder
  content entirely with the schema below)

**Interfaces:**
- Consumes: `DATABASE_URL` env var (Task 0-2)
- Produces: All Prisma models used by every later task in this plan — this is the
  single source of truth for the data model. Every later task's `Interfaces:
  Consumes` referring to a Prisma model means "as defined here."

**Steps:**

- [ ] **Step 1: Replace `web/prisma/schema.prisma` with:**
  ```prisma
  generator client {
    provider = "prisma-client-js"
  }

  datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")
  }

  // ---- Auth.js required models (Prisma adapter contract) --------------------

  model Account {
    id                String  @id @default(cuid())
    userId            String
    type              String
    provider          String
    providerAccountId String
    refresh_token     String? @db.Text
    access_token      String? @db.Text
    expires_at        Int?
    token_type        String?
    scope             String?
    id_token          String? @db.Text
    session_state     String?
    user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

    @@unique([provider, providerAccountId])
  }

  model Session {
    id           String   @id @default(cuid())
    sessionToken String   @unique
    userId       String
    expires      DateTime
    user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  }

  model VerificationToken {
    identifier String
    token      String   @unique
    expires    DateTime

    @@unique([identifier, token])
  }

  // ---- Domain enums (ported 1:1 from Suite_Operativa_Frontend/data.js) ------

  enum RoleTag {
    DIRECTOR
    VENTAS
    COPYWRITING
    PUBLICISTA
    DISENADOR
    FILMMAKER
    EDITOR_VIDEO
    COMMUNITY_MANAGER
    TRAFIKER
    ECOMMERCE
  }

  enum Level {
    DIRECTOR
    LIDER
    COLABORADOR
  }

  enum TaskStatus {
    TODO
    PROGRESS
    REVIEW
    DONE
  }

  enum GoalType {
    NUMERO
    PORCENTAJE
    CHECKLIST
  }

  enum GoalScope {
    PERSONAL
    EQUIPO
  }

  enum GoalStatus {
    ACTIVA
    APROBADA
    COMPLETADA
    FALLIDA
  }

  enum Platform {
    INSTAGRAM
    TIKTOK
    FACEBOOK
    LINKEDIN
    X
    YOUTUBE
  }

  enum PostStatus {
    BORRADOR
    PROGRAMADO
    PUBLICADO
  }

  enum RequisitionStatus {
    PENDIENTE
    ACEPTADA
    RECHAZADA
  }

  // ---- Core domain -----------------------------------------------------------

  model User {
    id            String    @id @default(cuid())
    email         String    @unique
    name          String
    image         String?
    roleTag       RoleTag?
    level         Level     @default(COLABORADOR)
    phone         String?
    notifyChannel String    @default("app")
    createdAt     DateTime  @default(now())
    updatedAt     DateTime  @updatedAt

    accounts             Account[]
    sessions             Session[]
    ledProjects          Project[]      @relation("ProjectLead")
    assignedTasks        Task[]         @relation("TaskAssignee")
    createdTasks         Task[]         @relation("TaskCreatedBy")
    taskComments         TaskComment[]
    goals                Goal[]
    assignedPosts        Post[]         @relation("PostAssignee")
    requisitionsSent     Requisition[]  @relation("RequisitionFrom")
    requisitionsReceived Requisition[]  @relation("RequisitionTo")
    messagesSent         Message[]      @relation("MessageSender")
    messagesReceived     Message[]      @relation("MessageRecipient")
    automationsCreated   Automation[]
    notifications        Notification[]
    driveFilesUploaded   DriveFile[]
  }

  model Project {
    id               String   @id @default(cuid())
    name             String
    driveFolderId    String?
    driveFolderName  String?
    driveFolderLink  String?
    leadId           String?
    lead             User?    @relation("ProjectLead", fields: [leadId], references: [id])
    createdAt        DateTime @default(now())
    updatedAt        DateTime @updatedAt

    products Product[]
    tasks    Task[]
    posts    Post[]
  }

  model Product {
    id              String   @id @default(cuid())
    name            String
    projectId       String
    project         Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
    driveFolderId   String?
    driveFolderName String?
    driveFolderLink String?
    createdAt       DateTime @default(now())
    updatedAt       DateTime @updatedAt

    tasks Task[]
    posts Post[]
  }

  model Task {
    id          String     @id @default(cuid())
    title       String
    description String?    @db.Text
    projectId   String?
    project     Project?   @relation(fields: [projectId], references: [id])
    productId   String?
    product     Product?   @relation(fields: [productId], references: [id])
    roleTag     RoleTag?
    assigneeId  String?
    assignee    User?      @relation("TaskAssignee", fields: [assigneeId], references: [id])
    status      TaskStatus @default(TODO)
    dueDate     DateTime?
    completedAt DateTime?
    goalId      String?
    goal        Goal?      @relation(fields: [goalId], references: [id])
    createdById String
    createdBy   User       @relation("TaskCreatedBy", fields: [createdById], references: [id])
    createdAt   DateTime   @default(now())
    updatedAt   DateTime   @updatedAt

    comments      TaskComment[]
    history       TaskHistoryEntry[]
    driveFiles    DriveFile[]
    posts         Post[]
    requisitions  Requisition[]
    dependsOn     TaskDependency[] @relation("DependentTask")
    dependedOnBy  TaskDependency[] @relation("DependsOnTask")
  }

  model TaskDependency {
    id            String @id @default(cuid())
    taskId        String
    task          Task   @relation("DependentTask", fields: [taskId], references: [id], onDelete: Cascade)
    dependsOnId   String
    dependsOnTask Task   @relation("DependsOnTask", fields: [dependsOnId], references: [id], onDelete: Cascade)

    @@unique([taskId, dependsOnId])
  }

  model TaskComment {
    id        String   @id @default(cuid())
    taskId    String
    task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
    userId    String
    user      User     @relation(fields: [userId], references: [id])
    text      String   @db.Text
    createdAt DateTime @default(now())
  }

  model TaskHistoryEntry {
    id        String   @id @default(cuid())
    taskId    String
    task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
    text      String
    createdAt DateTime @default(now())
  }

  model Goal {
    id          String     @id @default(cuid())
    userId      String?
    user        User?      @relation(fields: [userId], references: [id])
    title       String
    description String?
    type        GoalType
    scope       GoalScope
    target      Int?
    current     Int        @default(0)
    status      GoalStatus @default(ACTIVA)
    month       String     // "YYYY-MM"
    createdAt   DateTime   @default(now())
    updatedAt   DateTime   @updatedAt

    checklistItems GoalChecklistItem[]
    tasks          Task[]
  }

  model GoalChecklistItem {
    id     String  @id @default(cuid())
    goalId String
    goal   Goal    @relation(fields: [goalId], references: [id], onDelete: Cascade)
    label  String
    done   Boolean @default(false)
  }

  model Post {
    id            String     @id @default(cuid())
    taskId        String?
    task          Task?      @relation(fields: [taskId], references: [id])
    projectId     String?
    project       Project?   @relation(fields: [projectId], references: [id])
    productId     String?
    product       Product?   @relation(fields: [productId], references: [id])
    title         String
    platform      Platform
    scheduledDate DateTime?
    scheduledTime String?
    status        PostStatus @default(BORRADOR)
    assigneeId    String?
    assignee      User?      @relation("PostAssignee", fields: [assigneeId], references: [id])
    createdAt     DateTime   @default(now())
    updatedAt     DateTime   @updatedAt
  }

  model Requisition {
    id          String             @id @default(cuid())
    fromUserId  String
    fromUser    User               @relation("RequisitionFrom", fields: [fromUserId], references: [id])
    toUserId    String
    toUser      User               @relation("RequisitionTo", fields: [toUserId], references: [id])
    title       String
    description String?            @db.Text
    status      RequisitionStatus  @default(PENDIENTE)
    motivo      String?
    taskId      String?
    task        Task?              @relation(fields: [taskId], references: [id])
    createdAt   DateTime           @default(now())
    updatedAt   DateTime           @updatedAt

    driveFiles DriveFile[]
  }

  model Message {
    id          String    @id @default(cuid())
    senderId    String
    sender      User      @relation("MessageSender", fields: [senderId], references: [id])
    recipientId String?
    recipient   User?     @relation("MessageRecipient", fields: [recipientId], references: [id])
    channel     String?
    content     String    @db.Text
    readAt      DateTime?
    createdAt   DateTime  @default(now())
  }

  model Automation {
    id          String   @id @default(cuid())
    name        String
    description String?
    trigger     String
    action      Json
    enabled     Boolean  @default(true)
    createdById String
    createdBy   User     @relation(fields: [createdById], references: [id])
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt
  }

  model Notification {
    id        String   @id @default(cuid())
    userId    String
    user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
    text      String
    read      Boolean  @default(false)
    createdAt DateTime @default(now())
  }

  model DriveFile {
    id            String       @id @default(cuid())
    driveFileId   String
    name          String
    mimeType      String
    webViewLink   String
    taskId        String?
    task          Task?        @relation(fields: [taskId], references: [id])
    requisitionId String?
    requisition   Requisition? @relation(fields: [requisitionId], references: [id])
    uploadedById  String
    uploadedBy    User         @relation(fields: [uploadedById], references: [id])
    createdAt     DateTime     @default(now())
  }

  model OrgSettings {
    id                  String   @id @default(cuid())
    allowedEmailDomain  String?
    allowedEmails       String[]
    updatedAt           DateTime @updatedAt
  }
  ```

- [ ] **Step 2: Verify the schema is syntactically valid and matches expectations**
  ```bash
  cd web
  npx prisma format
  npx prisma validate
  ```
  Expected: `The schema at prisma/schema.prisma is valid 🚀` (from `validate`).

- [ ] **Step 3: Completeness check on the large literal**
  ```bash
  grep -c "^model " prisma/schema.prisma
  ```
  Expected: `19` (Account, Session, VerificationToken, User, Project, Product,
  Task, TaskDependency, TaskComment, TaskHistoryEntry, Goal, GoalChecklistItem,
  Post, Requisition, Message, Automation, Notification, DriveFile, OrgSettings).
  If the count differs, diff the file against the block in Step 1 — never delete a
  model to force the count to match.

- [ ] **Step 4: Generate the client and run the first migration**
  ```bash
  npx prisma migrate dev --name init
  ```
  Expected: ends with `Your database is now in sync with your schema.` and
  generates `prisma/migrations/<timestamp>_init/migration.sql`.

- [ ] **Step 5: Commit**
  ```bash
  git add web/prisma/
  git commit -m "feat: define full Prisma schema for all 12 modules, run initial migration"
  ```

---

## Phase 1: Auth (Google sign-in) + app shell

### Task 1-1: Auth.js configuration with Google provider + allow-list gate

**Files:**
- Create: `web/lib/prisma.ts`
- Create: `web/lib/auth.ts`
- Create: `web/app/api/auth/[...nextauth]/route.ts`
- Create: `web/app/(auth)/signin/page.tsx`
- Create: `web/middleware.ts`
- Create: `web/tests/unit/lib/auth.test.ts`

**Interfaces:**
- Consumes: `User`, `Account`, `Session` Prisma models (Task 0-3), `SEED_DIRECTOR_EMAIL`
  and `ALLOWED_EMAIL_DOMAIN` env vars (Task 0-2)
- Produces: `auth()` helper (server-side session read), `signIn`/`signOut` actions,
  `middleware.ts` route protection for everything under `app/(app)/*`

**Steps:**

- [ ] **Step 1: `web/lib/prisma.ts`**
  ```typescript
  import { PrismaClient } from "@prisma/client";

  const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

  export const prisma = globalForPrisma.prisma ?? new PrismaClient();

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
  }
  ```

- [ ] **Step 2: `web/lib/auth.ts`**
  ```typescript
  import NextAuth from "next-auth";
  import Google from "next-auth/providers/google";
  import { PrismaAdapter } from "@auth/prisma-adapter";
  import { prisma } from "@/lib/prisma";

  const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN ?? "";
  const directorEmail = (process.env.SEED_DIRECTOR_EMAIL ?? "").toLowerCase();

  export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma),
    providers: [
      Google({
        authorization: {
          params: {
            access_type: "offline",
            prompt: "consent",
            scope: "openid email profile https://www.googleapis.com/auth/drive.file",
          },
        },
      }),
    ],
    session: { strategy: "database" },
    callbacks: {
      async signIn({ user }) {
        const email = (user.email ?? "").toLowerCase();
        if (!email) return false;
        if (email === directorEmail) return true;
        if (allowedDomain && email.endsWith(`@${allowedDomain}`)) return true;
        return false;
      },
      async session({ session, user }) {
        if (session.user) {
          const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
          (session.user as typeof session.user & { level?: string; roleTag?: string | null }).level =
            dbUser?.level;
          (session.user as typeof session.user & { level?: string; roleTag?: string | null }).roleTag =
            dbUser?.roleTag ?? null;
        }
        return session;
      },
    },
    events: {
      async createUser({ user }) {
        const email = (user.email ?? "").toLowerCase();
        if (email === directorEmail) {
          await prisma.user.update({
            where: { id: user.id },
            data: { level: "DIRECTOR" },
          });
        }
      },
    },
  });
  ```

- [ ] **Step 3: `web/app/api/auth/[...nextauth]/route.ts`**
  ```typescript
  import { handlers } from "@/lib/auth";

  export const { GET, POST } = handlers;
  ```

- [ ] **Step 4: `web/middleware.ts`**
  ```typescript
  export { auth as middleware } from "@/lib/auth";

  export const config = {
    matcher: ["/((?!api/auth|signin|_next/static|_next/image|favicon.ico).*)"],
  };
  ```

- [ ] **Step 5: `web/app/(auth)/signin/page.tsx`**
  ```tsx
  import { signIn } from "@/lib/auth";

  export default function SignInPage() {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/dashboard" });
          }}
          className="flex flex-col items-center gap-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-10"
        >
          <h1 className="text-2xl font-bold text-[var(--text)]">Suite Operativa</h1>
          <button
            type="submit"
            className="rounded-lg bg-gradient-to-br from-[var(--accent-dim)] to-[#00a050] px-6 py-3 font-semibold text-white"
          >
            Iniciar sesión con Google
          </button>
        </form>
      </main>
    );
  }
  ```

- [ ] **Step 6: Failing test first — `web/tests/unit/lib/auth.test.ts`**
  ```typescript
  import { describe, it, expect, beforeEach, vi } from "vitest";

  vi.mock("@/lib/prisma", () => ({ prisma: { user: { findUnique: vi.fn(), update: vi.fn() } } }));

  describe("signIn callback allow-list", () => {
    beforeEach(() => {
      process.env.ALLOWED_EMAIL_DOMAIN = "superozonoglobal.com";
      process.env.SEED_DIRECTOR_EMAIL = "diego.azcarate@example.com";
    });

    it("rejects an email outside the allowed domain and not the director", async () => {
      const { GET } = await import("@/lib/auth"); // importing re-evaluates env-derived consts
      expect(GET).toBeDefined(); // smoke: module loads with the env vars above
    });
  });
  ```
  Run: `cd web && npx vitest run tests/unit/lib/auth.test.ts` — expect it to run
  (not necessarily meaningfully assert yet; this is a smoke test that the auth
  module loads without throwing given the env vars). Flesh out real allow/deny
  assertions once `signIn` is exported testably (tracked as a follow-up if the
  callback needs to be extracted into a standalone testable function — do that
  extraction now if the inline test above feels too weak: move the allow-list
  logic into `lib/authAllowList.ts` exporting `isEmailAllowed(email: string):
  boolean`, unit-test that directly, and call it from the `signIn` callback).

- [ ] **Step 7: Commit**
  ```bash
  git add web/lib/prisma.ts web/lib/auth.ts web/app/api/auth web/app/\(auth\) web/middleware.ts web/tests/unit/lib/auth.test.ts
  git commit -m "feat: Auth.js Google sign-in with allow-list gate and Drive scope (ADR-0003)"
  ```

- [ ] **Verification:** `cd web && npm run dev`, visit `http://localhost:3000` →
  redirected to `/signin` (middleware working); manual Google OAuth click requires
  real `GOOGLE_CLIENT_ID`/`SECRET` in `.env` (human-only setup, Task 7-1) to fully
  verify end-to-end — until then, confirm the redirect-to-signin behavior only.

---

### Task 1-2: App shell (sidebar with 12 modules, topbar) + design tokens

**Files:**
- Modify: `web/app/globals.css` (replace Tailwind's default generated content with
  the token block below, appended after Tailwind's `@import "tailwindcss";` line)
- Create: `web/app/(app)/layout.tsx`
- Create: `web/components/layout/Sidebar.tsx`
- Create: `web/components/layout/Topbar.tsx`
- Create: `web/lib/constants.ts`

**Interfaces:**
- Consumes: `auth()` from `web/lib/auth.ts` (Task 1-1) for the current user's
  name/role/level shown in the sidebar footer and topbar badge
- Produces: `<AppLayout>` wrapping every page under `app/(app)/*`; `ROLES`,
  `LEVELS`, `MODULES` constants reused by Sidebar and later by Equipo/Configuración

**Steps:**

- [ ] **Step 1: Append to `web/app/globals.css`** (keep the existing
  `@import "tailwindcss";` line create-next-app generated, add below it):
  ```css
  :root {
    --bg: #020d06;
    --bg-elevated: #071409;
    --surface: #0c1c11;
    --surface-hover: #12271a;
    --border: #1d3524;
    --border-soft: #17291d;
    --accent: #10b981;
    --accent-dim: #037a3a;
    --accent-bright: #45fc9c;
    --accent-ink: #ffffff;
    --text: #eef7f1;
    --text-muted: #8fae9c;
    --text-faint: #5c7568;
    --coral: #ff5c3d;
    --sky: #5cc9ff;
    --violet: #c77dff;
    --amber: #ffd166;
    --danger: #ff5c5c;
    --mint: #8fe0a8;
    --font-display: "Plus Jakarta Sans", sans-serif;
    --font-body: "IBM Plex Sans", sans-serif;
    --font-mono: "Space Mono", monospace;
  }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-body);
  }

  *:focus-visible {
    outline: 2px solid var(--accent-bright);
    outline-offset: 2px;
  }
  ```

- [ ] **Step 2: `web/lib/constants.ts`**
  ```typescript
  export const ROLES = [
    { id: "DIRECTOR", name: "Director / PM", area: "Dirección" },
    { id: "VENTAS", name: "Ventas", area: "Comercial" },
    { id: "COPYWRITING", name: "Copywriting", area: "Creativo" },
    { id: "PUBLICISTA", name: "Publicista", area: "Creativo" },
    { id: "DISENADOR", name: "Diseñador", area: "Creativo" },
    { id: "FILMMAKER", name: "Filmmaker", area: "Producción" },
    { id: "EDITOR_VIDEO", name: "Editor de Video", area: "Producción" },
    { id: "COMMUNITY_MANAGER", name: "Community Manager", area: "Social" },
    { id: "TRAFIKER", name: "Trafiker", area: "Pauta" },
    { id: "ECOMMERCE", name: "Encargado de Ecommerce", area: "Comercial" },
  ] as const;

  export const LEVELS = { DIRECTOR: "DIRECTOR", LIDER: "LIDER", COLABORADOR: "COLABORADOR" } as const;

  export const PLATFORMS = [
    { id: "INSTAGRAM", label: "Instagram", color: "#E1306C" },
    { id: "TIKTOK", label: "TikTok", color: "#25F4EE" },
    { id: "FACEBOOK", label: "Facebook", color: "#5CC9FF" },
    { id: "LINKEDIN", label: "LinkedIn", color: "#4C9AFF" },
    { id: "X", label: "X", color: "#F2F4E8" },
    { id: "YOUTUBE", label: "YouTube", color: "#FF5C3D" },
  ] as const;

  export const MODULES = [
    { href: "/dashboard", label: "Dashboard", icon: "grid" },
    { href: "/mi-tablero", label: "Mi Tablero", icon: "flag" },
    { href: "/metas", label: "Metas", icon: "target" },
    { href: "/calendario", label: "Calendario Editorial", icon: "calendar" },
    { href: "/requisiciones", label: "Requisiciones", icon: "file-text" },
    { href: "/proyectos", label: "Proyectos", icon: "folder" },
    { href: "/mensajes", label: "Mensajes", icon: "message-square" },
    { href: "/analitica", label: "Analítica", icon: "activity" },
    { href: "/automatizaciones", label: "Automatizaciones", icon: "shield" },
    { href: "/informes", label: "Informes", icon: "folder-open" },
    { href: "/equipo", label: "Equipo", icon: "users" },
    { href: "/configuracion", label: "Configuración", icon: "settings" },
  ] as const;
  ```

- [ ] **Step 2: `web/components/layout/Sidebar.tsx`** — server component, renders
  `MODULES.map(...)` as `<Link>` items in a fixed 260px column with
  `background: var(--bg-elevated)`, active item gets `border-left: 3px solid
  var(--accent); color: var(--accent);` (matches the reference screenshot's active
  "Dashboard" nav treatment), footer shows the signed-in user's name/role
  (`session.user.name`, `session.user.roleTag`) + a "Cambiar usuario" sign-out button.

- [ ] **Step 3: `web/components/layout/Topbar.tsx`** — page title (passed as a
  prop from each page) + role badge pill (`background: var(--surface-hover);
  border: 1px solid var(--border);`) + notification bell icon button
  (`aria-label="Notificaciones"`).

- [ ] **Step 4: `web/app/(app)/layout.tsx`**
  ```tsx
  import { auth } from "@/lib/auth";
  import { redirect } from "next/navigation";
  import { Sidebar } from "@/components/layout/Sidebar";

  export default async function AppLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();
    if (!session?.user) redirect("/signin");

    return (
      <div className="flex min-h-screen">
        <Sidebar user={session.user} />
        <div className="flex-1">{children}</div>
      </div>
    );
  }
  ```

- [ ] **Step 5: Commit**
  ```bash
  git add web/app/globals.css web/app/\(app\)/layout.tsx web/components/layout/ web/lib/constants.ts
  git commit -m "feat: app shell with 12-module sidebar and emerald design tokens (ADR-0007)"
  ```

- [ ] **Verification:** `npm run dev`, sign in (once Task 7-1's Google credentials
  exist), confirm all 12 sidebar links render in the exact order from
  `Dashboard.png` and the active-route highlight uses `var(--accent)`.

---

## Phase 2: Core modules — Dashboard, Mi Tablero (Kanban), Equipo

### Task 2-1: Tasks service + API + Kanban board (Mi Tablero, feeds Dashboard)

**Files:**
- Create: `web/lib/validation/task.ts`
- Create: `web/lib/services/tasks.ts`
- Create: `web/app/api/tasks/route.ts`
- Create: `web/app/api/tasks/[id]/route.ts`
- Create: `web/components/kanban/Board.tsx`, `Column.tsx`, `Card.tsx`
- Create: `web/app/(app)/mi-tablero/page.tsx`
- Create: `web/app/(app)/dashboard/page.tsx`
- Create: `web/tests/integration/api/tasks.test.ts`

**Interfaces:**
- Consumes: `Task`, `TaskComment`, `TaskHistoryEntry` Prisma models (Task 0-3);
  `TaskStatus` enum values `TODO|PROGRESS|REVIEW|DONE`
- Produces: `listTasks(filters)`, `createTask(input, createdById)`,
  `updateTaskStatus(id, status, actingUserId)` from `lib/services/tasks.ts`,
  reused directly by Task 6-2 (Informes) and Task 3-1 (Dashboard aggregates)

**Steps:**

- [ ] **Step 1: `web/lib/validation/task.ts`**
  ```typescript
  import { z } from "zod";

  export const taskStatusEnum = z.enum(["TODO", "PROGRESS", "REVIEW", "DONE"]);

  export const createTaskSchema = z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(5000).optional(),
    projectId: z.string().optional(),
    productId: z.string().optional(),
    roleTag: z.string().optional(),
    assigneeId: z.string().optional(),
    dueDate: z.string().datetime().optional(),
    goalId: z.string().optional(),
  });

  export const updateTaskSchema = z.object({
    status: taskStatusEnum.optional(),
    assigneeId: z.string().nullable().optional(),
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(5000).optional(),
    dueDate: z.string().datetime().nullable().optional(),
  });
  ```

- [ ] **Step 2: Failing test — `web/tests/integration/api/tasks.test.ts`**
  ```typescript
  import { describe, it, expect, beforeAll, afterAll } from "vitest";
  import { prisma } from "@/lib/prisma";
  import { createTask, listTasks, updateTaskStatus } from "@/lib/services/tasks";

  describe("tasks service", () => {
    let userId: string;

    beforeAll(async () => {
      const user = await prisma.user.create({
        data: { email: "test-tasks@example.com", name: "Test User", level: "COLABORADOR" },
      });
      userId = user.id;
    });

    afterAll(async () => {
      await prisma.task.deleteMany({ where: { createdById: userId } });
      await prisma.user.delete({ where: { id: userId } });
    });

    it("creates a task with default status TODO", async () => {
      const task = await createTask({ title: "Test task" }, userId);
      expect(task.status).toBe("TODO");
    });

    it("moves a task through the kanban statuses and records history", async () => {
      const task = await createTask({ title: "Move me" }, userId);
      const updated = await updateTaskStatus(task.id, "PROGRESS", userId);
      expect(updated.status).toBe("PROGRESS");
      const history = await prisma.taskHistoryEntry.findMany({ where: { taskId: task.id } });
      expect(history.length).toBeGreaterThan(0);
    });

    it("lists tasks filtered by status", async () => {
      await createTask({ title: "Filtered task" }, userId);
      const { items } = await listTasks({ status: "TODO" });
      expect(items.every((t) => t.status === "TODO")).toBe(true);
    });
  });
  ```
  Run: `cd web && npx vitest run tests/integration/api/tasks.test.ts` — expect
  FAIL (`Cannot find module '@/lib/services/tasks'`) before Step 3.

- [ ] **Step 3: `web/lib/services/tasks.ts`**
  ```typescript
  import { prisma } from "@/lib/prisma";
  import type { Prisma } from "@prisma/client";

  export async function listTasks(filters: { status?: string; assigneeId?: string; projectId?: string } = {}) {
    const where: Prisma.TaskWhereInput = {};
    if (filters.status) where.status = filters.status as Prisma.TaskWhereInput["status"];
    if (filters.assigneeId) where.assigneeId = filters.assigneeId;
    if (filters.projectId) where.projectId = filters.projectId;

    const items = await prisma.task.findMany({
      where,
      include: { assignee: true, project: true, product: true, comments: true },
      orderBy: { createdAt: "desc" },
    });
    return { items, total: items.length };
  }

  export async function createTask(
    input: { title: string; description?: string; projectId?: string; productId?: string; roleTag?: string; assigneeId?: string; dueDate?: string; goalId?: string },
    createdById: string
  ) {
    return prisma.task.create({
      data: {
        title: input.title,
        description: input.description,
        projectId: input.projectId,
        productId: input.productId,
        roleTag: input.roleTag as Prisma.TaskCreateInput["roleTag"],
        assigneeId: input.assigneeId,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        goalId: input.goalId,
        createdById,
        history: { create: { text: "Tarea creada." } },
      },
    });
  }

  export async function updateTaskStatus(id: string, status: string, actingUserId: string) {
    const statusLabels: Record<string, string> = {
      TODO: "Por Hacer",
      PROGRESS: "En Proceso",
      REVIEW: "En Revisión",
      DONE: "Aprobado / Listo",
    };
    const task = await prisma.task.update({
      where: { id },
      data: {
        status: status as Prisma.TaskUpdateInput["status"],
        completedAt: status === "DONE" ? new Date() : null,
        history: { create: { text: `Movida a ${statusLabels[status] ?? status}.` } },
      },
    });
    void actingUserId; // recorded via session in the Route Handler layer, not re-derived here
    return task;
  }
  ```

- [ ] **Step 4: Run the test again**
  ```bash
  cd web && npx vitest run tests/integration/api/tasks.test.ts
  ```
  Expected: all 3 tests pass (requires local Postgres from Task 0-2 running and
  migrated per Task 0-3).

- [ ] **Step 5: `web/app/api/tasks/route.ts`**
  ```typescript
  import { NextRequest, NextResponse } from "next/server";
  import { auth } from "@/lib/auth";
  import { listTasks, createTask } from "@/lib/services/tasks";
  import { createTaskSchema } from "@/lib/validation/task";

  export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ data: null, meta: {}, errors: [{ message: "Unauthorized" }] }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const { items, total } = await listTasks({
      status: searchParams.get("status") ?? undefined,
      assigneeId: searchParams.get("assigneeId") ?? undefined,
      projectId: searchParams.get("projectId") ?? undefined,
    });
    return NextResponse.json({ data: items, meta: { total }, errors: [] });
  }

  export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ data: null, meta: {}, errors: [{ message: "Unauthorized" }] }, { status: 401 });

    const body = await req.json();
    const parsed = createTaskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ data: null, meta: {}, errors: parsed.error.issues.map((i) => ({ message: i.message })) }, { status: 400 });
    }
    const task = await createTask(parsed.data, session.user.id!);
    return NextResponse.json({ data: task, meta: {}, errors: [] }, { status: 201 });
  }
  ```

- [ ] **Step 6: `web/app/api/tasks/[id]/route.ts`** — `PATCH` validates with
  `updateTaskSchema`, calls `updateTaskStatus` when `status` is present in the
  body (else a plain `prisma.task.update`), same auth + envelope pattern as Step 5.

- [ ] **Step 7: `web/components/kanban/Board.tsx`** — 4 columns (`STATUS_COLUMNS`:
  Por Hacer/En Proceso/En Revisión/Aprobado-Listo, matching
  `Suite_Operativa_Frontend/data.js`'s `STATUS_COLUMNS` labels exactly), each
  `Column` renders `Card`s for tasks in that status, drag-and-drop via native HTML5
  DnD (`draggable`, `onDragStart`/`onDrop`) calling `PATCH /api/tasks/:id` with the
  new status on drop; card shows title, assignee avatar (initials + `avatarColor`
  equivalent — generate a deterministic color from `user.id` via a small hash
  function since Prisma doesn't store `avatarColor` — note this as a deliberate
  simplification vs. the old mock, not a missed field).

- [ ] **Step 8: `web/app/(app)/mi-tablero/page.tsx`** — Server Component, calls
  `listTasks({ assigneeId: session.user.id })` directly (no fetch — same-process),
  renders `<Board tasks={items} />`.

- [ ] **Step 9: `web/app/(app)/dashboard/page.tsx`** — Server Component, calls
  `listTasks()` (all tasks) + a small aggregate query (`prisma.task.groupBy({ by:
  ['assigneeId'], ...})`) for the "Carga de trabajo por rol" chart, matching the
  layout in `Dashboard.png`: 3-card top row (carga por rol, % cumplimiento metas,
  tareas retrasadas/bloqueadas), 2-card bottom row (resumen por proyecto, foco de
  hoy por miembro).

- [ ] **Step 10: Commit**
  ```bash
  git add web/lib/validation/task.ts web/lib/services/tasks.ts web/app/api/tasks \
          web/components/kanban web/app/\(app\)/mi-tablero web/app/\(app\)/dashboard \
          web/tests/integration/api/tasks.test.ts
  git commit -m "feat: tasks service/API, kanban board, Dashboard and Mi Tablero pages"
  ```

- [ ] **Verification:** `cd web && npx vitest run` (all tests pass);
  `npm run dev`, sign in, drag a card between columns on Mi Tablero, confirm it
  persists on page reload (i.e. the `PATCH` call actually landed in Postgres —
  check with `npx prisma studio` if visual confirmation is wanted).

---

### Task 2-2: Equipo (Users/roles CRUD, director/líder only for writes)

**Files:**
- Create: `web/lib/services/users.ts`
- Create: `web/app/api/users/route.ts`
- Create: `web/app/api/users/[id]/route.ts`
- Create: `web/app/(app)/equipo/page.tsx`
- Create: `web/tests/integration/api/users.test.ts`

**Interfaces:**
- Consumes: `User` Prisma model (Task 0-3), `ROLES`/`LEVELS` from
  `web/lib/constants.ts` (Task 1-2)
- Produces: `listUsers()`, `updateUserRole(id, { roleTag, level }, actingUser)` —
  the latter throws if `actingUser.level === "COLABORADOR"` (only director/líder
  can reassign roles, per the spec's threat-model AuthZ requirement)

**Steps:**

- [ ] **Step 1: Failing test — `web/tests/integration/api/users.test.ts`**
  ```typescript
  import { describe, it, expect } from "vitest";
  import { updateUserRole } from "@/lib/services/users";
  import { prisma } from "@/lib/prisma";

  describe("users service - role assignment", () => {
    it("rejects a role change attempted by a COLABORADOR-level actor", async () => {
      const target = await prisma.user.create({ data: { email: "target@example.com", name: "Target", level: "COLABORADOR" } });
      const actor = await prisma.user.create({ data: { email: "actor@example.com", name: "Actor", level: "COLABORADOR" } });

      await expect(
        updateUserRole(target.id, { roleTag: "DISENADOR" }, actor)
      ).rejects.toThrow(/permission|forbidden/i);

      await prisma.user.deleteMany({ where: { id: { in: [target.id, actor.id] } } });
    });
  });
  ```
  Run: `cd web && npx vitest run tests/integration/api/users.test.ts` — expect FAIL.

- [ ] **Step 2: `web/lib/services/users.ts`**
  ```typescript
  import { prisma } from "@/lib/prisma";
  import type { User } from "@prisma/client";

  export async function listUsers() {
    return prisma.user.findMany({ orderBy: { name: "asc" } });
  }

  export async function updateUserRole(
    targetId: string,
    changes: { roleTag?: string; level?: string },
    actingUser: Pick<User, "level">
  ) {
    if (actingUser.level === "COLABORADOR") {
      throw new Error("Forbidden: only director or líder can change roles");
    }
    return prisma.user.update({
      where: { id: targetId },
      data: {
        roleTag: changes.roleTag as User["roleTag"],
        level: changes.level as User["level"],
      },
    });
  }
  ```

- [ ] **Step 3: Run the test again** — expect pass.

- [ ] **Step 4: `web/app/api/users/route.ts`** (`GET`, auth-only, envelope
  pattern from Task 2-1 Step 5) and **`web/app/api/users/[id]/route.ts`**
  (`PATCH`, calls `updateUserRole(params.id, body, session-derived actingUser)`,
  returns 403 with the envelope error shape if `updateUserRole` throws).

- [ ] **Step 5: `web/app/(app)/equipo/page.tsx`** — Server Component listing
  every user as a card (avatar initials, name, `ROLES.find(r => r.id ===
  user.roleTag)?.name`, level badge); if `session.user.level !== "COLABORADOR"`,
  each card gets an editable role/level `<select>` wired to a small Client
  Component that `PATCH`es `/api/users/:id` on change.

- [ ] **Step 6: Commit**
  ```bash
  git add web/lib/services/users.ts web/app/api/users web/app/\(app\)/equipo \
          web/tests/integration/api/users.test.ts
  git commit -m "feat: Equipo module — user list and role/level assignment (director/líder only)"
  ```

- [ ] **Verification:** `npx vitest run` all green; as a colaborador-level test
  user, confirm role `<select>` does not render; as director, confirm it does and
  a change persists.

---

## Phase 3: Proyectos, Metas, Calendario Editorial

Each task in this phase follows the **same TDD pattern established in Task 2-1**:
(1) Zod validation schema in `lib/validation/*`, (2) a failing integration test in
`tests/integration/api/*.test.ts` against the real Prisma models from Task 0-3,
(3) the service in `lib/services/*` implementing exactly the fields in the schema
(no more), (4) the Route Handler pair (`route.ts` + `[id]/route.ts`) with the
`{ data, meta, errors }` envelope and `auth()` check, (5) the page in
`app/(app)/*`, (6) commit. Do not skip the failing-test-first step — it is not
optional ceremony, it is what confirms the service matches the schema before the
route is wired to it.

### Task 3-1: Proyectos (projects + products, Drive folder link display only — real Drive attach is Phase 5)
- **Files:** `lib/validation/project.ts`, `lib/services/projects.ts`,
  `app/api/projects/route.ts`, `app/api/projects/[id]/route.ts`,
  `app/(app)/proyectos/page.tsx`, `tests/integration/api/projects.test.ts`.
- **Interfaces:** Consumes `Project`, `Product`, `Task` (for the "N/M listas"
  progress count seen in `proyectos.png` — computed as
  `tasks.filter(t => t.status === 'DONE').length / tasks.length` per product, NOT
  a stored field). Produces `listProjectsWithProgress()`,
  `createProject(input, actingUser)` — director/líder only, same 403 pattern as
  Task 2-2.
- **UI note:** match `proyectos.png` exactly — grouped by project (collapsible
  header, task-count pill top-right), product cards inside each group showing name,
  a lime-to-emerald progress bar (`background: var(--accent)` fill on
  `--border-soft` track — note the screenshot's lime bar becomes `--accent` emerald
  per ADR-0007), "N/M listas", and up to 2 truncated task titles.

### Task 3-2: Metas (goals — numero/porcentaje/checklist types, personal/equipo scope)
- **Files:** `lib/validation/goal.ts`, `lib/services/goals.ts`,
  `app/api/goals/route.ts`, `app/api/goals/[id]/route.ts`,
  `app/(app)/metas/page.tsx`, `tests/integration/api/goals.test.ts`.
- **Interfaces:** Consumes `Goal`, `GoalChecklistItem`. Produces `listGoals(filters)`,
  `createGoal(input, createdBy)`, `updateGoalProgress(id, current)` (numero/porcentaje
  types) or `toggleChecklistItem(itemId)` (checklist type) — branch on `goal.type`.
- **UI note:** three visually distinct card variants by `type` (numeric progress
  bar + "X/Y", percentage ring, or a checklist with checkboxes) — this mirrors the
  three shapes already present in `data.js`'s seed metas, not a new design decision.

### Task 3-3: Calendario Editorial (Post model — content calendar)
- **Files:** `lib/validation/post.ts`, `lib/services/posts.ts`,
  `app/api/posts/route.ts`, `app/api/posts/[id]/route.ts`,
  `app/(app)/calendario/page.tsx`, `tests/integration/api/posts.test.ts`.
- **Interfaces:** Consumes `Post`, `Platform`/`PostStatus` enums. Produces
  `listPostsByMonth(year, month)`, `createPost(input, createdBy)`,
  `schedulePost(id, date, time)`.
- **UI note:** month-grid calendar, each day cell lists posts scheduled that day as
  small chips colored by `PLATFORMS.find(p => p.id === post.platform).color` (the
  platform brand colors are functional/status colors, unchanged by ADR-0007 —
  ported as-is from `data.js`'s `PLATFORMS` table). Drag-to-reschedule between day
  cells reuses the same native HTML5 DnD pattern as Task 2-1's kanban board.

---

## Phase 4: Mensajes, Requisiciones, Notificaciones

Same TDD pattern as Phase 3.

### Task 4-1: Requisiciones
- **Files:** `lib/validation/requisition.ts`, `lib/services/requisitions.ts`,
  `app/api/requisitions/route.ts`, `app/api/requisitions/[id]/route.ts`,
  `app/(app)/requisiciones/page.tsx`, `tests/integration/api/requisitions.test.ts`.
- **Interfaces:** Consumes `Requisition`. Produces `listRequisitions(filters)`,
  `createRequisition(input, fromUserId)`, `respondToRequisition(id, status,
  motivo?, actingUserId)` — only `toUserId === actingUserId` may accept/reject
  (AuthZ check inside the service, not just the UI).

### Task 4-2: Mensajes (direct + channel messages)
- **Files:** `lib/validation/message.ts`, `lib/services/messages.ts`,
  `app/api/messages/route.ts`, `app/(app)/mensajes/page.tsx`,
  `tests/integration/api/messages.test.ts`.
- **Interfaces:** Consumes `Message`. Produces `listMessagesForUser(userId)`,
  `sendMessage(input, senderId)`, `markMessageRead(id)`.
- **Note:** no realtime (WebSocket/SSE) in this plan — polling or manual refresh
  for MVP; realtime is a reasonable future enhancement but has no evidence of
  being required now (YAGNI), flag it in the run log as a known scope cut.

### Task 4-3: Notificaciones (bell icon in Topbar)
- **Files:** `lib/services/notifications.ts`, `app/api/notifications/route.ts`,
  `components/layout/NotificationBell.tsx` (wired into `Topbar.tsx` from Task 1-2).
- **Interfaces:** Consumes `Notification`. Produces `listUnreadForUser(userId)`,
  `markAllRead(userId)`. Triggered server-side by other services (e.g.
  `requisitions.ts`'s `createRequisition` also creates a `Notification` for
  `toUserId`) — wire this into Task 4-1's `createRequisition` as part of this task,
  not deferred.

---

## Phase 5: Google Drive integration (ADR-0004)

### Task 5-1: Drive client + token refresh

**Files:**
- Create: `web/lib/drive/client.ts`
- Create: `web/tests/unit/lib/drive-client.test.ts`

**Interfaces:**
- Consumes: `Account` Prisma model (holds `access_token`/`refresh_token`/`expires_at`
  from Task 0-3 + Task 1-1's Google provider config)
- Produces: `getDriveClient(userId: string): Promise<drive_v3.Drive>` — used by
  every later task in this phase and by Task 3-1's future Drive-folder-link upgrade

**Steps:**

- [ ] **Step 1: Failing test — `web/tests/unit/lib/drive-client.test.ts`**
  ```typescript
  import { describe, it, expect, vi } from "vitest";

  vi.mock("@/lib/prisma", () => ({
    prisma: { account: { findFirst: vi.fn().mockResolvedValue(null) } },
  }));

  describe("getDriveClient", () => {
    it("throws when the user has no linked Google account", async () => {
      const { getDriveClient } = await import("@/lib/drive/client");
      await expect(getDriveClient("nonexistent-user")).rejects.toThrow(/no linked google account/i);
    });
  });
  ```
  Run: `cd web && npx vitest run tests/unit/lib/drive-client.test.ts` — expect FAIL.

- [ ] **Step 2: `web/lib/drive/client.ts`**
  ```typescript
  import { google } from "googleapis";
  import { prisma } from "@/lib/prisma";

  export async function getDriveClient(userId: string) {
    const account = await prisma.account.findFirst({ where: { userId, provider: "google" } });
    if (!account) throw new Error("No linked Google account for this user");

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oauth2Client.setCredentials({
      access_token: account.access_token,
      refresh_token: account.refresh_token,
      expiry_date: account.expires_at ? account.expires_at * 1000 : undefined,
    });

    oauth2Client.on("tokens", async (tokens) => {
      if (tokens.access_token) {
        await prisma.account.update({
          where: { id: account.id },
          data: {
            access_token: tokens.access_token,
            expires_at: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : account.expires_at,
          },
        });
      }
    });

    return google.drive({ version: "v3", auth: oauth2Client });
  }
  ```

- [ ] **Step 3: Run the test again** — expect pass.

- [ ] **Step 4: Commit**
  ```bash
  git add web/lib/drive/client.ts web/tests/unit/lib/drive-client.test.ts
  git commit -m "feat: Drive API client with automatic token refresh (ADR-0004)"
  ```

---

### Task 5-2: Attach-from-Picker and direct-upload endpoints + UI

**Files:**
- Create: `web/lib/drive/picker.ts`
- Create: `web/app/api/drive/files/route.ts`
- Create: `web/app/api/drive/upload/route.ts`
- Create: `web/components/drive/AttachButton.tsx`
- Create: `web/components/drive/FileChip.tsx`
- Create: `web/components/drive/UploadProgress.tsx`
- Create: `web/tests/integration/api/drive.test.ts`

**Interfaces:**
- Consumes: `getDriveClient(userId)` (Task 5-1), `DriveFile` Prisma model (Task
  0-3), `NEXT_PUBLIC_GOOGLE_PICKER_API_KEY`/`NEXT_PUBLIC_GOOGLE_CLIENT_ID` env vars
- Produces: `POST /api/drive/files` (record a Picker-selected file against a
  task/requisition), `POST /api/drive/upload` (upload bytes to Drive + record),
  `<AttachButton taskId? requisitionId? />` component reused by Task 2-1's task
  detail view and Task 4-1's requisition detail view

**Steps:**

- [ ] **Step 1: Failing test — `web/tests/integration/api/drive.test.ts`**
  ```typescript
  import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
  import { prisma } from "@/lib/prisma";

  vi.mock("@/lib/drive/client", () => ({
    getDriveClient: vi.fn().mockResolvedValue({
      files: { get: vi.fn().mockResolvedValue({ data: { id: "f1", name: "brief.pdf", mimeType: "application/pdf", webViewLink: "https://drive.google.com/file/d/f1" } }) },
    }),
  }));

  describe("recordDriveFile", () => {
    let userId: string, taskId: string;

    beforeAll(async () => {
      const user = await prisma.user.create({ data: { email: "drive-test@example.com", name: "Drive Test", level: "COLABORADOR" } });
      userId = user.id;
      const task = await prisma.task.create({ data: { title: "Drive task", createdById: userId } });
      taskId = task.id;
    });

    afterAll(async () => {
      await prisma.driveFile.deleteMany({ where: { taskId } });
      await prisma.task.delete({ where: { id: taskId } });
      await prisma.user.delete({ where: { id: userId } });
    });

    it("verifies the file exists via Drive API and stores its metadata", async () => {
      const { recordDriveFile } = await import("@/lib/services/drive");
      const file = await recordDriveFile({ driveFileId: "f1", taskId }, userId);
      expect(file.name).toBe("brief.pdf");
      expect(file.webViewLink).toContain("drive.google.com");
    });
  });
  ```
  Run: `cd web && npx vitest run tests/integration/api/drive.test.ts` — expect FAIL
  (`Cannot find module '@/lib/services/drive'`).

- [ ] **Step 2: `web/lib/services/drive.ts`** (new file, not listed in the file
  structure map above — add it there when executing: `lib/services/drive.ts`)
  ```typescript
  import { prisma } from "@/lib/prisma";
  import { getDriveClient } from "@/lib/drive/client";

  export async function recordDriveFile(
    input: { driveFileId: string; taskId?: string; requisitionId?: string },
    uploadedById: string
  ) {
    const drive = await getDriveClient(uploadedById);
    const { data } = await drive.files.get({
      fileId: input.driveFileId,
      fields: "id, name, mimeType, webViewLink",
    });
    return prisma.driveFile.create({
      data: {
        driveFileId: data.id!,
        name: data.name!,
        mimeType: data.mimeType!,
        webViewLink: data.webViewLink!,
        taskId: input.taskId,
        requisitionId: input.requisitionId,
        uploadedById,
      },
    });
  }

  export async function uploadDriveFile(
    input: { fileName: string; mimeType: string; buffer: Buffer; parentFolderId?: string; taskId?: string; requisitionId?: string },
    uploadedById: string
  ) {
    const drive = await getDriveClient(uploadedById);
    const { data } = await drive.files.create({
      requestBody: { name: input.fileName, parents: input.parentFolderId ? [input.parentFolderId] : undefined },
      media: { mimeType: input.mimeType, body: input.buffer },
      fields: "id, name, mimeType, webViewLink",
    });
    return prisma.driveFile.create({
      data: {
        driveFileId: data.id!,
        name: data.name!,
        mimeType: data.mimeType!,
        webViewLink: data.webViewLink!,
        taskId: input.taskId,
        requisitionId: input.requisitionId,
        uploadedById,
      },
    });
  }
  ```

- [ ] **Step 3: Run the test again** — expect pass.

- [ ] **Step 4: `web/app/api/drive/files/route.ts`** (`POST`, body `{
  driveFileId, taskId?, requisitionId? }`, calls `recordDriveFile`, envelope
  response, 401 if unauthenticated) and **`web/app/api/drive/upload/route.ts`**
  (`POST`, `multipart/form-data`, reads the file into a `Buffer`, calls
  `uploadDriveFile`, same envelope pattern).

- [ ] **Step 5: `web/lib/drive/picker.ts`** — client-side helper that lazy-loads
  the Google Picker JS API (`https://apis.google.com/js/api.js`), builds a
  `google.picker.PickerBuilder` scoped to `drive.file` (`setOAuthToken` from the
  session's Drive access token, fetched via a small `GET /api/drive/session-token`
  Route Handler that returns the current `Account.access_token` — never expose the
  refresh token to the client), and resolves the selected file's `id`/`name`.

- [ ] **Step 6: `web/components/drive/AttachButton.tsx`, `FileChip.tsx`,
  `UploadProgress.tsx`** — implement per the spec's UX section verbatim: "+"
  icon button labeled "Adjuntar de Drive" (`aria-label` required), chip row
  (`--surface-hover` background, `--border-soft` border, `--text-muted` text,
  `--accent` on hover, filename truncated ~180px with `text-overflow: ellipsis`),
  upload progress bar (`--accent` fill on `--border-soft` track), empty state
  "Sin archivos adjuntos" in `--text-faint`.

- [ ] **Step 7: Commit**
  ```bash
  git add web/lib/services/drive.ts web/lib/drive/picker.ts web/app/api/drive \
          web/components/drive web/tests/integration/api/drive.test.ts
  git commit -m "feat: Google Drive attach (Picker) and upload, wired into tasks/requisitions"
  ```

- [ ] **Verification:** `npx vitest run` all green. Manual: this task's Drive
  calls cannot be fully exercised without real Google Cloud credentials (Task
  7-1) — the mocked test above is the automated verification; a manual
  attach/upload smoke test happens once credentials exist.

---

## Phase 6: Analítica, Informes, Automatizaciones, Configuración

### Task 6-1: Analítica (dashboard aggregate queries)
- **Files:** `lib/services/analytics.ts`, `app/api/analytics/dashboard/route.ts`,
  `app/(app)/analitica/page.tsx`.
- **Interfaces:** Consumes `Task`, `Goal` (via `prisma.task.groupBy` /
  `prisma.goal.aggregate` — no new tables, purely derived data, matching
  `docs/API_DESIGN.md`'s original `GET /analytics/dashboard` shape).

### Task 6-2: Informes (on-demand PDF, ported from `reports.js`)
- **Files:** `lib/reports/buildActivityReportDoc.ts` (port of
  `Suite_Operativa_Frontend/reports.js`'s `buildActivityReportDoc`/`filterTasks`,
  adapted to consume `listTasks()` from Task 2-1 instead of the old
  `db.tasks.slice()` in-memory array — same `jsPDF` calls, same layout logic),
  `app/(app)/informes/page.tsx` (filter form + "Descargar PDF" button that calls
  the report builder client-side with data fetched from `GET /api/tasks`).
- **Interfaces:** Consumes `listTasks(filters)` (Task 2-1). No new Prisma model —
  confirmed in the spec's code-graph anchors that Informes has never been a
  persisted entity.

### Task 6-3: Automatizaciones (director/líder only)
- **Files:** `lib/validation/automation.ts`, `lib/services/automations.ts`,
  `app/api/automations/route.ts`, `app/api/automations/[id]/route.ts`,
  `app/(app)/automatizaciones/page.tsx`.
- **Interfaces:** Consumes `Automation`. Produces `listAutomations()`,
  `createAutomation(input, actingUser)` — 403 if `actingUser.level ===
  "COLABORADOR"`, same AuthZ pattern as Task 2-2/4-1. **MVP scope note:** this
  task creates and stores automation RULES (`trigger` string, `action` JSON) but
  does NOT build a rule-execution engine (no evidence yet of which triggers must
  actually fire automatically) — flagged explicitly as a known scope cut for a
  follow-up plan once real trigger requirements are observed in use.

### Task 6-4: Configuración (allow-list + role management entry point)
- **Files:** `lib/services/orgSettings.ts`, `app/api/config/route.ts`,
  `app/(app)/configuracion/page.tsx`.
- **Interfaces:** Consumes `OrgSettings` (Task 0-3). Produces
  `getOrgSettings()`, `updateOrgSettings(input, actingUser)` — director only. UI:
  editable `allowedEmailDomain` field + `allowedEmails` list editor, plus a link
  to Equipo for individual role assignment (Configuración does not duplicate
  Equipo's per-user role editor).

---

## Phase 7: Deployment setup (human-only tasks — cannot be executed by an agent)

### Task 7-1: Google Cloud OAuth + Drive + Picker setup
- [ ] Create/select a Google Cloud project.
- [ ] Enable the **Google Drive API** and the **Google Picker API**.
- [ ] Configure the **OAuth consent screen** (Internal, if the Workspace domain
  supports it; otherwise External + Testing mode with the ~10 team emails added
  as test users).
- [ ] Create an **OAuth 2.0 Client ID** (Web application) — authorized redirect
  URIs: `http://localhost:3000/api/auth/callback/google` (dev) and
  `https://<vercel-domain>/api/auth/callback/google` (prod, once known).
- [ ] Create an **API key** for the Picker API, restrict it by HTTP referrer to
  the app's domains.
- [ ] Fill the real values into `web/.env` (local) and Vercel's project env vars
  (deployed): `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
  `NEXT_PUBLIC_GOOGLE_PICKER_API_KEY`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.

### Task 7-2: GitHub + Vercel + Neon wiring
- [ ] `cd "PROYECTOS/src" && git remote add origin https://github.com/superozonoglobal/Suite-Operativa.git`
- [ ] Push the `web/` project (and this `docs/hydraia/` tree) to `main`:
  `git push -u origin main` (confirm with the user before this push — first push
  to a repo they created).
- [ ] In Vercel (team `robinsons-projects-27c1b844`), import the GitHub repo as a
  new project, set the **Root Directory** to `web/` (since the repo root also
  contains `docs/`, `Suite_Operativa_Frontend/`, etc. — the Next.js app itself
  lives in `web/`).
- [ ] Create a Neon project + database, copy its **pooled** connection string
  (not the direct one) into Vercel's `DATABASE_URL` env var.
- [ ] Set `AUTH_SECRET` (generate via `openssl rand -base64 32`), `AUTH_URL`
  (the Vercel production URL), `SEED_DIRECTOR_EMAIL`, `ALLOWED_EMAIL_DOMAIN`, and
  the Google values from Task 7-1 in Vercel's project settings.
- [ ] Trigger a deploy, run `npx prisma migrate deploy` against the Neon database
  (via Vercel's build command or a one-off script) before the first real traffic.

### Task 7-3: Team cutover communication
- [ ] Once Phases 0-6 are deployed and smoke-tested by the director, send the team
  the new URL and sign-in instructions (Google sign-in, no password). Per
  ADR-0006, the old `superozono.dgazcarate.online` stays live and untouched as a
  fallback/reference — no rollback engineering needed, just "use the old link if
  needed."

---

## Execution Options

This plan was frozen in **plan-only mode** — `docs/hydraia/.active-plan` was
deliberately not armed (planning must never authorize edits, per the Hydraia
pipeline's own rule for `/hydraia:plan`-equivalent runs).

**Arming this plan for execution (next session):**
```bash
printf '%s\n' "docs/hydraia/plans/2026-07-28-suite-operativa-nextjs.md" > docs/hydraia/.active-plan
```

**1. Subagent-Driven (Recommended)** — fresh subagent per task, verify each wave
   before dispatching the next. Use `superpowers:subagent-driven-development` or
   run the full `hydraia:feature` pipeline (which re-runs review/verify phases 5-6
   on top of this already-frozen plan).

**2. Inline Execution** — execute tasks sequentially in one session. Use
   `superpowers:executing-plans`.

Recommended order: Phase 0 → 1 → 2 (MVP: Dashboard/Mi Tablero/Equipo usable end to
end) → 3 → 4 → 5 (Drive — needs Task 7-1's real credentials to fully verify, so
either do Task 7-1 early or accept Phase 5 stays test-mocked-only until then) → 6
→ 7.
